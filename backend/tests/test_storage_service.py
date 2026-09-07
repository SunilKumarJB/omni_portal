"""Tests for storage_service: verifying local and GCS logic paths."""

import asyncio
from pathlib import Path
from unittest.mock import MagicMock, patch

from app.config import settings
from app.services import storage_service


def test_upload_to_local(tmp_path: Path):
    """Verify local uploads write to disk and return local URL and storage path."""
    with patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)):
        data = b"test video content local"
        path = "req-123/video.mp4"

        public_url, storage_path = asyncio.run(storage_service._upload_to_local(data, path))

        assert public_url == "/storage/req-123/video.mp4"
        assert storage_path == str(tmp_path / path)

        saved_file = Path(storage_path)
        assert saved_file.exists()
        assert saved_file.read_bytes() == data


def test_upload_to_gcs_returns_signed_url_and_skips_local(tmp_path: Path):
    """Verify GCS uploads return signed URL without writing duplicate local files."""
    mock_blob = MagicMock()
    mock_blob.name = "req-123/video.mp4"
    mock_blob.generate_signed_url.return_value = (
        "https://storage.googleapis.com/test-bucket/req-123/video.mp4?signed=v4"
    )

    mock_bucket = MagicMock()
    mock_bucket.name = "test-bucket"
    mock_bucket.blob.return_value = mock_blob

    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "GCS_BUCKET_NAME", "test-bucket"),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
    ):
        data = b"gcs video bytes"
        path = "req-123/video.mp4"

        public_url, storage_path = asyncio.run(
            storage_service._upload_to_gcs(data, path, "video/mp4", save_local=False)
        )

        # GCS upload called with correct arguments
        mock_blob.upload_from_string.assert_called_once_with(data, content_type="video/mp4")

        # Returns signed URL, NOT local URL
        assert "signed=v4" in public_url
        assert not public_url.startswith("/storage/")
        assert storage_path == "gs://test-bucket/req-123/video.mp4"

        # Local file should NOT exist because save_local=False
        local_file = tmp_path / path
        assert not local_file.exists()


def test_upload_to_gcs_writes_local_when_requested(tmp_path: Path):
    """Verify GCS upload saves local copy when save_local is explicitly True."""
    mock_blob = MagicMock()
    mock_blob.name = "req-123/video.mp4"
    mock_blob.generate_signed_url.return_value = (
        "https://storage.googleapis.com/test-bucket/req-123/video.mp4?signed=v4"
    )

    mock_bucket = MagicMock()
    mock_bucket.name = "test-bucket"
    mock_bucket.blob.return_value = mock_blob

    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "GCS_BUCKET_NAME", "test-bucket"),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
    ):
        data = b"gcs video bytes with local duplicate"
        path = "req-123/video.mp4"

        public_url, storage_path = asyncio.run(
            storage_service._upload_to_gcs(data, path, "video/mp4", save_local=True)
        )

        mock_blob.upload_from_string.assert_called_once_with(data, content_type="video/mp4")
        assert "signed=v4" in public_url
        assert storage_path == "gs://test-bucket/req-123/video.mp4"

        # Local file DOES exist because save_local=True
        local_file = tmp_path / path
        assert local_file.exists()
        assert local_file.read_bytes() == data


