"""
Video view and gallery routes — the unique QR-linked video page and the
presenter's list of previous generations.
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query, Response
from app.services import db_service, qr_service, storage_service
from app.api.routes.generate import _to_status
from app.models.schemas import (
    VideoListItem,
    VideoListResponse,
    VideoRequestStatus,
    VideoVisibilityUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("", response_model=VideoListResponse)
async def list_videos(
    include_hidden: bool = False,
    include_failed: bool = False,
    limit: int = Query(50, ge=1, le=200),
):
    records = await db_service.list_requests(200)

    items = []
    for record in records:
        if record.get("hidden") and not include_hidden:
            continue

        status = record.get("status", "pending")
        error = record.get("error")
        timeout_message = db_service.timeout_error(record)
        if timeout_message:
            status = "failed"
            error = timeout_message

        if status == "failed" and not include_failed:
            continue

        items.append(
            VideoListItem(
                request_id=record.get("request_id", ""),
                status=status,
                hidden=bool(record.get("hidden", False)),
                created_at=record.get("created_at", ""),
                updated_at=record.get("updated_at", ""),
                video_url=record.get("video_url"),
                video_page_url=record.get("video_page_url"),
                qr_code_url=record.get("qr_code_url"),
                prompt=record.get("prompt"),
                style_id=record.get("style_id"),
                product_id=record.get("product_id"),
                character_preset_id=record.get("character_preset_id"),
                character_image_url=record.get("character_image_url"),
                language=record.get("language"),
                dialogue=record.get("dialogue"),
                generation_seconds=record.get("generation_seconds"),
                error=error,
                stage=record.get("stage"),
            )
        )

        if len(items) >= limit:
            break

    return VideoListResponse(items=items)


@router.patch("/{request_id}", response_model=VideoRequestStatus)
async def update_video_visibility(request_id: str, body: VideoVisibilityUpdate):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Video not found")

    await db_service.update_request(request_id, {"hidden": body.hidden})
    updated_record = await db_service.get_request(request_id)
    return VideoRequestStatus(**_to_status(updated_record))


@router.get("/{request_id}", response_model=VideoRequestStatus)
async def get_video(request_id: str):
    record = await db_service.get_request(request_id)
    if not record:
        raise HTTPException(404, "Video not found")

    status_dict = _to_status(record)
    storage_path = record.get("video_storage_path") or ""
    if record.get("status") == "completed" and storage_path.startswith("gs://"):
        # A signing hiccup here must not break the page — fall back to the stored URL.
        try:
            status_dict["video_url"] = await storage_service.get_public_url(
                record["video_storage_path"]
            )
        except Exception as exc:
            logger.warning("Failed to re-sign video URL for request_id=%s (%s)", request_id, exc)

    return VideoRequestStatus(**status_dict)


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
