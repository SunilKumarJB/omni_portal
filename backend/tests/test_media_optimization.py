"""
Unit and integration tests for Step 4: Media Inputs Optimization — GCS URIs.

Verifies:
1. omni_service._media_payload:
   - uri generates {"type": media_type, "mime_type": mime_type, "uri": uri}
   - data generates {"type": media_type, "mime_type": mime_type, "data": base64...}
   - both uri and data prioritizes uri
   - neither raises ValueError
2. omni_service._enrich_prompt:
   - handles character_image_uri and character_image_bytes
   - handles audio_uri and audio_bytes
   - handles source_video_uri and source_video_bytes
3. omni_service.generate_video:
   - correctly constructs payload input entries for URIs vs bytes
4. generate.py endpoint (/api/generate/video):
   - GCS-backed uploads capture gs:// storage paths and pass them as URIs
   - bytes are cleared from memory when GCS URIs are present
   - local storage backend retains bytes and passes None for URIs
5. generate.py _run_generation:
   - handles GCS URIs without reading assets
   - handles local storage paths by reading bytes
   - silent audio fallback works when audio was supplied as a GCS URI
"""

import base64
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.config import settings
from app.main import app
from app.services import db_service, omni_service, storage_service


# ---------------------------------------------------------------------------
# 1. Unit tests for _media_payload
# ---------------------------------------------------------------------------
class TestMediaPayload:
    def test_media_payload_with_uri(self):
        result = omni_service._media_payload(
            uri="gs://my-bucket/character.png",
            media_type="image",
            mime_type="image/png",
        )
        assert result == {
            "type": "image",
            "mime_type": "image/png",
            "uri": "gs://my-bucket/character.png",
        }
        assert "data" not in result

    def test_media_payload_with_data(self):
        raw_data = b"image_binary_content"
        result = omni_service._media_payload(
            data=raw_data,
            media_type="image",
            mime_type="image/png",
        )
        assert result == {
            "type": "image",
            "mime_type": "image/png",
            "data": base64.b64encode(raw_data).decode(),
        }
        assert "uri" not in result

    def test_media_payload_prefers_uri_over_data(self):
        raw_data = b"image_binary_content"
        result = omni_service._media_payload(
            data=raw_data,
            uri="gs://my-bucket/character.png",
            media_type="image",
            mime_type="image/png",
        )
        assert result == {
            "type": "image",
            "mime_type": "image/png",
            "uri": "gs://my-bucket/character.png",
        }
        assert "data" not in result

    def test_media_payload_missing_both_raises_value_error(self):
        with pytest.raises(ValueError, match="Either uri or data must be provided"):
            omni_service._media_payload(
                media_type="image",
                mime_type="image/png",
            )

    def test_media_payload_audio_and_video(self):
        audio_res = omni_service._media_payload(
            uri="gs://my-bucket/voice.wav",
            media_type="audio",
            mime_type="audio/wav",
        )
        assert audio_res == {
            "type": "audio",
            "mime_type": "audio/wav",
            "uri": "gs://my-bucket/voice.wav",
        }

        video_res = omni_service._media_payload(
            data=b"video_bytes",
            media_type="video",
            mime_type="video/mp4",
        )
        assert video_res == {
            "type": "video",
            "mime_type": "video/mp4",
            "data": base64.b64encode(b"video_bytes").decode(),
        }