def test_upload_bytes_dispatches_to_local(tmp_path: Path):
    """Verify upload_bytes calls local storage when STORAGE_BACKEND == 'local'."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "STORAGE_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        data = b"local dispatch"
        path = "req-1/asset.png"

        url, st_path = asyncio.run(storage_service.upload_bytes(data, path, "image/png"))
        assert url == "/storage/req-1/asset.png"
        assert Path(st_path).exists()


def test_upload_bytes_dispatches_to_gcs_without_local_duplicate(tmp_path: Path):
    """Verify upload_bytes calls GCS when STORAGE_BACKEND == 'gcs' without local copy."""
    mock_blob = MagicMock()
    mock_blob.name = "req-2/asset.png"
    mock_blob.generate_signed_url.return_value = (
        "https://storage.googleapis.com/prod-bucket/req-2/asset.png?signed=v4"
    )

    mock_bucket = MagicMock()
    mock_bucket.name = "prod-bucket"
    mock_bucket.blob.return_value = mock_blob

    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "GCS_BUCKET_NAME", "prod-bucket"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
    ):
        data = b"gcs dispatch"
        path = "req-2/asset.png"

        url, st_path = asyncio.run(storage_service.upload_bytes(data, path, "image/png"))

        assert "signed=v4" in url
        assert st_path == "gs://prod-bucket/req-2/asset.png"
        assert not (tmp_path / path).exists()


def test_upload_bytes_falls_back_to_local_on_gcs_error(tmp_path: Path):
    """Verify upload_bytes falls back to local storage when GCS upload fails."""
    mock_bucket = MagicMock()
    mock_bucket.blob.side_effect = RuntimeError("GCS connection timeout")

    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "STORAGE_BACKEND", "gcs"),
        patch.object(settings, "TEST_MODE", False),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
    ):
        data = b"fallback data"
        path = "req-3/fallback.mp4"

        url, st_path = asyncio.run(storage_service.upload_bytes(data, path, "video/mp4"))

        assert url == "/storage/req-3/fallback.mp4"
        assert Path(st_path).exists()
        assert Path(st_path).read_bytes() == data


def test_signed_url_fallback_to_public_url():
    """Verify _signed_url falls back to public_url if signing throws."""
    mock_blob = MagicMock()
    mock_blob.name = "test.mp4"
    mock_blob.generate_signed_url.side_effect = Exception("No private key")
    mock_blob.public_url = "https://storage.googleapis.com/test-bucket/test.mp4"

    url = storage_service._signed_url(mock_blob)
    assert url == "https://storage.googleapis.com/test-bucket/test.mp4"


def test_signed_url_caches_credentials_across_calls():
    """Verify _signed_url calls google.auth.default() once for two consecutive calls."""
    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.token = "cached-access-token"
    mock_creds.service_account_email = "sa@test-project.iam.gserviceaccount.com"

    mock_blob1 = MagicMock()
    mock_blob1.generate_signed_url.return_value = "https://storage.googleapis.com/b/1?sig=1"
    mock_blob2 = MagicMock()
    mock_blob2.generate_signed_url.return_value = "https://storage.googleapis.com/b/2?sig=2"

    storage_service._creds = None
    try:
        with patch(
            "google.auth.default", return_value=(mock_creds, "test-project")
        ) as mock_default:
            url1 = storage_service._signed_url(mock_blob1)
            url2 = storage_service._signed_url(mock_blob2)

        mock_default.assert_called_once()
        assert url1 == "https://storage.googleapis.com/b/1?sig=1"
        assert url2 == "https://storage.googleapis.com/b/2?sig=2"
        mock_creds.refresh.assert_not_called()
    finally:
        storage_service._creds = None


def test_generate_qr_bytes_memoized_per_url():
    """Verify generate_qr_bytes caches results per URL and skips re-rendering."""
    from app.services import qr_service
    import qrcode

    qr_service.generate_qr_bytes.cache_clear()
    with patch.object(qrcode, "QRCode", wraps=qrcode.QRCode) as mock_qrcode_cls:
        first = qr_service.generate_qr_bytes("https://example.com/video/req-cache-test")
        second = qr_service.generate_qr_bytes("https://example.com/video/req-cache-test")

        assert second is first
        assert mock_qrcode_cls.call_count == 1
    qr_service.generate_qr_bytes.cache_clear()


def test_get_public_url_for_gs_paths():
    """Verify get_public_url generates signed URL for gs:// paths."""
    mock_blob = MagicMock()
    mock_blob.name = "req-4/video.mp4"
    mock_blob.generate_signed_url.return_value = (
        "https://storage.googleapis.com/my-bucket/req-4/video.mp4?X-Goog-Signature=abc"
    )

    mock_bucket = MagicMock()
    mock_bucket.name = "my-bucket"
    mock_bucket.blob.return_value = mock_blob

    with patch.object(storage_service, "_get_bucket", return_value=mock_bucket):
        url = asyncio.run(storage_service.get_public_url("gs://my-bucket/req-4/video.mp4"))
        assert "X-Goog-Signature=abc" in url


