import json
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest

from app.config import settings
from app.main import app
from app.services import db_service


@pytest.mark.anyio
async def test_pagination_passes_hidden_history_and_preserves_equal_time_rows(tmp_path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
    ):
        directory = tmp_path / "db"
        directory.mkdir()
        for i in range(210):
            record = dict(
                request_id=f"{i:03}",
                status="completed",
                hidden=i >= 5,
                created_at="2026-01-01T00:00:00+00:00",
                updated_at="2026-01-01T00:00:00+00:00",
            )
            (directory / f"{i:03}.json").write_text(json.dumps(record))
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            first = (await client.get("/api/videos", params={"limit": 2})).json()
            assert [r["request_id"] for r in first["items"]] == ["004", "003"]
            # A newer insertion and a deleted cursor row do not duplicate/skip older records.
            (directory / "003.json").unlink()
            second = (
                await client.get("/api/videos", params={"limit": 2, "cursor": first["next_cursor"]})
            ).json()
            assert [r["request_id"] for r in second["items"]] == ["002", "001"]
            third = (
                await client.get(
                    "/api/videos", params={"limit": 2, "cursor": second["next_cursor"]}
                )
            ).json()
            assert [r["request_id"] for r in third["items"]] == ["000"]
            assert third["next_cursor"] is None
            assert (await client.get("/api/videos", params={"cursor": "broken"})).status_code == 400


@pytest.mark.anyio
async def test_local_listing_reuses_json_and_sees_external_edits(tmp_path):
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
    ):
        await db_service.create_request("one", {"status": "completed"})
        original_read = Path.read_text
        reads = []

        def read(path, *args, **kwargs):
            reads.append(path)
            return original_read(path, *args, **kwargs)

        with patch.object(Path, "read_text", read):
            await db_service.list_requests(2)
            await db_service.list_requests(2)
            assert len(reads) == 1
            path = tmp_path / "db/one.json"
            record = json.loads(original_read(path))
            record["hidden"] = True
            path.write_text(json.dumps(record))
            assert (await db_service.list_requests(2))[0]["hidden"] is True
            assert len(reads) == 2
            await db_service.update_request("one", {"hidden": False})
            assert (await db_service.list_requests(2))[0]["hidden"] is False
            path.unlink()
            assert await db_service.list_requests(2) == []


@pytest.mark.anyio
async def test_firestore_cursor_uses_bounded_stable_query():
    from google.auth.credentials import AnonymousCredentials
    from google.cloud import firestore
    from google.cloud.firestore_v1.async_query import AsyncQuery

    client = firestore.AsyncClient(project="test-project", credentials=AnonymousCredentials())
    queries = []

    async def stream(query, *args, **kwargs):
        queries.append(query._to_protobuf())
        if False:
            yield None

    with (
        patch.object(settings, "DB_BACKEND", "firestore"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(db_service, "_get_firestore", return_value=client),
        patch.object(AsyncQuery, "stream", stream),
    ):
        cursor = db_service.encode_cursor({"created_at": "2026-01-01", "request_id": "previous"})
        assert await db_service.list_requests(25, cursor) == []
    query = queries[0]
    assert query.limit == 25
    assert [order.field.field_path for order in query.order_by] == ["created_at", "__name__"]
    assert query.start_at.values[0].string_value == "2026-01-01"
    assert query.start_at.values[1].reference_value.endswith("/video_requests/previous")
    assert query.start_at.before is False
