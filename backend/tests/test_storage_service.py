import asyncio
from unittest.mock import MagicMock, patch

import pytest

from app.services import storage_service


@pytest.mark.asyncio
async def test_upload_to_gcs_offloading():
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    # Patch _get_bucket to return our mock bucket
    with patch("app.services.storage_service._get_bucket", return_value=mock_bucket):
        # We patch asyncio.to_thread to track if it's called
        with patch("asyncio.to_thread", side_effect=asyncio.to_thread) as mock_to_thread:
            url, gs_path = await storage_service._upload_to_gcs(
                b"fake_data", "test/path.jpg", "image/jpeg"
            )

            # Verify that to_thread was called to run GCS blocking operations in background threads
            assert mock_to_thread.call_count >= 2
            mock_to_thread.assert_any_call(
                mock_blob.upload_from_string,
                b"fake_data",
                content_type="image/jpeg",
            )
            # We now mint a v4 signed URL (offloaded to a thread) instead of
            # make_public(), which 403s on Uniform Bucket-Level Access buckets.
            mock_to_thread.assert_any_call(storage_service._signed_url, mock_blob)
            mock_blob.make_public.assert_not_called()
