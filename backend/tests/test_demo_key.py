"""
Tests for the DEMO_API_KEY gate on POST /api/generate*.
"""

from unittest.mock import patch

import httpx
import pytest

from app.config import settings
from app.main import app


@pytest.mark.anyio
async def test_post_generate_rejected_without_key_when_configured():
    with patch.object(settings, "DEMO_API_KEY", "super-secret"):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/generate/video", data={"prompt": "x"})

        assert resp.status_code == 401
        assert resp.json() == {"detail": "Missing or invalid demo key"}


@pytest.mark.anyio
async def test_post_generate_rejected_with_wrong_key():
    with patch.object(settings, "DEMO_API_KEY", "super-secret"):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "x"},
                headers={"X-Demo-Key": "wrong-key"},
            )

        assert resp.status_code == 401


@pytest.mark.anyio
async def test_post_generate_passes_through_with_correct_key():
    with (
        patch.object(settings, "DEMO_API_KEY", "super-secret"),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", True),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "A sunset over mountains"},
                headers={"X-Demo-Key": "super-secret"},
            )

        # Reaches the real route handler rather than being gated at 401.
        assert resp.status_code != 401


@pytest.mark.anyio
async def test_post_generate_not_gated_when_key_empty():
    with (
        patch.object(settings, "DEMO_API_KEY", ""),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", True),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "A sunset over mountains"},
            )

        assert resp.status_code != 401


@pytest.mark.anyio
async def test_get_generate_status_never_gated():
    with patch.object(settings, "DEMO_API_KEY", "super-secret"):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/generate/status/x")

        # Not found (no such request) rather than gated at 401.
        assert resp.status_code != 401


@pytest.mark.anyio
async def test_get_videos_route_never_gated():
    with patch.object(settings, "DEMO_API_KEY", "super-secret"):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/videos/some-request-id")

        assert resp.status_code != 401


@pytest.mark.anyio
async def test_rejection_carries_cors_headers():
    origin = settings.cors_origins[0]
    with patch.object(settings, "DEMO_API_KEY", "super-secret"):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "x"},
                headers={"Origin": origin},
            )

    assert resp.status_code == 401
    assert resp.headers.get("access-control-allow-origin") == origin
