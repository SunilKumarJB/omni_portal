"""
Core generation endpoints: prompt suggestion and video generation.
Video generation uses the Omni Interactions API (gemini-omni-flash-preview).
"""

import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.models.schemas import PromptsResponse, VideoRequestStatus
from app.services import (
    gemini_service,
    omni_service,
    storage_service,
    db_service,
    qr_service,
)
from app.config import settings

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("/prompts", response_model=PromptsResponse)
async def suggest_prompts(
    file: UploadFile = File(...),
):
    """Analyze a product image with Gemini and return style/theme/prompt suggestions."""
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(400, "Please upload a JPEG, PNG, or WebP image")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 10 MB)")

    return await gemini_service.generate_prompts_from_image(data, file.content_type)


@router.post("/video", response_model=VideoRequestStatus)
async def generate_video(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    style_id: str = Form(...),
    theme_id: str = Form(...),
    character_preset_id: str = Form(None),
    audio_preset_id: str = Form(None),
    aspect_ratio: str = Form(None),  # "16:9" | "9:16" — defaults to config
    duration_seconds: int = Form(None),  # 1-10  — defaults to config
    product_image: UploadFile = File(None),
    character_image: UploadFile = File(None),
    audio_file: UploadFile = File(None),
    source_video: UploadFile = File(None),  # V2V editing: existing video as input
):
    """
    Kick off Omni video generation. Returns a request_id immediately.
    Poll /status/{request_id} for progress.

    - product_image / character_image: passed as reference inputs to Omni ([REF_PRODUCT] / [REF_CHARACTER])
    - audio_file: passed to Omni for audio-driven / lip-sync generation
    - source_video: passed to Omni for V2V editing (style transfer, character swap, etc.)
    """
    request_id = str(uuid.uuid4())
    resolved_aspect = aspect_ratio or settings.OMNI_DEFAULT_ASPECT_RATIO
    resolved_duration = duration_seconds or settings.OMNI_DEFAULT_DURATION

    record: dict = {
        "prompt": prompt,
        "style_id": style_id,
        "theme_id": theme_id,
        "character_preset_id": character_preset_id,
        "audio_preset_id": audio_preset_id,
    }

    # Upload any provided files and retain their storage paths for the background task
    product_image_local = None
    product_image_mime = None
    character_image_local = None
    character_image_mime = None
    audio_local = None
    audio_mime = None
    source_video_local = None
    source_video_mime = None

    product_bytes = None
    character_bytes = None
    audio_bytes = None
    source_video_bytes = None

    # Define upload coroutines to run concurrently in parallel
    async def upload_product():
        nonlocal product_image_local, product_image_mime, product_bytes
        if product_image and product_image.filename:
            product_bytes = await product_image.read()
            url, local_path = await storage_service.upload_bytes(
                product_bytes, f"{request_id}/product.jpg", product_image.content_type
            )
            product_image_local = local_path
            product_image_mime = product_image.content_type
            record["product_image_url"] = url

    async def upload_character():
        nonlocal character_image_local, character_image_mime, character_bytes
        if character_image and character_image.filename:
            character_bytes = await character_image.read()
            url, local_path = await storage_service.upload_bytes(
                character_bytes,
                f"{request_id}/character.png",
                character_image.content_type,
            )
            character_image_local = local_path
            character_image_mime = character_image.content_type
            record["character_image_url"] = url

    async def upload_audio():
        nonlocal audio_local, audio_mime, audio_bytes
        if audio_file and audio_file.filename:
            audio_bytes = await audio_file.read()
            url, local_path = await storage_service.upload_bytes(
                audio_bytes,
                f"{request_id}/audio{_ext(audio_file.filename)}",
                audio_file.content_type,
            )
            audio_local = local_path
            audio_mime = audio_file.content_type
            record["audio_url"] = url

    async def upload_video():
        nonlocal source_video_local, source_video_mime, source_video_bytes
        if source_video and source_video.filename:
            source_video_bytes = await source_video.read()
            url, local_path = await storage_service.upload_bytes(
                source_video_bytes,
                f"{request_id}/source_video{_ext(source_video.filename)}",
                source_video.content_type,
            )
            source_video_local = local_path
            source_video_mime = source_video.content_type
            record["source_video_url"] = url

    # Run independent file uploads in parallel
    await asyncio.gather(
        upload_product(), upload_character(), upload_audio(), upload_video()
    )

    # Generate and store QR code immediately (offload CPU-bound image generation to worker thread)
    video_page = qr_service.video_page_url(request_id)
    try:
        qr_bytes = await asyncio.to_thread(qr_service.generate_qr_bytes, video_page)
    except Exception:
        qr_bytes = await asyncio.to_thread(
            qr_service.generate_qr_bytes_simple, video_page
        )

    qr_url, _ = await storage_service.upload_bytes(
        qr_bytes, f"{request_id}/qr_code.png", "image/png"
    )
    record["qr_code_url"] = qr_url
    record["video_page_url"] = video_page

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
        style_id=style_id,
        theme_id=theme_id,
        aspect_ratio=resolved_aspect,
        duration_seconds=resolved_duration,
        product_image_bytes=product_bytes,
        product_image_mime=product_image_mime,
        character_image_bytes=character_bytes,
        character_image_mime=character_image_mime,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        source_video_bytes=source_video_bytes,
        source_video_mime=source_video_mime,
        product_image_local=product_image_local,
        character_image_local=character_image_local,
        audio_local=audio_local,
        source_video_local=source_video_local,
    )

    current = await db_service.get_request(request_id)
    return VideoRequestStatus(**_to_status(current))


