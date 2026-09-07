"""
Unified database service: Firestore or local JSON files.
"""

import json
import aiofiles
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import settings

_firestore_client = None


def _local_db_path() -> Path:
    db_path = Path(settings.LOCAL_STORAGE_PATH) / "db"
    db_path.mkdir(parents=True, exist_ok=True)
    return db_path


def _get_firestore():
    global _firestore_client
    if _firestore_client is None:
        from google.cloud import firestore

        _firestore_client = firestore.AsyncClient(
            project=settings.GCP_PROJECT_ID,
            database=settings.FIRESTORE_DATABASE_ID,
        )
    return _firestore_client


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _local_path(request_id: str) -> Path:
    return _local_db_path() / f"{request_id}.json"


def is_timed_out(record: Dict[str, Any], timeout_seconds: Optional[float] = None) -> bool:
    """
    Check if a record in 'pending' or 'processing' status has exceeded the timeout threshold.
    """
    if record.get("status") not in ("pending", "processing"):
        return False

    updated_at_str = record.get("updated_at") or record.get("created_at")
    if not updated_at_str:
        return False

    try:
        updated_at = datetime.fromisoformat(updated_at_str)
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return False

    now = datetime.now(timezone.utc)
    limit = timeout_seconds if timeout_seconds is not None else settings.OMNI_MAX_WAIT_SECONDS
    return (now - updated_at).total_seconds() >= limit


async def apply_timeout_watchdog(
    record: Dict[str, Any], timeout_seconds: Optional[float] = None
) -> Dict[str, Any]:
    """
    If the record is pending or processing and timed out, update database record to
    failed status with error 'Generation job timed out' and return the updated record.
    """
    if is_timed_out(record, timeout_seconds=timeout_seconds):
        request_id = record.get("request_id")
        if request_id:
            updates = {
                "status": "failed",
                "error": "Generation job timed out",
            }
            await update_request(request_id, updates)
            record["status"] = "failed"
            record["error"] = "Generation job timed out"
            record["updated_at"] = updates["updated_at"]
    return record


async def create_request(request_id: str, data: Dict[str, Any]) -> None:
    record = {
        "request_id": request_id,
        "status": "pending",
        "progress": 0,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        **data,
    }
    if settings.DB_BACKEND == "firestore" and not settings.TEST_MODE:
        db = _get_firestore()
        await db.collection("video_requests").document(request_id).set(record)
    else:
        path = _local_path(request_id)
        async with aiofiles.open(path, "w") as f:
            await f.write(json.dumps(record, indent=2))


async def get_request(request_id: str) -> Optional[Dict[str, Any]]:
    if settings.DB_BACKEND == "firestore" and not settings.TEST_MODE:
        db = _get_firestore()
        doc = await db.collection("video_requests").document(request_id).get()
        record = doc.to_dict() if doc.exists else None
    else:
        path = _local_path(request_id)
        # exists() is a synchronous OS call on Path, but for metadata check it's fast.
        # Alternatively, we can just try/except the open call, which is more async-friendly.
        if not path.exists():
            return None
        async with aiofiles.open(path, "r") as f:
            content = await f.read()
        record = json.loads(content)

    if record is not None:
        record = await apply_timeout_watchdog(record)

    return record


async def update_request(request_id: str, updates: Dict[str, Any]) -> None:
    updates["updated_at"] = _now_iso()
    if settings.DB_BACKEND == "firestore" and not settings.TEST_MODE:
        db = _get_firestore()
        await db.collection("video_requests").document(request_id).update(updates)
    else:
        path = _local_path(request_id)
        if path.exists():
            async with aiofiles.open(path, "r") as f:
                content = await f.read()
            record = json.loads(content)
            record.update(updates)
            async with aiofiles.open(path, "w") as f:
                await f.write(json.dumps(record, indent=2))
