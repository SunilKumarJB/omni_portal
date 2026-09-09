"""
Tests for GET /health/deep and the lifespan startup warm-up.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.config import settings
from app.main import _warmup, app
from app.services import db_service, omni_service, storage_service


@pytest.mark.anyio
async def test_health_deep_all_skipped_in_test_mode():
    """TEST_MODE short-circuits every check."""
    with patch.object(settings, "TEST_MODE", True):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health/deep")

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        for check in data["checks"].values():
            assert check["ok"] is True
            assert check.get("skipped") is True


@pytest.mark.anyio
async def test_health_deep_ok_when_backends_healthy():
    """All checks succeed -> status ok, HTTP 200, with ok/ms/error shape."""
    mock_bucket = MagicMock()
    mock_bucket.exists.return_value = True

    mock_doc_ref = MagicMock()
    mock_doc_ref.get = AsyncMock(return_value=MagicMock())
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc_ref
    mock_firestore = MagicMock()
    mock_firestore.collection.return_value = mock_collection

    with (
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "DB_BACKEND", "firestore"),
        patch.object(omni_service, "_get_cached_token", AsyncMock(return_value="tok")),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
        patch.object(db_service, "_get_firestore", return_value=mock_firestore),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health/deep")

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        for name in ("token", "gcs", "firestore"):
            check = data["checks"][name]
            assert check["ok"] is True
            assert isinstance(check["ms"], int)
            assert check["error"] is None


@pytest.mark.anyio
async def test_health_deep_degraded_on_token_failure():
    """A failing check reports ok=False with the error string, status degraded, HTTP 503."""
    with (
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "STORAGE_BACKEND", "local"),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(
            omni_service,
            "_get_cached_token",
            AsyncMock(side_effect=RuntimeError("no ADC available")),
        ),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health/deep")

        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "degraded"
        assert data["checks"]["token"]["ok"] is False
        assert "no ADC available" in data["checks"]["token"]["error"]
        # Non-gcs/firestore backends are skipped, not failed.
        assert data["checks"]["gcs"] == {"ok": True, "skipped": True}
        assert data["checks"]["firestore"] == {"ok": True, "skipped": True}


@pytest.mark.anyio
async def test_health_deep_skips_gcs_and_firestore_for_local_backends():
    with (
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "STORAGE_BACKEND", "local"),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(omni_service, "_get_cached_token", AsyncMock(return_value="tok")),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health/deep")

        assert resp.status_code == 200
        data = resp.json()
        assert data["checks"]["gcs"] == {"ok": True, "skipped": True}
        assert data["checks"]["firestore"] == {"ok": True, "skipped": True}


@pytest.mark.anyio
async def test_health_deep_gcs_failure_reports_error():
    with (
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(omni_service, "_get_cached_token", AsyncMock(return_value="tok")),
        patch.object(storage_service, "_get_bucket", side_effect=RuntimeError("bucket boom")),
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health/deep")

        assert resp.status_code == 503
        data = resp.json()
        assert data["checks"]["gcs"]["ok"] is False
        assert "bucket boom" in data["checks"]["gcs"]["error"]


@pytest.mark.anyio
async def test_warmup_is_best_effort_and_never_raises():
    """_warmup swallows failures from token/bucket/firestore setup."""
    with (
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "DB_BACKEND", "firestore"),
        patch.object(
            omni_service,
            "_get_cached_token",
            AsyncMock(side_effect=RuntimeError("no ADC")),
        ),
    ):
        await _warmup()  # must not raise


@pytest.mark.anyio
async def test_warmup_calls_token_bucket_and_firestore_setup():
    with (
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "DB_BACKEND", "firestore"),
        patch.object(
            omni_service, "_get_cached_token", AsyncMock(return_value="tok")
        ) as mock_token,
        patch.object(storage_service, "_get_bucket") as mock_bucket,
        patch.object(db_service, "_get_firestore") as mock_firestore,
    ):
        await _warmup()

        mock_token.assert_awaited_once()
        mock_bucket.assert_called_once()
        mock_firestore.assert_called_once()


@pytest.mark.anyio
async def test_lifespan_runs_warmup_when_not_test_mode():
    from app.main import lifespan

    with (
        patch.object(settings, "TEST_MODE", False),
        patch.object(settings, "STORAGE_BACKEND", "local"),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(
            omni_service, "_get_cached_token", AsyncMock(return_value="tok")
        ) as mock_token,
    ):
        async with lifespan(app):
            pass

        mock_token.assert_awaited_once()


@pytest.mark.anyio
async def test_lifespan_skips_warmup_in_test_mode():
    from app.main import lifespan

    with (
        patch.object(settings, "TEST_MODE", True),
        patch.object(
            omni_service, "_get_cached_token", AsyncMock(return_value="tok")
        ) as mock_token,
    ):
        async with lifespan(app):
            pass

        mock_token.assert_not_awaited()
