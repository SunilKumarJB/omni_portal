from pydantic import BaseModel
from typing import Dict, Optional, Literal


class VideoRequestStatus(BaseModel):
    is_sample: bool = False
    request_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: int = 0
    video_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    video_page_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str
    prompt: Optional[str] = None
    style_id: Optional[str] = None
    dialogue: Optional[str] = None
    language: Optional[str] = None
    character_image_url: Optional[str] = None
    stage: Optional[str] = None
    timings: Optional[Dict[str, float]] = None
    generation_seconds: Optional[float] = None
    final_prompt: Optional[str] = None
    hidden: bool = False
    product_id: Optional[str] = None
    character_preset_id: Optional[str] = None


class VideoListItem(BaseModel):
    is_sample: bool = False
    request_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    hidden: bool = False
    created_at: str
    updated_at: str
    video_url: Optional[str] = None
    video_page_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    prompt: Optional[str] = None
    style_id: Optional[str] = None
    product_id: Optional[str] = None
    character_preset_id: Optional[str] = None
    character_image_url: Optional[str] = None
    language: Optional[str] = None
    dialogue: Optional[str] = None
    generation_seconds: Optional[float] = None
    error: Optional[str] = None
    stage: Optional[str] = None


class VideoListResponse(BaseModel):
    items: list[VideoListItem]


class VideoVisibilityUpdate(BaseModel):
    hidden: bool