@router.get("/status/{request_id}", response_model=VideoRequestStatus)
async def get_status(request_id: str):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Request not found")
    return VideoRequestStatus(**_to_status(record))


async def _run_generation(
    request_id: str,
    prompt: str,
    style_id: str,
    theme_id: str,
    aspect_ratio: str,
    duration_seconds: int,
    product_image_bytes: bytes = None,
    product_image_mime: str = None,
    character_image_bytes: bytes = None,
    character_image_mime: str = None,
    audio_bytes: bytes = None,
    audio_mime: str = None,
    source_video_bytes: bytes = None,
    source_video_mime: str = None,
    product_image_local: str = None,
    character_image_local: str = None,
    audio_local: str = None,
    source_video_local: str = None,
):
    try:
        await db_service.update_request(
            request_id, {"status": "processing", "progress": 10}
        )

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

        # Read stored asset bytes for Omni media inputs (fallback to reading from path if bytes not pre-loaded)
        if product_image_bytes is None and product_image_local:
            product_bytes, prod_mime = await _read_asset(
                product_image_local, product_image_mime
            )
        else:
            product_bytes, prod_mime = product_image_bytes, product_image_mime

        if character_image_bytes is None and character_image_local:
            character_bytes, char_mime = await _read_asset(
                character_image_local, character_image_mime
            )
        else:
            character_bytes, char_mime = character_image_bytes, character_image_mime

        if audio_bytes is None and audio_local:
            audio_bytes_data, aud_mime = await _read_asset(audio_local, audio_mime)
        else:
            audio_bytes_data, aud_mime = audio_bytes, audio_mime

        if source_video_bytes is None and source_video_local:
            source_video_bytes_data, src_mime = await _read_asset(
                source_video_local, source_video_mime
            )
        else:
            source_video_bytes_data, src_mime = source_video_bytes, source_video_mime

        await db_service.update_request(request_id, {"progress": 30})

        # Map Omni's 0..1 generation fraction onto the 30..85% band so the bar
        # advances during the multi-minute model call instead of freezing at 30%.
        async def _omni_progress(fraction: float):
            pct = 30 + int(55 * fraction)
            await db_service.update_request(request_id, {"progress": pct})

        try:
            # Primary generation attempt
            video_bytes, mime_type = await omni_service.generate_video(
                prompt=prompt,
                style_id=style_id,
                theme_id=theme_id,
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds,
                product_image_bytes=product_bytes,
                product_image_mime=prod_mime,
                character_image_bytes=character_bytes,
                character_image_mime=char_mime,
                audio_bytes=audio_bytes_data,
                audio_mime=aud_mime,
                source_video_bytes=source_video_bytes_data,
                source_video_mime=src_mime,
                progress_callback=_omni_progress,
            )
        except Exception as primary_exc:
            # If audio was provided and it failed, retry without audio as a silent fallback
            if audio_bytes_data is not None:
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
                        style_id=style_id,
                        theme_id=theme_id,
                        aspect_ratio=aspect_ratio,
                        duration_seconds=duration_seconds,
                        product_image_bytes=product_bytes,
                        product_image_mime=prod_mime,
                        character_image_bytes=character_bytes,
                        character_image_mime=char_mime,
                        audio_bytes=None,  # Strip audio track
                        audio_mime=None,
                        source_video_bytes=source_video_bytes_data,
                        source_video_mime=src_mime,
                        progress_callback=_omni_progress,
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
        "theme_id": record.get("theme_id"),
        "product_image_url": record.get("product_image_url"),
        "character_image_url": record.get("character_image_url"),
        "audio_url": record.get("audio_url"),
    }
