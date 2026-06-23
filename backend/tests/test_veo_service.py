import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services import veo_service


@pytest.mark.asyncio
async def test_veo_generate_video():
    prompt = "A high-tech electric car zooming down a neon highway"
    style_id = "cinematic"
    theme_id = "vibrant"

    # Mock operations
    mock_operation = MagicMock()
    mock_operation.done = False

    # Second mock operation represents completed state
    mock_completed_operation = MagicMock()
    mock_completed_operation.done = True

    mock_video = MagicMock()
    mock_video.video.uri = "gs://omni-video-demo/generated_videos/test_video.mp4"
    mock_completed_operation.result.generated_videos = [mock_video]

    # Async methods on mock client
    mock_generate_videos = AsyncMock(return_value=mock_operation)
    mock_get_operation = AsyncMock(return_value=mock_completed_operation)

    mock_client = MagicMock()
    mock_client.aio.models.generate_videos = mock_generate_videos
    mock_client.aio.operations.get = mock_get_operation

    with (
        patch("app.services.veo_service._get_client", return_value=mock_client),
        patch("app.services.veo_service.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False
        mock_settings.VEO_MODEL = "veo-3.0-generate-preview"
        mock_settings.GCS_BUCKET_NAME = "omni-video-demo"

        # We also mock asyncio.sleep to run the polling instantly
        with patch("asyncio.sleep", AsyncMock()) as mock_sleep:
            video_uri = await veo_service.generate_video(
                prompt=prompt,
                style_id=style_id,
                theme_id=theme_id,
                aspect_ratio="16:9",
                duration_seconds=8,
            )

            assert video_uri == "gs://omni-video-demo/generated_videos/test_video.mp4"

            # Assert generate_videos was called
            assert mock_generate_videos.call_count == 1
            call_args = mock_generate_videos.call_args[1]
            assert call_args["model"] == "veo-3.0-generate-preview"
            assert "A high-tech electric car" in call_args["prompt"]

            # Assert operations.get was called to poll
            assert mock_get_operation.call_count == 1
            mock_get_operation.assert_called_with(mock_operation)

            # Assert sleep was called during polling
            assert mock_sleep.call_count == 1