# ---------------------------------------------------------------------------
# 2. Unit tests for _enrich_prompt
# ---------------------------------------------------------------------------
class TestEnrichPrompt:
    def test_enrich_prompt_character_uri(self):
        prompt = omni_service._enrich_prompt(
            prompt="A man drinking coffee in a cafe",
            character_image_uri="gs://bucket/hero.png",
        )
        assert "Use [REF_Character] as the main character in the video." in prompt

    def test_enrich_prompt_character_bytes(self):
        prompt = omni_service._enrich_prompt(
            prompt="A man drinking coffee in a cafe",
            character_image_bytes=b"raw_bytes",
        )
        assert "Use [REF_Character] as the main character in the video." in prompt

    def test_enrich_prompt_does_not_duplicate_character_ref(self):
        prompt = omni_service._enrich_prompt(
            prompt="A scene featuring [REF_Character] dancing",
            character_image_uri="gs://bucket/hero.png",
        )
        assert prompt.count("[REF_Character]") == 1

    def test_enrich_prompt_audio_uri(self):
        prompt = omni_service._enrich_prompt(
            prompt="A concert performance",
            audio_uri="gs://bucket/song.wav",
        )
        assert (
            "Synchronize with the provided audio track, including lip-sync where applicable."
            in prompt
        )

    def test_enrich_prompt_video_v2v_uri(self):
        prompt = omni_service._enrich_prompt(
            prompt="Make it look like anime",
            source_video_uri="gs://bucket/original.mp4",
        )
        assert (
            "Apply the described changes to the source video while keeping the core scene intact."
            in prompt
        )

    def test_enrich_prompt_dialogue_and_language(self):
        prompt = omni_service._enrich_prompt(
            prompt="A chef speaking",
            dialogue="Welcome to my restaurant",
            language="hi",
        )
        assert (
            'The character speaks the following line in Hindi, with natural, accurate lip-sync: "Welcome to my restaurant"'
            in prompt
        )


# ---------------------------------------------------------------------------
# 3. Unit tests for omni_service.generate_video payload composition
# ---------------------------------------------------------------------------
class TestOmniGenerateVideoPayload:
    @pytest.mark.anyio
    async def test_generate_video_sends_gcs_uris_in_payload(self):
        mock_response_post = MagicMock()
        mock_response_post.status_code = 200
        mock_response_post.json.return_value = {
            "id": "interaction-123",
            "status": "completed",
            "outputs": [{"type": "video", "data": base64.b64encode(b"dummy_video").decode()}],
        }

        captured_json = {}

        async def mock_post(url, headers=None, json=None):
            nonlocal captured_json
            captured_json = json
            return mock_response_post

        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("httpx.AsyncClient.post", side_effect=mock_post),
        ):
            video_bytes, mime = await omni_service.generate_video(
                prompt="Futuristic car racing",
                character_image_uri="gs://my-bucket/driver.png",
                character_image_mime="image/png",
                audio_uri="gs://my-bucket/engine.wav",
                audio_mime="audio/wav",
                source_video_uri="gs://my-bucket/scene.mp4",
                source_video_mime="video/mp4",
            )
            assert video_bytes == b"dummy_video"
            assert mime == "video/mp4"

            inputs = captured_json.get("input", [])
            assert len(inputs) == 4  # text + 3 media inputs

            image_input = next(item for item in inputs if item.get("type") == "image")
            assert image_input["uri"] == "gs://my-bucket/driver.png"
            assert "data" not in image_input

            audio_input = next(item for item in inputs if item.get("type") == "audio")
            assert audio_input["uri"] == "gs://my-bucket/engine.wav"
            assert "data" not in audio_input

            video_input = next(item for item in inputs if item.get("type") == "video")
            assert video_input["uri"] == "gs://my-bucket/scene.mp4"
            assert "data" not in video_input

    @pytest.mark.anyio
    async def test_generate_video_sends_base64_data_when_bytes_provided(self):
        mock_response_post = MagicMock()
        mock_response_post.status_code = 200
        mock_response_post.json.return_value = {
            "id": "interaction-456",
            "status": "completed",
            "outputs": [{"type": "video", "data": base64.b64encode(b"dummy_video").decode()}],
        }

        captured_json = {}

        async def mock_post(url, headers=None, json=None):
            nonlocal captured_json
            captured_json = json
            return mock_response_post

        raw_char = b"character_bytes"
        with (
            patch.object(settings, "TEST_MODE", False),
            patch.object(omni_service, "_auth_headers", return_value={}),
            patch("httpx.AsyncClient.post", side_effect=mock_post),
        ):
            await omni_service.generate_video(
                prompt="Futuristic city",
                character_image_bytes=raw_char,
                character_image_mime="image/png",
            )

            inputs = captured_json.get("input", [])
            image_input = next(item for item in inputs if item.get("type") == "image")
            assert image_input["data"] == base64.b64encode(raw_char).decode()
            assert "uri" not in image_input


