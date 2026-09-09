"""
Tests for the video gallery: GET /api/videos listing, PATCH .../{id} visibility,
DEMO_API_KEY gating on the PATCH route, and video_url re-signing on GET .../{id}.
Verifies:
1. Listing is newest first, excludes hidden/failed by default, include_hidden and
   include_failed reveal them, limit truncates, and items never carry final_prompt.
2. A stalled processing record is reported as failed in the list without the
   record on disk being modified.
3. PATCH hides then unhides a record; GET reflects the change; unknown id -> 404.
4. DEMO_API_KEY gates PATCH but not GET (list or detail).
5. POST /api/generate/video stores product_id.
6. GET /api/videos/{id} re-signs a gs:// video_storage_path without persisting it.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.config import settings
from app.main import app
from app.services import db_service, storage_service


def _db_file(tmp_path: Path, request_id: str) -> Path:
    return tmp_path / "db" / f"{request_id}.json"


def _set_created_at(tmp_path: Path, request_id: str, when: datetime) -> None:
    path = _db_file(tmp_path, request_id)
    data = json.loads(path.read_text())
    data["created_at"] = when.isoformat()
    path.write_text(json.dumps(data))


@pytest.mark.anyio
async def test_list_order_and_default_filters(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        now = datetime.now(timezone.utc)
        await db_service.create_request(
            "req-oldest", {"status": "completed", "final_prompt": "secret prompt"}
        )
        _set_created_at(tmp_path, "req-oldest", now - timedelta(minutes=10))

        await db_service.create_request("req-middle", {"status": "completed"})
        _set_created_at(tmp_path, "req-middle", now - timedelta(minutes=5))

        await db_service.create_request("req-newest", {"status": "completed"})
        _set_created_at(tmp_path, "req-newest", now)

        await db_service.create_request("req-hidden", {"status": "completed", "hidden": True})
        _set_created_at(tmp_path, "req-hidden", now - timedelta(minutes=1))

        await db_service.create_request("req-failed", {"status": "failed", "error": "boom"})
        _set_created_at(tmp_path, "req-failed", now - timedelta(minutes=2))

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/videos")
            assert resp.status_code == 200
            items = resp.json()["items"]

            ids = [item["request_id"] for item in items]
            assert ids == ["req-newest", "req-middle", "req-oldest"]

            oldest_item = next(i for i in items if i["request_id"] == "req-oldest")
            assert "final_prompt" not in oldest_item

            resp_hidden = await client.get("/api/videos", params={"include_hidden": True})
            ids_hidden = [item["request_id"] for item in resp_hidden.json()["items"]]
            assert "req-hidden" in ids_hidden

            resp_failed = await client.get("/api/videos", params={"include_failed": True})
            ids_failed = [item["request_id"] for item in resp_failed.json()["items"]]
            assert "req-failed" in ids_failed

            resp_limited = await client.get("/api/videos", params={"limit": 2})
            assert len(resp_limited.json()["items"]) == 2


@pytest.mark.anyio
async def test_list_shows_stalled_processing_as_failed_without_writing(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "req-stalled"
        await db_service.create_request(request_id, {"status": "processing"})
        stale_time = (
            datetime.now(timezone.utc) - timedelta(seconds=settings.OMNI_STALE_SECONDS + 5)
        ).isoformat()
        path = _db_file(tmp_path, request_id)
        data = json.loads(path.read_text())
        data["updated_at"] = stale_time
        path.write_text(json.dumps(data))
        before = path.read_text()

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp_default = await client.get("/api/videos")
            default_ids = [i["request_id"] for i in resp_default.json()["items"]]
            assert request_id not in default_ids

            resp = await client.get("/api/videos", params={"include_failed": True})

        items = resp.json()["items"]
        item = next(i for i in items if i["request_id"] == request_id)
        assert item["status"] == "failed"
        assert item["error"] == db_service.STALLED_ERROR

        after = path.read_text()
        assert before == after


@pytest.mark.anyio
async def test_patch_hides_and_unhides(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "req-toggle"
        await db_service.create_request(request_id, {"status": "completed"})

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.patch(f"/api/videos/{request_id}", json={"hidden": True})
            assert resp.status_code == 200
            assert resp.json()["hidden"] is True

            get_resp = await client.get(f"/api/videos/{request_id}")
            assert get_resp.json()["hidden"] is True

            resp2 = await client.patch(f"/api/videos/{request_id}", json={"hidden": False})
            assert resp2.json()["hidden"] is False

            get_resp2 = await client.get(f"/api/videos/{request_id}")
            assert get_resp2.json()["hidden"] is False


@pytest.mark.anyio
async def test_patch_unknown_id_404(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.patch("/api/videos/does-not-exist", json={"hidden": True})
        assert resp.status_code == 404


@pytest.mark.anyio
async def test_patch_gated_by_demo_key_get_routes_open(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "DEMO_API_KEY", "super-secret"),
    ):
        request_id = "req-gated"
        await db_service.create_request(request_id, {"status": "completed"})

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp_no_key = await client.patch(f"/api/videos/{request_id}", json={"hidden": True})
            assert resp_no_key.status_code == 401

            resp_with_key = await client.patch(
                f"/api/videos/{request_id}",
                json={"hidden": True},
                headers={"X-Demo-Key": "super-secret"},
            )
            assert resp_with_key.status_code == 200

            resp_list = await client.get("/api/videos")
            assert resp_list.status_code == 200


@pytest.mark.anyio
async def test_generate_video_stores_product_id(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", True),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "A sunset over mountains", "product_id": "prod_x"},
            )
            assert resp.status_code == 200
            request_id = resp.json()["request_id"]

            get_resp = await client.get(f"/api/videos/{request_id}")
            assert get_resp.json()["product_id"] == "prod_x"


@pytest.mark.anyio
async def test_get_video_resigns_gs_storage_path(tmp_path: Path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "req-gs"
        await db_service.create_request(
            request_id,
            {
                "status": "completed",
                "video_url": "https://old-signed.example/v.mp4",
                "video_storage_path": "gs://bucket/req-gs/generated_video.mp4",
            },
        )
        path = _db_file(tmp_path, request_id)
        before = path.read_text()

        with patch.object(
            storage_service,
            "get_public_url",
            new=AsyncMock(return_value="https://signed.example/v.mp4"),
        ):
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get(f"/api/videos/{request_id}")

        assert resp.status_code == 200
        assert resp.json()["video_url"] == "https://signed.example/v.mp4"

        after = path.read_text()
        assert before == after
