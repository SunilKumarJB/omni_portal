"""
Core generation endpoints: prompt suggestion and video generation.
"""
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.models.schemas import PromptsResponse, GenerateVideoRequest, VideoRequestStatus
from app.services import gemini_service, veo_service, storage_service, db_service, qr_service
from app.config import settings

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("/prompts", response_model=PromptsResponse)
async def suggest_prompts(
    file: UploadFile = File(...),
):
    """Analyze a product image with Nano Banana and return style/theme/prompt suggestions."""
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
    product_image: UploadFile = File(None),
    character_image: UploadFile = File(None),
    audio_file: UploadFile = File(None),
):
    """
    Kick off video generation. Returns a request_id immediately.
    Poll /status/{request_id} for progress.
    """
    request_id = str(uuid.uuid4())

    record: dict = {
        "prompt": prompt,
        "style_id": style_id,
        "theme_id": theme_id,
        "character_preset_id": character_preset_id,
        "audio_preset_id": audio_preset_id,
    }

    # Upload any provided files
    product_image_url = None
    product_image_gcs = None
    character_image_url = None
    character_image_gcs = None
    audio_url = None

    if product_image and product_image.filename:
        img_data = await product_image.read()
        url, gcs = await storage_service.upload_bytes(
            img_data, f"{request_id}/product.jpg", product_image.content_type
        )
        product_image_url = url
        product_image_gcs = gcs
        record["product_image_url"] = url

    if character_image and character_image.filename:
        img_data = await character_image.read()
        url, gcs = await storage_service.upload_bytes(
            img_data, f"{request_id}/character.jpg", character_image.content_type
        )
        character_image_url = url
        character_image_gcs = gcs
        record["character_image_url"] = url

    if audio_file and audio_file.filename:
        audio_data = await audio_file.read()
        url, _ = await storage_service.upload_bytes(
            audio_data, f"{request_id}/audio.webm", audio_file.content_type
        )
        audio_url = url
        record["audio_url"] = url

    # Generate and store QR code immediately
    video_page = qr_service.video_page_url(request_id)
    try:
        qr_bytes = qr_service.generate_qr_bytes(video_page)
    except Exception:
        qr_bytes = qr_service.generate_qr_bytes_simple(video_page)

    qr_url, _ = await storage_service.upload_bytes(
        qr_bytes, f"{request_id}/qr_code.png", "image/png"
    )
    record["qr_code_url"] = qr_url
    record["video_page_url"] = video_page

    # In test mode expose the placeholder URL immediately so the frontend
    # can render the video player without waiting for the background task.
    if settings.TEST_MODE:
        record["video_url"] = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        record["status"] = "processing"
        record["progress"] = 5

    await db_service.create_request(request_id, record)

    background_tasks.add_task(
        _run_generation,
        request_id=request_id,
        prompt=prompt,
        style_id=style_id,
        theme_id=theme_id,
        product_image_gcs=product_image_gcs,
        character_image_gcs=character_image_gcs,
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
    product_image_gcs: str = None,
    character_image_gcs: str = None,
):
    try:
        await db_service.update_request(request_id, {"status": "processing", "progress": 10})

        if settings.TEST_MODE:
            # Simulate gradual progress
            for pct in [25, 50, 75, 90]:
                await asyncio.sleep(2)
                await db_service.update_request(request_id, {"progress": pct})

            # Use a public sample video as placeholder
            video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            await db_service.update_request(request_id, {
                "status": "completed",
                "progress": 100,
                "video_url": video_url,
            })
            return

        await db_service.update_request(request_id, {"progress": 20})

        video_gcs_uri = await veo_service.generate_video(
            prompt=prompt,
            style_id=style_id,
            theme_id=theme_id,
            product_image_gcs_uri=product_image_gcs,
            character_image_gcs_uri=character_image_gcs,
        )

        await db_service.update_request(request_id, {"progress": 90})

        video_url = await storage_service.get_public_url(video_gcs_uri)

        await db_service.update_request(request_id, {
            "status": "completed",
            "progress": 100,
            "video_url": video_url,
        })

    except Exception as e:
        await db_service.update_request(request_id, {
            "status": "failed",
            "error": str(e),
        })


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
