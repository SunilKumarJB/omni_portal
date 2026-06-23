import pytest
from unittest.mock import AsyncMock, patch
from app.api.routes import generate


@pytest.mark.asyncio
async def test_run_generation_zero_copy():
    request_id = "test_zero_copy_123"
    prompt = "A cinematic product shot of a mascara bottle"
    style_id = "cinematic"
    theme_id = "dark_moody"
    aspect_ratio = "16:9"
    duration_seconds = 10

    # Pre-loaded bytes
    fake_product_bytes = b"fake_product_image_data"
    fake_product_mime = "image/jpeg"

    # Mock services
    mock_db_update = AsyncMock()
    mock_read_bytes = AsyncMock()
    mock_omni_generate = AsyncMock(return_value=(b"generated_video_bytes", "video/mp4"))
    mock_upload_bytes = AsyncMock(
        return_value=("http://fakeurl/video.mp4", "local_path")
    )

    with (
        patch("app.services.db_service.update_request", mock_db_update),
        patch("app.services.storage_service.read_bytes", mock_read_bytes),
        patch("app.services.omni_service.generate_video", mock_omni_generate),
        patch("app.services.storage_service.upload_bytes", mock_upload_bytes),
        patch("app.api.routes.generate.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False

        await generate._run_generation(
            request_id=request_id,
            prompt=prompt,
            style_id=style_id,
            theme_id=theme_id,
            aspect_ratio=aspect_ratio,
            duration_seconds=duration_seconds,
            product_image_bytes=fake_product_bytes,
            product_image_mime=fake_product_mime,
            # No character, audio, video
        )

        # 1. Assert read_bytes was NEVER called because we passed bytes directly (Zero-Copy)
        mock_read_bytes.assert_not_called()

        # 2. Assert omni_service.generate_video was called with the pre-loaded bytes
        mock_omni_generate.assert_called_once_with(
            prompt=prompt,
            style_id=style_id,
            theme_id=theme_id,
            aspect_ratio=aspect_ratio,
            duration_seconds=duration_seconds,
            product_image_bytes=fake_product_bytes,
            product_image_mime=fake_product_mime,
            character_image_bytes=None,
            character_image_mime=None,
            audio_bytes=None,
            audio_mime=None,
            source_video_bytes=None,
            source_video_mime=None,
        )

        # 3. Assert DB updates were called correctly
        # Starts with progress=10, 20, 30, then 90, then 100 with completed status
        mock_db_update.assert_any_call(
            request_id, {"status": "processing", "progress": 10}
        )
        mock_db_update.assert_any_call(
            request_id,
            {
                "status": "completed",
                "progress": 100,
                "video_url": "http://fakeurl/video.mp4",
            },
        )


@pytest.mark.asyncio
async def test_run_generation_fallback_to_storage():
    request_id = "test_fallback_storage_456"

    # We pass None for bytes, but provide local paths
    product_image_local = "storage/product.jpg"
    product_image_mime = "image/jpeg"

    fake_product_bytes = b"bytes_from_disk"

    mock_db_update = AsyncMock()
    # Mock read_bytes to return fake_product_bytes when called
    mock_read_bytes = AsyncMock(return_value=(fake_product_bytes, "image/jpeg"))
    mock_omni_generate = AsyncMock(return_value=(b"video_bytes", "video/mp4"))
    mock_upload_bytes = AsyncMock(
        return_value=("http://fakeurl/video.mp4", "local_path")
    )

    with (
        patch("app.services.db_service.update_request", mock_db_update),
        patch("app.services.storage_service.read_bytes", mock_read_bytes),
        patch("app.services.omni_service.generate_video", mock_omni_generate),
        patch("app.services.storage_service.upload_bytes", mock_upload_bytes),
        patch("app.api.routes.generate.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False

        await generate._run_generation(
            request_id=request_id,
            prompt="Test prompt",
            style_id="cinematic",
            theme_id="vibrant",
            aspect_ratio="16:9",
            duration_seconds=10,
            product_image_bytes=None,  # Not pre-loaded
            product_image_mime=product_image_mime,
            product_image_local=product_image_local,  # Path provided
        )

        # 1. Assert read_bytes WAS called to load from disk/storage
        mock_read_bytes.assert_called_once_with(product_image_local)

        # 2. Assert omni_service was called with those bytes
        mock_omni_generate.assert_called_once()
        assert (
            mock_omni_generate.call_args[1]["product_image_bytes"] == fake_product_bytes
        )


@pytest.mark.asyncio
async def test_run_generation_audio_fallback_resilience():
    request_id = "test_audio_fallback_789"
    prompt = "Make a commercial for Follicle Royal shampoo"

    # Audio is provided
    fake_audio_bytes = b"my_voice_clip"
    fake_audio_mime = "audio/wav"

    # Primary call raises error, fallback call succeeds
    mock_omni_generate = AsyncMock()
    mock_omni_generate.side_effect = [
        RuntimeError(
            "Pre-prod Audio generation error: speech synthesis timeout"
        ),  # First call fails
        (b"silent_fallback_video_bytes", "video/mp4"),  # Second call succeeds
    ]

    mock_db_update = AsyncMock()
    mock_upload_bytes = AsyncMock(
        return_value=("http://fakeurl/silent_video.mp4", "local_path")
    )

    with (
        patch("app.services.db_service.update_request", mock_db_update),
        patch("app.services.omni_service.generate_video", mock_omni_generate),
        patch("app.services.storage_service.upload_bytes", mock_upload_bytes),
        patch("app.api.routes.generate.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False

        await generate._run_generation(
            request_id=request_id,
            prompt=prompt,
            style_id="commercial",
            theme_id="vibrant",
            aspect_ratio="16:9",
            duration_seconds=10,
            audio_bytes=fake_audio_bytes,
            audio_mime=fake_audio_mime,
        )

        # 1. Assert omni_service.generate_video was called TWICE
        assert mock_omni_generate.call_count == 2

        # 2. First call had audio
        first_call_args = mock_omni_generate.call_args_list[0][1]
        assert first_call_args["prompt"] == prompt
        assert first_call_args["audio_bytes"] == fake_audio_bytes

        # 3. Second call stripped audio and enriched prompt for subtitles
        second_call_args = mock_omni_generate.call_args_list[1][1]
        assert "[SILENT INFOMERCIAL FALLBACK]" in second_call_args["prompt"]
        assert second_call_args["audio_bytes"] is None

        # 4. Assert DB update logged the error state and fallback status
        mock_db_update.assert_any_call(
            request_id,
            {
                "progress": 35,
                "error": "Audio generation failed (Pre-prod Audio generation error: speech synthesis timeout). Falling back gracefully to silent infomercial loop with subtitles...",
            },
        )

        # 5. Completed successfully with the silent fallback video
        mock_db_update.assert_any_call(
            request_id,
            {
                "status": "completed",
                "progress": 100,
                "video_url": "http://fakeurl/silent_video.mp4",
            },
        )
