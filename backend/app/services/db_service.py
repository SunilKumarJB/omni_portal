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


TIMEOUT_ERROR = "Generation job timed out"
STALLED_ERROR = "Generation stalled; the backend task stopped reporting progress"


def _parse_ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed


def timeout_error(record: Dict[str, Any], timeout_seconds: Optional[float] = None) -> Optional[str]:
    """
    Error message for a pending/processing record that should be failed, else None.

    Two limits apply: the hard OMNI_MAX_WAIT_SECONDS since the job was created, and
    OMNI_STALE_SECONDS since the last update — a healthy job refreshes updated_at on
    every progress tick, so an idle updated_at means the background task is gone.
    An explicit timeout_seconds overrides both and applies to updated_at.
    """
    if record.get("status") not in ("pending", "processing"):
        return None

    updated_at = _parse_ts(record.get("updated_at")) or _parse_ts(record.get("created_at"))
    if updated_at is None:
        return None
    created_at = _parse_ts(record.get("created_at")) or updated_at

    now = datetime.now(timezone.utc)
    if timeout_seconds is not None:
        return TIMEOUT_ERROR if (now - updated_at).total_seconds() >= timeout_seconds else None

    if (now - created_at).total_seconds() >= settings.OMNI_MAX_WAIT_SECONDS:
        return TIMEOUT_ERROR
    if (now - updated_at).total_seconds() >= settings.OMNI_STALE_SECONDS:
        return STALLED_ERROR
    return None


def is_timed_out(record: Dict[str, Any], timeout_seconds: Optional[float] = None) -> bool:
    """
    Check if a record in 'pending' or 'processing' status has timed out or stalled.
    """
    return timeout_error(record, timeout_seconds=timeout_seconds) is not None


async def apply_timeout_watchdog(
    record: Dict[str, Any], timeout_seconds: Optional[float] = None
) -> Dict[str, Any]:
    """
    If the record is pending or processing and has timed out or stalled, update the
    database record to failed status and return the updated record.
    """
    error = timeout_error(record, timeout_seconds=timeout_seconds)
    if error:
        request_id = record.get("request_id")
        if request_id:
            updates = {
                "status": "failed",
                "stage": "failed",
                "error": error,
            }
            await update_request(request_id, updates)
            record["status"] = "failed"
            record["stage"] = "failed"
            record["error"] = error
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
