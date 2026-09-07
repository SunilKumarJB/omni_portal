"""
Tests for on-demand QR code generation and removal of synchronous QR uploads from POST path.
Verifies:
1. POST /api/generate/video sets video_page_url and qr_code_url without blocking on QR generation or storage upload.
2. GET /api/videos/{request_id}/qr.png returns QR PNG bytes with Cache-Control headers.
3. Fallback mechanism to generate_qr_bytes_simple if styled QR generation fails.
4. GET /api/videos/{request_id} returns record containing the on-demand qr_code_url.
"""

from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.config import settings
from app.main import app
from app.services import db_service, qr_service, storage_service


@pytest.mark.anyio
async def test_generate_video_does_not_block_on_qr_upload(tmp_path: Path):
    """
    Verify POST /api/generate/video sets video_page_url and qr_code_url
    without invoking qr_service.generate_qr_bytes or uploading qr_code.png to storage.
    """
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", True),
        patch.object(qr_service, "generate_qr_bytes") as mock_gen_qr,
        patch.object(storage_service, "upload_bytes", new_callable=AsyncMock) as mock_upload,
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/generate/video",
                data={"prompt": "A futuristic city in neon rain"},
            )
            assert resp.status_code == 200
            data = resp.json()
            request_id = data["request_id"]

            # QR code generation and upload should NOT have been called in POST path
            mock_gen_qr.assert_not_called()
            for call in mock_upload.call_args_list:
                args, _ = call
                assert "qr_code.png" not in args[1]

            # URLs are correctly populated on the returned record
            assert data["video_page_url"] == qr_service.video_page_url(request_id)
            assert data["qr_code_url"] == f"/api/videos/{request_id}/qr.png"

            # Check DB record directly
            record = await db_service.get_request(request_id)
            assert record is not None
            assert record["video_page_url"] == qr_service.video_page_url(request_id)
            assert record["qr_code_url"] == f"/api/videos/{request_id}/qr.png"


@pytest.mark.anyio
async def test_get_video_qr_returns_image():
    """
    Verify GET /api/videos/{request_id}/qr.png generates QR code on-demand,
    returns media_type image/png, and includes Cache-Control header.
    """
    request_id = "test-qr-req-123"
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/videos/{request_id}/qr.png")

        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/png"
        assert "public, max-age=86400" in resp.headers["cache-control"]

        # Valid PNG magic header bytes
        assert resp.content.startswith(b"\x89PNG\r\n\x1a\n")


@pytest.mark.anyio
async def test_get_video_qr_fallback_on_exception():
    """
    Verify GET /api/videos/{request_id}/qr.png falls back to generate_qr_bytes_simple
    if generate_qr_bytes raises an exception.
    """
    request_id = "test-qr-fallback-456"
    expected_simple_qr = qr_service.generate_qr_bytes_simple(qr_service.video_page_url(request_id))

    with patch.object(
        qr_service, "generate_qr_bytes", side_effect=RuntimeError("PIL style drawer failed")
    ):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/videos/{request_id}/qr.png")

            assert resp.status_code == 200
            assert resp.headers["content-type"] == "image/png"
            assert "public, max-age=86400" in resp.headers["cache-control"]
            assert resp.content == expected_simple_qr


@pytest.mark.anyio
async def test_get_video_record_includes_on_demand_qr_url(tmp_path: Path):
    """
    Verify GET /api/videos/{request_id} returns the status object containing qr_code_url.
    """
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
    ):
        request_id = "qr-record-test-789"
        await db_service.create_request(
            request_id,
            {
                "prompt": "Test video",
                "video_page_url": qr_service.video_page_url(request_id),
                "qr_code_url": f"/api/videos/{request_id}/qr.png",
            },
        )

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/videos/{request_id}")
            assert resp.status_code == 200
            data = resp.json()
            assert data["qr_code_url"] == f"/api/videos/{request_id}/qr.png"
            assert data["video_page_url"] == qr_service.video_page_url(request_id)
