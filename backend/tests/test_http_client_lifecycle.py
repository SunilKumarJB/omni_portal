"""
Tests for Shared HTTP Client Lifecycle (Connection Pooling).
Verifies:
1. Lifespan context manager startup and shutdown in FastAPI.
2. Connection pooling limits and timeouts on the shared httpx.AsyncClient.
3. Access to shared client via app.state.http_client and omni_service.get_http_client().
4. Fallback client creation, caching, and recreation when closed.
5. Client reuse across multiple generate_video calls and polling cycles.
6. Integration with FastAPI application and background generation task.
"""

import base64
from unittest.mock import patch

import httpx
import pytest
from app.config import settings
from app.main import app, lifespan
from app.services import db_service, omni_service, storage_service


def _get_pool_limits(client: httpx.AsyncClient):
    """Extract connection pooling limits from the underlying HTTP transport pool."""
    pool = getattr(client._transport, "_pool", None)
    if pool is not None:
        return pool._max_keepalive_connections, pool._max_connections
    return None, None


@pytest.fixture(autouse=True)
async def cleanup_http_clients():
    """Ensure clean state before and after each test."""
    omni_service.set_http_client(None)
    app.state.http_client = None
    await omni_service.close_fallback_client()
    yield
    omni_service.set_http_client(None)
    app.state.http_client = None
    await omni_service.close_fallback_client()


