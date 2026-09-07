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
   - handles source_video_uri and source_video_bytes
3. omni_service._compose_request / generate_video:
   - selects video_config.task from the supplied inputs
   - emits structured response_format (aspect_ratio / duration / delivery)
   - correctly constructs payload input entries for URIs vs bytes
4. generate.py endpoint (/api/generate/video):
   - GCS-backed uploads capture gs:// storage paths and pass them as URIs
   - bytes are cleared from memory when GCS URIs are present
   - local storage backend retains bytes and passes None for URIs
5. generate.py _run_generation:
   - handles GCS URIs without reading assets
   - handles local storage paths by reading bytes
   - handles both inline-bytes and gs:// uri delivery of the generated video
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

    def test_media_payload_video(self):
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

    def test_enrich_prompt_has_no_resolution_boilerplate(self):
        prompt = omni_service._enrich_prompt(prompt="A quiet street at dawn")
        assert prompt == "A quiet street at dawn"

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
# 3. Unit tests for request composition (task, response_format, delivery)
# ---------------------------------------------------------------------------
class TestComposeRequest:
    def test_task_text_to_video_without_media(self):
        assert omni_service._video_task(has_character=False, has_source_video=False) == (
            "text_to_video"
        )

    def test_task_reference_to_video_with_character_only(self):
        assert omni_service._video_task(has_character=True, has_source_video=False) == (
            "reference_to_video"
        )

    def test_task_edit_with_source_video(self):
        assert omni_service._video_task(has_character=False, has_source_video=True) == "edit"
        # A source video wins over a character reference
        assert omni_service._video_task(has_character=True, has_source_video=True) == "edit"

    def test_compose_request_structured_response_format(self):
        payload = omni_service._compose_request(
            "A neon skyline",
            [],
            "9:16",
            8,
            task="text_to_video",
        )
        assert payload["input"] == [{"type": "text", "text": "A neon skyline"}]
        assert payload["background"] is True
        assert payload["response_format"] == [
            {"type": "video", "aspect_ratio": "9:16", "duration": "8s"}
        ]
        assert payload["generation_config"] == {"video_config": {"task": "text_to_video"}}

    def test_compose_request_falls_back_to_landscape(self):
        payload = omni_service._compose_request("A neon skyline", [], "4:3", 10)
        assert payload["response_format"][0]["aspect_ratio"] == "16:9"

    def test_compose_request_uri_delivery(self):
        payload = omni_service._compose_request(
            "A neon skyline",
            [],
            "16:9",
            10,
            task="reference_to_video",
            output_gcs_uri="gs://omni-bucket/req-1/",
        )
        assert payload["response_format"][0]["delivery"] == "uri"
        assert payload["response_format"][0]["gcs_uri"] == "gs://omni-bucket/req-1/"

    def test_output_gcs_uri_only_for_gcs_backend(self):
        with (
            patch.object(settings, "STORAGE_BACKEND", "gcs"),
            patch.object(settings, "GCS_BUCKET_NAME", "omni-bucket"),
            patch.object(settings, "TEST_MODE", False),
        ):
            assert omni_service._output_gcs_uri("req-1") == "gs://omni-bucket/req-1/"

        with (
            patch.object(settings, "STORAGE_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            assert omni_service._output_gcs_uri("req-1") is None

        with (
            patch.object(settings, "STORAGE_BACKEND", "gcs"),
            patch.object(settings, "GCS_BUCKET_NAME", "omni-bucket"),
            patch.object(settings, "TEST_MODE", True),
        ):
            assert omni_service._output_gcs_uri("req-1") is None


class TestExtractVideoOutput:
    def test_extract_inline_data_from_steps(self):
        response = {
            "steps": [
                {
                    "type": "model_output",
                    "content": [
                        {
                            "type": "video",
                            "mime_type": "video/mp4",
                            "data": base64.b64encode(b"inline_bytes").decode(),
                        }
                    ],
                }
            ]
        }
        assert omni_service._extract_video_output(response) == (
            b"inline_bytes",
            "video/mp4",
            None,
        )

    def test_extract_uri_from_steps(self):
        response = {
            "steps": [
                {
                    "type": "model_output",
                    "content": [
                        {
                            "type": "video",
                            "mime_type": "video/mp4",
                            "uri": "gs://omni-bucket/req-1/output.mp4",
                        }
                    ],
                }
            ]
        }
        assert omni_service._extract_video_output(response) == (
            None,
            "video/mp4",
            "gs://omni-bucket/req-1/output.mp4",
        )

    def test_extract_returns_nothing_when_no_video(self):
        assert omni_service._extract_video_output({"steps": []}) == (None, "video/mp4", None)


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
            result = await omni_service.generate_video(
                prompt="Futuristic car racing",
                character_image_uri="gs://my-bucket/driver.png",
                character_image_mime="image/png",
                source_video_uri="gs://my-bucket/scene.mp4",
                source_video_mime="video/mp4",
            )
            assert result.video_bytes == b"dummy_video"
            assert result.mime_type == "video/mp4"
            assert result.uri is None

            inputs = captured_json.get("input", [])
            assert len(inputs) == 3  # text + 2 media inputs

            image_input = next(item for item in inputs if item.get("type") == "image")
            assert image_input["uri"] == "gs://my-bucket/driver.png"
            assert "data" not in image_input

            video_input = next(item for item in inputs if item.get("type") == "video")
            assert video_input["uri"] == "gs://my-bucket/scene.mp4"
            assert "data" not in video_input

            # A source video makes this an edit task
            assert captured_json["generation_config"]["video_config"]["task"] == "edit"

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

            mock_generate = AsyncMock(
                return_value=omni_service.VideoResult(b"generated_mp4", "video/mp4", None, "final")
            )
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

            mock_generate = AsyncMock(
                return_value=omni_service.VideoResult(b"generated_mp4", "video/mp4", None, "final")
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
                    prompt="Cozy living room",
                    character_image_local=str(local_char_file),
                    character_image_mime="image/png",
                )

                mock_generate.assert_called_once()
                call_kwargs = mock_generate.call_args.kwargs
                assert call_kwargs["character_image_uri"] is None
                assert call_kwargs["character_image_bytes"] == b"local_png_bytes"

    @pytest.mark.anyio
    async def test_run_generation_uploads_inline_video_bytes(self, tmp_path: Path):
        """Inline (base64) delivery: bytes are uploaded to storage and the URL is stored."""
        request_id = "test-req-inline-delivery"
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            from app.api.routes.generate import _run_generation

            await db_service.create_request(request_id, {"prompt": "A toy infomercial"})

            mock_generate = AsyncMock(
                return_value=omni_service.VideoResult(
                    b"inline_video", "video/mp4", None, "A toy infomercial, enriched"
                )
            )
            mock_upload = AsyncMock(
                return_value=("/storage/video.mp4", str(tmp_path / "video.mp4"))
            )

            with (
                patch.object(omni_service, "generate_video", mock_generate),
                patch.object(storage_service, "upload_bytes", mock_upload),
            ):
                await _run_generation(request_id=request_id, prompt="A toy infomercial")

            mock_upload.assert_awaited_once()
            assert mock_upload.await_args.args[0] == b"inline_video"

            record = await db_service.get_request(request_id)
            assert record["status"] == "completed"
            assert record["progress"] == 100
            assert record["video_url"] == "/storage/video.mp4"
            assert record["stage"] == "completed"
            assert record["final_prompt"] == "A toy infomercial, enriched"
            assert record["generation_seconds"] >= 0
            assert "submitting" in record["timings"]

    @pytest.mark.anyio
    async def test_run_generation_uses_gcs_uri_delivery_without_reupload(self, tmp_path: Path):
        """uri delivery: the gs:// output is signed for playback, never downloaded/re-uploaded."""
        request_id = "test-req-uri-delivery"
        with (
            patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
            patch.object(settings, "DB_BACKEND", "local"),
            patch.object(settings, "TEST_MODE", False),
        ):
            from app.api.routes.generate import _run_generation

            await db_service.create_request(request_id, {"prompt": "A skyline timelapse"})

            mock_generate = AsyncMock(
                return_value=omni_service.VideoResult(
                    None, "video/mp4", f"gs://omni-bucket/{request_id}/output.mp4", "final prompt"
                )
            )
            mock_upload = AsyncMock()
            mock_public_url = AsyncMock(return_value="https://signed.example/output.mp4")

            with (
                patch.object(omni_service, "generate_video", mock_generate),
                patch.object(storage_service, "upload_bytes", mock_upload),
                patch.object(storage_service, "get_public_url", mock_public_url),
            ):
                await _run_generation(request_id=request_id, prompt="A skyline timelapse")

            mock_upload.assert_not_called()
            mock_public_url.assert_awaited_once_with(f"gs://omni-bucket/{request_id}/output.mp4")

            record = await db_service.get_request(request_id)
            assert record["status"] == "completed"
            assert record["video_url"] == "https://signed.example/output.mp4"


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
                    # Large bytes should have been freed (None) to avoid memory overhead
                    assert captured_bg_args["character_image_bytes"] is None

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
