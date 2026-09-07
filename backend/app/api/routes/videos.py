"""
Video view route — serves the data for the unique QR-linked video page.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Response
from app.services import db_service, qr_service
from app.api.routes.generate import _to_status
from app.models.schemas import VideoRequestStatus

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("/{request_id}", response_model=VideoRequestStatus)
async def get_video(request_id: str):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Video not found")
    return VideoRequestStatus(**_to_status(record))


@router.get("/{request_id}/qr.png")
async def get_video_qr(request_id: str):
    video_page = qr_service.video_page_url(request_id)
    try:
        qr_bytes = await asyncio.to_thread(qr_service.generate_qr_bytes, video_page)
    except Exception:
        qr_bytes = await asyncio.to_thread(qr_service.generate_qr_bytes_simple, video_page)

    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
