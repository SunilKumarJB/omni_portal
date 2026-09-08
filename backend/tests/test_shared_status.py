import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.services import db_service, status_service


@pytest.mark.anyio
async def test_concurrent_viewers_share_reads_and_cleanup():
    reads = AsyncMock(side_effect=[{"status": "processing"}, {"status": "completed"}])
    with patch.object(db_service, "get_request", reads):
        first, release_first = status_service.acquire("shared-test")
        second, release_second = status_service.acquire("shared-test")
        assert first is second
        results = await asyncio.gather(
            first.read("shared-test", 1.5), second.read("shared-test", 1.5)
        )
        assert results == [{"status": "processing"}] * 2
        assert reads.await_count == 1
        first.read_at -= 2
        assert (await second.read("shared-test", 1.5))["status"] == "completed"
        release_first()
        assert "shared-test" in status_service._active
        release_second()
        release_second()  # Response background cleanup is safe after generator cleanup.
        assert "shared-test" not in status_service._active


@pytest.mark.anyio
async def test_reconnect_does_not_reuse_terminal_cache():
    with patch.object(
        db_service, "get_request", AsyncMock(return_value={"status": "failed"})
    ) as reads:
        entry, release = status_service.acquire("reconnect")
        await entry.read("reconnect", 1.5)
        release()
        fresh, release = status_service.acquire("reconnect")
        assert fresh is not entry
        await fresh.read("reconnect", 1.5)
        assert reads.await_count == 2
        release()
