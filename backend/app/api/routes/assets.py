"""
Asset upload endpoints (product image, character image, audio).
"""

import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import UploadResponse, PRESET_CHARACTERS, PRESET_AUDIO
from app.services import storage_service

router = APIRouter(prefix="/assets", tags=["assets"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_AUDIO_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    asset_type: str = Form("product"),  # "product" | "character"
    request_id: str = Form(None),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Invalid image type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(400, "Image too large (max 10 MB)")

    rid = request_id or str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    path = f"{rid}/{asset_type}_{uuid.uuid4().hex[:8]}.{ext}"

    url, storage_path = await storage_service.upload_bytes(
        data, path, file.content_type
    )
    return UploadResponse(url=url, path=storage_path, asset_type=asset_type)


@router.post("/upload/audio", response_model=UploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    request_id: str = Form(None),
):
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(400, f"Invalid audio type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_AUDIO_SIZE:
        raise HTTPException(400, "Audio too large (max 20 MB)")

    rid = request_id or str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "webm"
    path = f"{rid}/audio_{uuid.uuid4().hex[:8]}.{ext}"

    url, storage_path = await storage_service.upload_bytes(
        data, path, file.content_type
    )
    return UploadResponse(url=url, path=storage_path, asset_type="audio")


@router.get("/presets/characters")
async def get_preset_characters():
    return {"characters": PRESET_CHARACTERS}


@router.get("/presets/audio")
async def get_preset_audio():
    return {"audio": PRESET_AUDIO}
