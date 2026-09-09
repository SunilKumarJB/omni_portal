"""
Tests for Omni submit/poll resilience and stage reporting.
Verifies:
1. Poll GETs retry transient failures (429/5xx and transport errors) with backoff.
2. Poll gives up after 5 consecutive failures.
3. Non-retryable non-2xx responses raise RuntimeError carrying the status and body prefix.
4. The initial submit POST retries 429/502/503/504 up to 3 attempts.
5. TEST_MODE generation still emits stages and timings.
"""

import base64
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest

from app.config import settings
from app.services import db_service, omni_service


def _completed_response() -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "id": "interaction-1",
            "status": "completed",
            "outputs": [{"type": "video", "data": base64.b64encode(b"video").decode()}],
        },
    )


@pytest.mark.anyio
async def test_poll_retries_transient_failures():
    responses = []

    def handler(request: httpx.Request) -> httpx.Response:
        responses.append((request.method, request.url.path))
        if request.method == "POST":
            return httpx.Response(200, json={"id": "interaction-1", "status": "in_progress"})
        if len(responses) == 2:
            return httpx.Response(503, text="backend unavailable")
        if len(responses) == 3:
            raise httpx.ConnectError("connection reset")
        return _completed_response()

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
        ):
            result = await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    assert result.video_bytes == b"video"
    assert len(responses) == 4  # POST + 503 + transport error + success


@pytest.mark.anyio
async def test_poll_raises_after_max_consecutive_failures():
    attempts = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            return httpx.Response(200, json={"id": "interaction-1", "status": "in_progress"})
        attempts.append(request.url.path)
        return httpx.Response(429, text="quota exceeded for project")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
            pytest.raises(RuntimeError, match="consecutive attempts"),
        ):
            await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    assert len(attempts) == omni_service._MAX_POLL_FAILURES


@pytest.mark.anyio
async def test_non_retryable_status_reports_body_prefix():
    body = "safety filter blocked the prompt. " + "x" * 800

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, text=body)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
            pytest.raises(RuntimeError) as excinfo,
        ):
            await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    message = str(excinfo.value)
    assert "HTTP 400" in message
    assert "safety filter blocked the prompt." in message
    assert body[:500] in message
    assert body not in message  # truncated to 500 characters
    assert isinstance(excinfo.value.__cause__, httpx.HTTPStatusError)


@pytest.mark.anyio
async def test_submit_retries_then_succeeds():
    posts = []

    def handler(request: httpx.Request) -> httpx.Response:
        posts.append(request.method)
        if len(posts) < 3:
            return httpx.Response(503, text="service unavailable")
        return _completed_response()

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
        ):
            result = await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    assert posts == ["POST", "POST", "POST"]
    assert result.video_bytes == b"video"


@pytest.mark.anyio
async def test_submit_gives_up_after_max_attempts():
    posts = []

    def handler(request: httpx.Request) -> httpx.Response:
        posts.append(request.method)
        return httpx.Response(429, text="quota exceeded")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
            pytest.raises(RuntimeError, match="attempts"),
        ):
            await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    assert len(posts) == omni_service._MAX_SUBMIT_ATTEMPTS


@pytest.mark.anyio
async def test_test_mode_generation_emits_stages(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", True),
        patch("asyncio.sleep", return_value=None),
    ):
        from app.api.routes.generate import _run_generation

        request_id = "test-mode-stages"
        await db_service.create_request(request_id, {"prompt": "Sample", "stage": "queued"})
        await _run_generation(request_id=request_id, prompt="Sample")

        record = await db_service.get_request(request_id)

    assert record["status"] == "completed"
    assert record["progress"] == 100
    assert record["stage"] == "completed"
    assert set(record["timings"]) == {"submitting", "generating", "finalizing"}
    assert record["generation_seconds"] >= 0


@pytest.mark.anyio
async def test_poll_continues_through_non_terminal_states():
    """A queued or otherwise non-terminal status must keep the loop polling."""
    statuses = iter(["queued", "in_progress"])

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            return httpx.Response(200, json={"id": "interaction-1", "status": "queued"})
        nxt = next(statuses, None)
        if nxt:
            return httpx.Response(200, json={"id": "interaction-1", "status": nxt})
        return _completed_response()

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("asyncio.sleep", return_value=None),
        ):
            result = await omni_service.generate_video(prompt="A quiet street", client=client)
    finally:
        await client.aclose()

    assert result.video_bytes == b"video"