def test_get_public_url_for_gs_paths_error_fallback():
    """Verify get_public_url falls back to storage.googleapis.com if signing fails."""
    mock_blob = MagicMock()
    mock_blob.name = "req-5/video.mp4"
    mock_blob.generate_signed_url.side_effect = Exception("Signing error")
    mock_blob.public_url = "https://storage.googleapis.com/my-bucket/req-5/video.mp4"

    mock_bucket = MagicMock()
    mock_bucket.name = "my-bucket"
    mock_bucket.blob.return_value = mock_blob

    with patch.object(storage_service, "_get_bucket", return_value=mock_bucket):
        url = asyncio.run(storage_service.get_public_url("gs://my-bucket/req-5/video.mp4"))
        assert url == "https://storage.googleapis.com/my-bucket/req-5/video.mp4"


def test_get_public_url_for_local_paths(tmp_path: Path):
    """Verify get_public_url converts local storage paths correctly."""
    with (
        patch.object(settings, "BASE_URL", "http://localhost:8000"),
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
    ):
        # 1. Full absolute local path
        abs_path = str(tmp_path / "req-6/video.mp4")
        assert (
            asyncio.run(storage_service.get_public_url(abs_path))
            == "http://localhost:8000/storage/req-6/video.mp4"
        )

        # 2. Path starting with /storage/
        assert (
            asyncio.run(storage_service.get_public_url("/storage/req-6/video.mp4"))
            == "http://localhost:8000/storage/req-6/video.mp4"
        )

        # 3. Relative path
        assert (
            asyncio.run(storage_service.get_public_url("req-6/video.mp4"))
            == "http://localhost:8000/storage/req-6/video.mp4"
        )

        # 4. Already full HTTP URL
        assert (
            asyncio.run(storage_service.get_public_url("https://cdn.example.com/video.mp4"))
            == "https://cdn.example.com/video.mp4"
        )


def test_read_bytes_local(tmp_path: Path):
    """Verify read_bytes reads from local path."""
    file_path = tmp_path / "test.txt"
    file_path.write_bytes(b"hello world")

    data, content_type = asyncio.run(storage_service.read_bytes(str(file_path)))
    assert data == b"hello world"
    assert "text" in content_type


def test_read_bytes_gcs():
    """Verify read_bytes reads from GCS path."""
    mock_blob = MagicMock()
    mock_blob.download_as_bytes.return_value = b"gcs remote bytes"
    mock_blob.content_type = "video/mp4"

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    with patch.object(storage_service, "_get_bucket", return_value=mock_bucket):
        data, content_type = asyncio.run(
            storage_service.read_bytes("gs://my-bucket/videos/test.mp4")
        )
        assert data == b"gcs remote bytes"
        assert content_type == "video/mp4"


def test_copy_gcs_to_local(tmp_path: Path):
    """Verify copy_gcs_to_local downloads from GCS and stores locally."""
    mock_blob = MagicMock()
    mock_blob.download_as_bytes.return_value = b"downloaded bytes"

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(storage_service, "_get_bucket", return_value=mock_bucket),
    ):
        local_url = asyncio.run(
            storage_service.copy_gcs_to_local("gs://my-bucket/in.mp4", "out.mp4")
        )
        assert local_url == "/storage/out.mp4"
        assert (tmp_path / "out.mp4").read_bytes() == b"downloaded bytes"