# ---------------------------------------------------------------------------
# 4. Tests for generate.py _run_generation handling
# ---------------------------------------------------------------------------
class TestRunGenerationMediaInputs:
    @pytest.mark.anyio
    async def test_run_generation_with_gcs_uris_skips_reading_assets(self, tmp_path: Path):
        request_id = "test-req-gcs-uris"
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            from app.api.routes.generate import _run_generation

            await db_service.create_request(request_id, {"prompt": "City drone shot"})

            mock_generate = AsyncMock(return_value=(b"generated_mp4", "video/mp4"))
            mock_read_asset = AsyncMock()

            with (
                patch.object(omni_service, "generate_video", mock_generate),
                patch("app.api.routes.generate._read_asset", mock_read_asset),
                patch.object(
                    storage_service,
                    "upload_bytes",
                    return_value=("https://storage.googleapis.com/video.mp4", "gs://b/video.mp4"),
                ),
            ):
                await _run_generation(
                    request_id=request_id,
                    prompt="City drone shot",
                    character_image_local="gs://omni-bucket/char.png",
                    character_image_mime="image/png",
                    audio_local="gs://omni-bucket/sound.wav",
                    audio_mime="audio/wav",
                    source_video_local="gs://omni-bucket/source.mp4",
                    source_video_mime="video/mp4",
                )

                # Assets should NOT have been read from storage because they are GCS URIs
                mock_read_asset.assert_not_called()

                # omni_service.generate_video should have received URIs and None for bytes
                mock_generate.assert_called_once()
                call_kwargs = mock_generate.call_args.kwargs
                assert call_kwargs["character_image_uri"] == "gs://omni-bucket/char.png"
                assert call_kwargs["character_image_bytes"] is None
                assert call_kwargs["audio_uri"] == "gs://omni-bucket/sound.wav"
                assert call_kwargs["audio_bytes"] is None
                assert call_kwargs["source_video_uri"] == "gs://omni-bucket/source.mp4"
                assert call_kwargs["source_video_bytes"] is None

    @pytest.mark.anyio
    async def test_run_generation_falls_back_to_local_bytes(self, tmp_path: Path):
        request_id = "test-req-local-bytes"
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            from app.api.routes.generate import _run_generation

            await db_service.create_request(request_id, {"prompt": "Cozy living room"})

            local_char_file = tmp_path / "char.png"
            local_char_file.write_bytes(b"local_png_bytes")

            mock_generate = AsyncMock(return_value=(b"generated_mp4", "video/mp4"))

            with (
                patch.object(omni_service, "generate_video", mock_generate),
                patch.object(
                    storage_service,
                    "upload_bytes",
                    return_value=("/storage/video.mp4", str(tmp_path / "video.mp4")),
                ),
            ):
                await _run_generation(
                    request_id=request_id,
                    prompt="Cozy living room",
                    character_image_local=str(local_char_file),
                    character_image_mime="image/png",
                )

                mock_generate.assert_called_once()
                call_kwargs = mock_generate.call_args.kwargs
                assert call_kwargs["character_image_uri"] is None
                assert call_kwargs["character_image_bytes"] == b"local_png_bytes"

    @pytest.mark.anyio
    async def test_run_generation_silent_fallback_with_audio_uri(self, tmp_path: Path):
        """
        Verify that when primary generation fails with audio provided via GCS URI,
        the fallback retries without audio (audio_uri=None, audio_bytes=None)
        and adds the silent subtitle prompt.
        """
        request_id = "test-req-audio-uri-fallback"
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            from app.api.routes.generate import _run_generation

            await db_service.create_request(request_id, {"prompt": "A toy infomercial"})

            # First attempt fails; fallback attempt succeeds
            mock_generate = AsyncMock(
                side_effect=[
                    RuntimeError("Omni audio track synthesis error"),
                    (b"fallback_silent_video", "video/mp4"),
                ]
            )

            with (
                patch.object(omni_service, "generate_video", mock_generate),
                patch.object(
                    storage_service,
                    "upload_bytes",
                    return_value=("/storage/video.mp4", str(tmp_path / "video.mp4")),
                ),
            ):
                await _run_generation(
                    request_id=request_id,
                    prompt="A toy infomercial",
                    audio_uri="gs://omni-bucket/voiceover.wav",
                    audio_mime="audio/wav",
                )

                assert mock_generate.call_count == 2
                # Primary call had audio_uri
                primary_call = mock_generate.call_args_list[0].kwargs
                assert primary_call["audio_uri"] == "gs://omni-bucket/voiceover.wav"

                # Fallback call stripped audio_uri and audio_bytes
                fallback_call = mock_generate.call_args_list[1].kwargs
                assert fallback_call["audio_uri"] is None
                assert fallback_call["audio_bytes"] is None
                assert "[SILENT INFOMERCIAL FALLBACK]" in fallback_call["prompt"]

                record = await db_service.get_request(request_id)
                assert record["status"] == "completed"


