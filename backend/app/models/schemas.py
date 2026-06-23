from pydantic import BaseModel
from typing import Optional, Literal


class VideoRequestStatus(BaseModel):
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
    audio_url: Optional[str] = None