class TestHttpClientLifecycle:
    @pytest.mark.anyio
    async def test_lifespan_initializes_and_closes_client(self):
        """Verify lifespan initializes shared client on startup and closes it on shutdown."""
        saved_client = None
        async with lifespan(app):
            client = app.state.http_client
            saved_client = client
            assert isinstance(client, httpx.AsyncClient)
            assert not client.is_closed

            # Verify connection pooling limits on the transport pool
            max_keepalive, max_conn = _get_pool_limits(client)
            assert max_keepalive == settings.HTTP_MAX_KEEPALIVE_CONNECTIONS
            assert max_conn == settings.HTTP_MAX_CONNECTIONS
            assert max_keepalive == 50
            assert max_conn == 200

            # Verify timeout configuration
            assert client.timeout.connect == settings.HTTP_TIMEOUT_SECONDS
            assert client.timeout.read == settings.HTTP_TIMEOUT_SECONDS
            assert client.timeout.connect == 60.0

            # Verify accessibility from omni_service
            service_client = omni_service.get_http_client()
            assert service_client is client

        # After shutdown
        assert app.state.http_client is None
        assert saved_client.is_closed
        assert omni_service._shared_client is None

    @pytest.mark.anyio
    async def test_lifespan_via_fastapi_router_context(self):
        """Verify lifespan integration through the FastAPI router context."""
        saved_client = None
        async with app.router.lifespan_context(app):
            client = app.state.http_client
            saved_client = client
            assert client is not None
            assert not client.is_closed
            assert omni_service.get_http_client() is client

        assert app.state.http_client is None
        assert saved_client.is_closed

    @pytest.mark.anyio
    async def test_get_http_client_precedence(self):
        """Verify client retrieval precedence: explicit param -> shared client -> app.state -> fallback."""
        # 1. Explicit parameter takes priority
        explicit_client = httpx.AsyncClient()
        try:
            assert omni_service.get_http_client(explicit_client) is explicit_client
        finally:
            await explicit_client.aclose()

        # 2. Lifespan / set_http_client takes precedence over app.state and fallback
        shared_client = httpx.AsyncClient()
        try:
            omni_service.set_http_client(shared_client)
            assert omni_service.get_http_client() is shared_client

            # Explicit still overrides set_http_client
            another_client = httpx.AsyncClient()
            try:
                assert omni_service.get_http_client(another_client) is another_client
            finally:
                await another_client.aclose()
        finally:
            await shared_client.aclose()
            omni_service.set_http_client(None)

        # 3. Fallback client when outside lifespan
        fallback1 = omni_service.get_http_client()
        assert isinstance(fallback1, httpx.AsyncClient)
        assert not fallback1.is_closed

        # Calling again should reuse the exact same cached instance
        fallback2 = omni_service.get_http_client()
        assert fallback2 is fallback1

        # Fallback has proper limits and timeout
        max_keepalive, max_conn = _get_pool_limits(fallback1)
        assert max_keepalive == 50
        assert max_conn == 200
        assert fallback1.timeout.connect == 60.0

        # When fallback is closed, it should recreate a new open instance
        await omni_service.close_fallback_client()
        assert fallback1.is_closed
        fallback3 = omni_service.get_http_client()
        assert fallback3 is not fallback1
        assert not fallback3.is_closed

    @pytest.mark.anyio
    async def test_generate_video_reuses_client_across_calls(self):
        """Verify generate_video does not close the client and reuses it across multiple runs."""
        request_count = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal request_count
            request_count += 1
            if request.method == "POST":
                return httpx.Response(
                    200,
                    json={
                        "id": f"interaction-{request_count}",
                        "status": "completed",
                        "outputs": [
                            {"type": "video", "data": base64.b64encode(b"generated_video").decode()}
                        ],
                    },
                )
            return httpx.Response(404)

        transport = httpx.MockTransport(handler)
        shared_client = httpx.AsyncClient(transport=transport)
        try:
            omni_service.set_http_client(shared_client)

            with (
                patch.object(settings, "TEST_MODE", False),
                patch.object(omni_service, "_auth_headers", return_value={}),
            ):
                # Call 1
                video1, mime1 = await omni_service.generate_video(prompt="Prompt one")
                assert video1 == b"generated_video"
                assert mime1 == "video/mp4"
                assert request_count == 1
                assert not shared_client.is_closed

                # Call 2 with same client
                video2, mime2 = await omni_service.generate_video(prompt="Prompt two")
                assert video2 == b"generated_video"
                assert mime2 == "video/mp4"
                assert request_count == 2
                assert not shared_client.is_closed
        finally:
            await shared_client.aclose()

    @pytest.mark.anyio
    async def test_generate_video_reuses_client_during_polling(self):
        """Verify client is reused for initial POST and all polling GET requests."""
        calls = []

        def handler(request: httpx.Request) -> httpx.Response:
            calls.append((request.method, str(request.url)))
            if request.method == "POST":
                return httpx.Response(
                    200,
                    json={
                        "id": "poll-interaction-123",
                        "status": "in_progress",
                    },
                )
            elif request.method == "GET":
                if len(calls) == 2:
                    # First poll tick: still in progress
                    return httpx.Response(
                        200,
                        json={
                            "id": "poll-interaction-123",
                            "status": "in_progress",
                        },
                    )
                # Second poll tick: completed
                return httpx.Response(
                    200,
                    json={
                        "id": "poll-interaction-123",
                        "status": "completed",
                        "outputs": [
                            {"type": "video", "data": base64.b64encode(b"polled_video").decode()}
                        ],
                    },
                )
            return httpx.Response(404)

        transport = httpx.MockTransport(handler)
        shared_client = httpx.AsyncClient(transport=transport)
        try:
            with (
                patch.object(settings, "TEST_MODE", False),
                patch.object(omni_service, "_auth_headers", return_value={}),
                patch("asyncio.sleep", return_value=None),  # Instant polling
            ):
                video, mime = await omni_service.generate_video(
                    prompt="Car driving through neon city",
                    client=shared_client,
                )
                assert video == b"polled_video"
                assert mime == "video/mp4"
                assert len(calls) == 3
                assert calls[0][0] == "POST"
                assert calls[1][0] == "GET"
                assert calls[2][0] == "GET"
                # Client must remain open
                assert not shared_client.is_closed
        finally:
            await shared_client.aclose()

    @pytest.mark.anyio
    async def test_settings_connection_limits_configurable(self):
        """Verify custom connection pooling limits configured in Settings are respected."""
        with (
            patch.object(settings, "HTTP_MAX_KEEPALIVE_CONNECTIONS", 25),
            patch.object(settings, "HTTP_MAX_CONNECTIONS", 100),
            patch.object(settings, "HTTP_TIMEOUT_SECONDS", 30.0),
        ):
            async with lifespan(app):
                client = app.state.http_client
                max_keepalive, max_conn = _get_pool_limits(client)
                assert max_keepalive == 25
                assert max_conn == 100
                assert client.timeout.connect == 30.0

    @pytest.mark.anyio
    async def test_integration_generate_route_and_background_generation_with_lifespan(self):
        """Verify full POST /api/generate/video flow inside lifespan reuses shared client."""
        async with lifespan(app):
            shared_client = app.state.http_client
            assert shared_client is not None
            assert not shared_client.is_closed

            mock_upload = patch.object(
                storage_service,
                "upload_bytes",
                return_value=("http://localhost:8000/storage/video.mp4", "storage/video.mp4"),
            )
            mock_create_req = patch.object(
                db_service,
                "create_request",
                return_value=None,
            )
            mock_get_req = patch.object(
                db_service,
                "get_request",
                return_value={
                    "request_id": "test-req-123",
                    "status": "processing",
                    "progress": 5,
                    "video_page_url": "http://localhost:5173/v/test-req-123",
                    "qr_code_url": "/api/videos/test-req-123/qr.png",
                },
            )
            mock_add_task = patch("fastapi.BackgroundTasks.add_task", return_value=None)

            with mock_upload, mock_create_req, mock_get_req, mock_add_task:
                asgi_transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(
                    transport=asgi_transport, base_url="http://test"
                ) as api_client:
                    response = await api_client.post(
                        "/api/generate/video",
                        data={"prompt": "A sunset over mountains"},
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["status"] == "processing"
                    assert data["video_page_url"] == "http://localhost:5173/v/test-req-123"

            # Verify the shared client is still open and was not terminated by request handling
            assert not shared_client.is_closed