# ---------------------------------------------------------------------------
# 5. Integration tests for POST /api/generate/video endpoint
# ---------------------------------------------------------------------------
class TestGenerateEndpointMediaInputs:
    @pytest.mark.anyio
    async def test_endpoint_captures_gcs_uris_and_frees_bytes(self, tmp_path: Path):
        """
        When storage_service.upload_bytes returns gs:// storage paths,
        the endpoint should pass character_image_uri to _run_generation
        and pass None for character_image_bytes.
        """
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            captured_bg_args = {}

            def mock_add_task(func, **kwargs):
                nonlocal captured_bg_args
                captured_bg_args = kwargs

            # Mock upload_bytes to return a gs:// URI
            async def mock_upload_bytes(data, path, content_type, save_local=False):
                return (
                    f"https://storage.googleapis.com/test-bucket/{path}",
                    f"gs://test-bucket/{path}",
                )

            with (
                patch.object(storage_service, "upload_bytes", side_effect=mock_upload_bytes),
                patch("fastapi.BackgroundTasks.add_task", side_effect=mock_add_task),
            ):
                transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                    files = {
                        "character_image": (
                            "avatar.png",
                            b"png_content_data",
                            "image/png",
                        ),
                        "audio_file": (
                            "speech.wav",
                            b"wav_content_data",
                            "audio/wav",
                        ),
                    }
                    resp = await client.post(
                        "/api/generate/video",
                        data={"prompt": "A cyber detective"},
                        files=files,
                    )
                    assert resp.status_code == 200

                    # Check that gs:// URIs were captured and passed to background task
                    assert (
                        captured_bg_args["character_image_uri"]
                        == f"gs://test-bucket/{captured_bg_args['request_id']}/character.png"
                    )
                    assert (
                        captured_bg_args["audio_uri"]
                        == f"gs://test-bucket/{captured_bg_args['request_id']}/audio.wav"
                    )

                    # Large bytes should have been freed (None) to avoid memory overhead
                    assert captured_bg_args["character_image_bytes"] is None
                    assert captured_bg_args["audio_bytes"] is None

    @pytest.mark.anyio
    async def test_endpoint_with_local_storage_passes_bytes(self, tmp_path: Path):
        """
        When storage_service.upload_bytes returns local filesystem paths (not gs://),
        the endpoint should pass character_image_bytes to _run_generation
        and pass None for character_image_uri.
        """
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            captured_bg_args = {}

            def mock_add_task(func, **kwargs):
                nonlocal captured_bg_args
                captured_bg_args = kwargs

            # Mock upload_bytes to return local path
            async def mock_upload_bytes(data, path, content_type, save_local=False):
                return (
                    f"/storage/{path}",
                    str(tmp_path / path),
                )

            with (
                patch.object(storage_service, "upload_bytes", side_effect=mock_upload_bytes),
                patch("fastapi.BackgroundTasks.add_task", side_effect=mock_add_task),
            ):
                transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                    files = {
                        "character_image": (
                            "avatar.png",
                            b"png_content_data",
                            "image/png",
                        ),
                    }
                    resp = await client.post(
                        "/api/generate/video",
                        data={"prompt": "A friendly robot"},
                        files=files,
                    )
                    assert resp.status_code == 200

                    # For local storage, URIs are None and bytes are preserved
                    assert captured_bg_args["character_image_uri"] is None
                    assert captured_bg_args["character_image_bytes"] == b"png_content_data"
                    assert captured_bg_args["character_image_local"] == str(
                        tmp_path / f"{captured_bg_args['request_id']}/character.png"
                    )
