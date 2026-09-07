"""
Tests for Server-Sent Events (SSE) streaming endpoint.
Endpoint: GET /api/generate/stream/{request_id}
Verifies:
1. 404 response for non-existent request IDs.
2. Response headers: media_type text/event-stream, Cache-Control, Connection, X-Accel-Buffering.
3. Initial event emitted immediately upon connection.
4. Intermediate progress updates streamed as status/progress/updated_at change.
5. Final event emitted on completion, stream cleanly exits.
6. Final event emitted on failure, stream cleanly exits.
7. Already-completed request yields single event and cleanly exits.
8. Client disconnect handled gracefully.
"""

import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.api.routes import generate
from app.config import settings
from app.main import app
from app.services import db_service


@pytest.mark.anyio
async def test_stream_nonexistent_request_404(tmp_path: Path):
    """Verify GET /api/generate/stream/{request_id} returns 404 for unknown request IDs."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/generate/stream/nonexistent-uuid")
            assert resp.status_code == 404
            assert resp.json()["detail"] == "Request not found"


@pytest.mark.anyio
async def test_stream_headers_and_initial_event(tmp_path: Path):
    """Verify SSE response headers and immediate initial event emission."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(generate, "STREAM_POLL_INTERVAL", 0.05),
    ):
        request_id = "test-sse-headers"
        await db_service.create_request(
            request_id,
            {"prompt": "Initial test prompt", "status": "pending", "progress": 0},
        )

        async def complete_shortly():
            await asyncio.sleep(0.08)
            await db_service.update_request(request_id, {"status": "completed", "progress": 100})

        update_task = asyncio.create_task(complete_shortly())

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/stream/{request_id}")
            assert resp.status_code == 200
            content_type = resp.headers.get("content-type", "")
            assert "text/event-stream" in content_type
            assert resp.headers.get("cache-control") == "no-cache, no-transform"
            assert resp.headers.get("connection") == "keep-alive"
            assert resp.headers.get("x-accel-buffering") == "no"

            lines = [line for line in resp.text.splitlines() if line.startswith("data: ")]
            events = [json.loads(line[6:]) for line in lines]

            assert len(events) >= 2
            assert events[0]["request_id"] == request_id
            assert events[0]["status"] == "pending"
            assert events[0]["progress"] == 0
            assert events[0]["prompt"] == "Initial test prompt"

            assert events[-1]["status"] == "completed"
            assert events[-1]["progress"] == 100

        await update_task


@pytest.mark.anyio
async def test_stream_progress_and_clean_completion(tmp_path: Path):
    """Verify stream delivers progress updates and cleanly exits on completion."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(generate, "STREAM_POLL_INTERVAL", 0.05),
    ):
        request_id = "test-sse-completion"
        await db_service.create_request(
            request_id,
            {"prompt": "Progression test prompt", "status": "pending", "progress": 5},
        )

        async def simulate_background_updates():
            await asyncio.sleep(0.08)
            await db_service.update_request(request_id, {"status": "processing", "progress": 45})
            await asyncio.sleep(0.08)
            await db_service.update_request(
                request_id,
                {
                    "status": "completed",
                    "progress": 100,
                    "video_url": "http://test/video.mp4",
                },
            )

        update_task = asyncio.create_task(simulate_background_updates())

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/stream/{request_id}")
            assert resp.status_code == 200
            lines = [line for line in resp.text.splitlines() if line.startswith("data: ")]
            events = [json.loads(line[6:]) for line in lines]

        await update_task

        assert len(events) >= 3
        assert events[0]["status"] == "pending"
        assert events[0]["progress"] == 5

        # Middle events should include processing 45
        middle = [e for e in events if e["status"] == "processing"]
        assert len(middle) >= 1
        assert middle[0]["progress"] == 45

        # Final event must be completed 100
        final = events[-1]
        assert final["status"] == "completed"
        assert final["progress"] == 100
        assert final["video_url"] == "http://test/video.mp4"


@pytest.mark.anyio
async def test_stream_failed_status_terminates(tmp_path: Path):
    """Verify stream terminates cleanly when job status becomes failed."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(generate, "STREAM_POLL_INTERVAL", 0.05),
    ):
        request_id = "test-sse-failed"
        await db_service.create_request(
            request_id,
            {"prompt": "Failing test prompt", "status": "processing", "progress": 20},
        )

        async def simulate_failure():
            await asyncio.sleep(0.08)
            await db_service.update_request(
                request_id,
                {"status": "failed", "error": "Omni processing error"},
            )

        failure_task = asyncio.create_task(simulate_failure())

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/stream/{request_id}")
            assert resp.status_code == 200
            lines = [line for line in resp.text.splitlines() if line.startswith("data: ")]
            events = [json.loads(line[6:]) for line in lines]

        await failure_task

        assert len(events) >= 2
        assert events[0]["status"] == "processing"
        final = events[-1]
        assert final["status"] == "failed"
        assert final["error"] == "Omni processing error"


@pytest.mark.anyio
async def test_stream_already_completed_request_exits_immediately(tmp_path: Path):
    """Verify already-completed request yields one final event and exits cleanly."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(generate, "STREAM_POLL_INTERVAL", 0.05),
    ):
        request_id = "test-sse-already-done"
        await db_service.create_request(
            request_id,
            {
                "prompt": "Already done prompt",
                "status": "completed",
                "progress": 100,
                "video_url": "http://test/done.mp4",
            },
        )

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/stream/{request_id}")
            assert resp.status_code == 200
            lines = [line for line in resp.text.splitlines() if line.startswith("data: ")]
            events = [json.loads(line[6:]) for line in lines]

        assert len(events) == 1
        assert events[0]["status"] == "completed"
        assert events[0]["progress"] == 100
        assert events[0]["video_url"] == "http://test/done.mp4"


@pytest.mark.anyio
async def test_stream_client_disconnect_handled(tmp_path: Path):
    """Verify event generator breaks when client disconnect is detected."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(generate, "STREAM_POLL_INTERVAL", 0.05),
    ):
        request_id = "test-sse-disconnect"
        await db_service.create_request(
            request_id,
            {"prompt": "Disconnect prompt", "status": "processing", "progress": 15},
        )

        mock_request = AsyncMock()
        # Initial call returns False, second call returns True (client disconnected)
        mock_request.is_disconnected = AsyncMock(side_effect=[False, True])

        response = await generate.stream_status(request_id, mock_request)
        assert response.status_code == 200

        chunks = []
        async for chunk in response.body_iterator:
            chunks.append(chunk)

        # Emitted initial event then cleanly broke on disconnect
        assert len(chunks) == 1
        data = json.loads(chunks[0].replace("data: ", "").strip())
        assert data["status"] == "processing"
        assert data["progress"] == 15
