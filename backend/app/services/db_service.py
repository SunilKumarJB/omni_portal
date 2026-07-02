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

_LOCAL_DB_PATH = Path(settings.LOCAL_STORAGE_PATH) / "db"


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
    _LOCAL_DB_PATH.mkdir(parents=True, exist_ok=True)
    return _LOCAL_DB_PATH / f"{request_id}.json"


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
        return doc.to_dict() if doc.exists else None
    else:
        path = _local_path(request_id)
        # exists() is a synchronous OS call on Path, but for metadata check it's fast.
        # Alternatively, we can just try/except the open call, which is more async-friendly.
        if not path.exists():
            return None
        async with aiofiles.open(path, "r") as f:
            content = await f.read()
        return json.loads(content)


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
