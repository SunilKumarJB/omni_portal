"""
Video view route — serves the data for the unique QR-linked video page.
"""

from fastapi import APIRouter, HTTPException
from app.services import db_service
from app.api.routes.generate import _to_status
from app.models.schemas import VideoRequestStatus

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("/{request_id}", response_model=VideoRequestStatus)
async def get_video(request_id: str):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Video not found")
    return VideoRequestStatus(**_to_status(record))
