"""
Core generation endpoints: prompt suggestion and video generation.
Video generation uses the Omni Interactions API (gemini-omni-1.1-flash-preview).
"""

import uuid
import asyncio
import json
from typing import Optional
import httpx
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
    Request,
)
from fastapi.responses import StreamingResponse
from app.models.schemas import VideoRequestStatus
from app.services import (
    omni_service,
    storage_service,
    db_service,
    qr_service,
)
from app.config import settings

router = APIRouter(prefix="/generate", tags=["generate"])

STREAM_POLL_INTERVAL: float = 1.5


@router.post("/video", response_model=VideoRequestStatus)
async def generate_video(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    style_id: str = Form(None),  # scenario template id — stored as a display label
    dialogue: str = Form(None),  # spoken line for the character
    language: str = Form(None),  # language code for the dialogue (en, hi, ta, ...)
    character_preset_id: str = Form(None),
    audio_preset_id: str = Form(None),
    aspect_ratio: str = Form(None),  # "16:9" | "9:16" — defaults to config
    duration_seconds: int = Form(None),  # 1-10  — defaults to config
    character_image: UploadFile = File(None),
    audio_file: UploadFile = File(None),
    source_video: UploadFile = File(None),  # V2V editing: existing video as input
):
    """
    Kick off Omni video generation. Returns a request_id immediately.
    Poll /status/{request_id} for progress.

    - character_image: passed as a reference input to Omni and bound to [REF_Character]
    - dialogue / language: the line the character speaks, and the language to speak it in
    - audio_file: passed to Omni for audio-driven / lip-sync generation
    - source_video: passed to Omni for V2V editing (style transfer, character swap, etc.)
    """
    request_id = str(uuid.uuid4())
    resolved_aspect = aspect_ratio or settings.OMNI_DEFAULT_ASPECT_RATIO
    resolved_duration = duration_seconds or settings.OMNI_DEFAULT_DURATION

    record: dict = {
        "prompt": prompt,
        "style_id": style_id,
        "dialogue": dialogue,
        "language": language,
        "character_preset_id": character_preset_id,
        "audio_preset_id": audio_preset_id,
    }

    # Upload any provided files and retain their storage paths for the background task
    character_image_local = None
    character_image_mime = None
    character_image_uri = None
    audio_local = None
    audio_mime = None
    audio_uri = None
    source_video_local = None
    source_video_mime = None
    source_video_uri = None

    character_bytes = None
    audio_bytes = None
    source_video_bytes = None

    # Define upload coroutines to run concurrently in parallel
    async def upload_character():
        nonlocal character_image_local, character_image_mime, character_image_uri, character_bytes
        if character_image and character_image.filename:
            character_bytes = await character_image.read()
            url, storage_path = await storage_service.upload_bytes(
                character_bytes,
                f"{request_id}/character.png",
                character_image.content_type,
            )
            character_image_local = storage_path
            character_image_mime = character_image.content_type
            if storage_path.startswith("gs://"):
                character_image_uri = storage_path
                character_bytes = None
            record["character_image_url"] = url

    async def upload_audio():
        nonlocal audio_local, audio_mime, audio_uri, audio_bytes
        if audio_file and audio_file.filename:
            audio_bytes = await audio_file.read()
            url, storage_path = await storage_service.upload_bytes(
                audio_bytes,
                f"{request_id}/audio{_ext(audio_file.filename)}",
                audio_file.content_type,
            )
            audio_local = storage_path
            audio_mime = audio_file.content_type
            if storage_path.startswith("gs://"):
                audio_uri = storage_path
                audio_bytes = None
            record["audio_url"] = url

    async def upload_video():
        nonlocal source_video_local, source_video_mime, source_video_uri, source_video_bytes
        if source_video and source_video.filename:
            source_video_bytes = await source_video.read()
            url, storage_path = await storage_service.upload_bytes(
                source_video_bytes,
                f"{request_id}/source_video{_ext(source_video.filename)}",
                source_video.content_type,
            )
            source_video_local = storage_path
            source_video_mime = source_video.content_type
            if storage_path.startswith("gs://"):
                source_video_uri = storage_path
                source_video_bytes = None
            record["source_video_url"] = url

    # Run independent file uploads in parallel
    await asyncio.gather(upload_character(), upload_audio(), upload_video())

    record["video_page_url"] = qr_service.video_page_url(request_id)
    record["qr_code_url"] = f"/api/videos/{request_id}/qr.png"

    if settings.TEST_MODE:
        record["video_url"] = (
            "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        )
        record["status"] = "processing"
        record["progress"] = 5

    await db_service.create_request(request_id, record)

    background_tasks.add_task(
        _run_generation,
        request_id=request_id,
        prompt=prompt,
        dialogue=dialogue,
        language=language,
        aspect_ratio=resolved_aspect,
        duration_seconds=resolved_duration,
        character_image_bytes=character_bytes,
        character_image_mime=character_image_mime,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        source_video_bytes=source_video_bytes,
        source_video_mime=source_video_mime,
        character_image_local=character_image_local,
        audio_local=audio_local,
        source_video_local=source_video_local,
        character_image_uri=character_image_uri,
        audio_uri=audio_uri,
        source_video_uri=source_video_uri,
    )

    current = await db_service.get_request(request_id)
    return VideoRequestStatus(**_to_status(current))


def map_progress_to_band(fraction: float, start: int = 30, end: int = 90) -> int:
    """
    Map a calibrated progress fraction in [0.0, 1.0] smoothly into the [start, end] progress band.
    """
    clamped_fraction = max(0.0, min(1.0, float(fraction)))
    return start + int((end - start) * clamped_fraction)


@router.get("/status/{request_id}", response_model=VideoRequestStatus)
async def get_status(request_id: str):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Request not found")
    record = await db_service.apply_timeout_watchdog(record)
    return VideoRequestStatus(**_to_status(record))


@router.get("/stream/{request_id}")
async def stream_status(request_id: str, request: Request):
    """
    Stream video generation status updates using Server-Sent Events (SSE).
    Polls db_service at tight intervals and emits data: <json>\n\n events.
    Cleanly terminates when completed, failed, or client disconnects.
    """
    initial_record = await db_service.get_request(request_id)
    if not initial_record:
        raise HTTPException(404, "Request not found")

    async def event_generator():
        last_state = None
        while True:
            if await request.is_disconnected():
                break

            record = await db_service.get_request(request_id)
            if not record:
                break

            current_state = (
                record.get("status"),
                record.get("progress"),
                record.get("updated_at"),
            )

            if last_state is None or current_state != last_state:
                last_state = current_state
                data_json = json.dumps(_to_status(record))
                yield f"data: {data_json}\n\n"

            if record.get("status") in ("completed", "failed"):
                break

            try:
                await asyncio.sleep(STREAM_POLL_INTERVAL)
            except asyncio.CancelledError:
                break

    headers = {
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers,
    )


async def _run_generation(
    request_id: str,
    prompt: str,
    dialogue: Optional[str] = None,
    language: Optional[str] = None,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 10,
    character_image_bytes: Optional[bytes] = None,
    character_image_mime: Optional[str] = None,
    audio_bytes: Optional[bytes] = None,
    audio_mime: Optional[str] = None,
    source_video_bytes: Optional[bytes] = None,
    source_video_mime: Optional[str] = None,
    character_image_local: Optional[str] = None,
    audio_local: Optional[str] = None,
    source_video_local: Optional[str] = None,
    character_image_uri: Optional[str] = None,
    audio_uri: Optional[str] = None,
    source_video_uri: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
):
    try:
        await db_service.update_request(request_id, {"status": "processing", "progress": 10})

        if settings.TEST_MODE:
            for pct in [25, 50, 75, 90]:
                await asyncio.sleep(2)
                await db_service.update_request(request_id, {"progress": pct})
            await db_service.update_request(
                request_id,
                {
                    "status": "completed",
                    "progress": 100,
                    "video_url": "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                },
            )
            return

        await db_service.update_request(request_id, {"progress": 20})

        # Resolve GCS URIs vs local storage assets.
        # For GCS (gs://...), pass the URI directly without reading bytes into memory.
        # For local storage, read bytes or use pre-loaded bytes.
        char_uri = character_image_uri or (
            character_image_local
            if character_image_local and character_image_local.startswith("gs://")
            else None
        )
        if char_uri:
            character_bytes = None
            char_mime = character_image_mime or "image/png"
        else:
            if character_image_bytes is None and character_image_local:
                character_bytes, char_mime = await _read_asset(
                    character_image_local, character_image_mime
                )
            else:
                character_bytes, char_mime = character_image_bytes, character_image_mime

        aud_uri = audio_uri or (
            audio_local if audio_local and audio_local.startswith("gs://") else None
        )
        if aud_uri:
            audio_bytes_data = None
            aud_mime = audio_mime or "audio/wav"
        else:
            if audio_bytes is None and audio_local:
                audio_bytes_data, aud_mime = await _read_asset(audio_local, audio_mime)
            else:
                audio_bytes_data, aud_mime = audio_bytes, audio_mime

        src_uri = source_video_uri or (
            source_video_local
            if source_video_local and source_video_local.startswith("gs://")
            else None
        )
        if src_uri:
            source_video_bytes_data = None
            src_mime = source_video_mime or "video/mp4"
        else:
            if source_video_bytes is None and source_video_local:
                source_video_bytes_data, src_mime = await _read_asset(
                    source_video_local, source_video_mime
                )
            else:
                source_video_bytes_data, src_mime = source_video_bytes, source_video_mime

        await db_service.update_request(request_id, {"progress": 30})

        # Map Omni's calibrated generation fraction smoothly into the 30% to 90% band
        async def _omni_progress(fraction: float):
            pct = map_progress_to_band(fraction, start=30, end=90)
            await db_service.update_request(request_id, {"progress": pct})

        try:
            # Primary generation attempt
            video_bytes, mime_type = await omni_service.generate_video(
                prompt=prompt,
                dialogue=dialogue,
                language=language,
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds,
                character_image_bytes=character_bytes,
                character_image_mime=char_mime,
                character_image_uri=char_uri,
                audio_bytes=audio_bytes_data,
                audio_mime=aud_mime,
                audio_uri=aud_uri,
                source_video_bytes=source_video_bytes_data,
                source_video_mime=src_mime,
                source_video_uri=src_uri,
                progress_callback=_omni_progress,
                client=client,
            )
        except Exception as primary_exc:
            # If audio was provided and it failed, retry without audio as a silent fallback
            if audio_bytes_data is not None or aud_uri is not None:
                try:
                    # Enrich the prompt with 90s style subtitle overlay instructions
                    fallback_prompt = (
                        f"{prompt}. [SILENT INFOMERCIAL FALLBACK] "
                        "Since this is a silent broadcast, overlay bold, colorful 90s-style "
                        "infomercial subtitles pitching the product at the bottom of the screen."
                    )
                    await db_service.update_request(
                        request_id,
                        {
                            "progress": 35,
                            "error": f"Audio generation failed ({str(primary_exc)}). Falling back gracefully to silent infomercial loop with subtitles...",
                        },
                    )
                    video_bytes, mime_type = await omni_service.generate_video(
                        prompt=fallback_prompt,
                        dialogue=dialogue,
                        language=language,
                        aspect_ratio=aspect_ratio,
                        duration_seconds=duration_seconds,
                        character_image_bytes=character_bytes,
                        character_image_mime=char_mime,
                        character_image_uri=char_uri,
                        audio_bytes=None,  # Strip audio track
                        audio_mime=None,
                        audio_uri=None,  # Strip audio URI
                        source_video_bytes=source_video_bytes_data,
                        source_video_mime=src_mime,
                        source_video_uri=src_uri,
                        progress_callback=_omni_progress,
                        client=client,
                    )
                except Exception as fallback_exc:
                    raise RuntimeError(
                        f"Omni generation failed on primary with audio ({str(primary_exc)}) "
                        f"and fallback without audio ({str(fallback_exc)})"
                    )
            else:
                raise primary_exc

        await db_service.update_request(request_id, {"progress": 90})

        if video_bytes:
            ext = "webm" if "webm" in mime_type else "mp4"
            video_url, _ = await storage_service.upload_bytes(
                video_bytes,
                f"{request_id}/generated_video.{ext}",
                mime_type,
            )
        else:
            video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

        await db_service.update_request(
            request_id,
            {
                "status": "completed",
                "progress": 100,
                "video_url": video_url,
            },
        )

    except Exception as e:
        await db_service.update_request(
            request_id,
            {
                "status": "failed",
                "error": str(e),
            },
        )


async def _read_asset(path: str, override_mime: str = None):
    """Read bytes from a storage path; returns (None, None) if path is falsy."""
    if not path:
        return None, None
    data, mime = await storage_service.read_bytes(path)
    return data, override_mime or mime


def _ext(filename: str) -> str:
    """Return the file extension including the dot, e.g. '.mp4'."""
    if "." in filename:
        return "." + filename.rsplit(".", 1)[-1]
    return ""


def _to_status(record: dict) -> dict:
    return {
        "request_id": record.get("request_id", ""),
        "status": record.get("status", "pending"),
        "progress": record.get("progress", 0),
        "video_url": record.get("video_url"),
        "qr_code_url": record.get("qr_code_url"),
        "video_page_url": record.get("video_page_url"),
        "error": record.get("error"),
        "created_at": record.get("created_at", ""),
        "updated_at": record.get("updated_at", ""),
        "prompt": record.get("prompt"),
        "style_id": record.get("style_id"),
        "dialogue": record.get("dialogue"),
        "language": record.get("language"),
        "character_image_url": record.get("character_image_url"),
        "audio_url": record.get("audio_url"),
    }
