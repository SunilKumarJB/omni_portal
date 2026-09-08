"""
Unified database service: Firestore or local JSON files.
"""

import asyncio
import base64
import json
import threading
import tempfile
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


def _write_local_record(path: Path, record: Dict[str, Any]) -> None:
    # Readers see either the previous full record or the next full record.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", dir=path.parent, suffix=".tmp", delete=False
        ) as stream:
            temporary = Path(stream.name)
            json.dump(record, stream, indent=2)
        temporary.replace(path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


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
        "hidden": False,
        **data,
    }
    if settings.DB_BACKEND == "firestore" and not settings.TEST_MODE:
        db = _get_firestore()
        await db.collection("video_requests").document(request_id).set(record)
    else:
        path = _local_path(request_id)
        await asyncio.to_thread(_write_local_record, path, record)


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
            await asyncio.to_thread(_write_local_record, path, record)


def encode_cursor(record: Dict[str, Any]) -> str:
    value = [record.get("created_at", ""), record["request_id"]]
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[str, str]:
    try:
        value = json.loads(base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4)))
        if (
            not isinstance(value, list)
            or len(value) != 2
            or not all(isinstance(v, str) for v in value)
        ):
            raise ValueError()
        if not value[1] or "/" in value[1]:
            raise ValueError()
        return tuple(value)
    except Exception as exc:
        raise ValueError("Invalid gallery cursor") from exc


# Metadata scans run off the event loop. Parse only changed files; inode and
# nanosecond timestamps detect external edits, replacements, and deletions.
_local_index: dict[Path, tuple[tuple, dict]] = {}
_index_lock = threading.Lock()
_index_root: Optional[Path] = None


def _read_local_index() -> list[Dict[str, Any]]:
    global _index_root
    root = _local_db_path().resolve()
    with _index_lock:
        if root != _index_root:
            _local_index.clear()
            _index_root = root
        seen = set()
        for path in root.glob("*.json"):
            seen.add(path)
            try:
                stat = path.stat()
                signature = (stat.st_ino, stat.st_mtime_ns, stat.st_ctime_ns, stat.st_size)
                cached = _local_index.get(path)
                if cached is None or cached[0] != signature:
                    record = json.loads(path.read_text())
                    if not isinstance(record, dict):
                        raise ValueError("Expected a record")
                    _local_index[path] = (signature, record)
            except (OSError, ValueError):
                _local_index.pop(path, None)
        for path in _local_index.keys() - seen:
            del _local_index[path]
        return [dict(entry[1]) for entry in _local_index.values()]


async def list_requests(limit: int, cursor: Optional[str] = None) -> list[Dict[str, Any]]:
    """Read a stable page without watchdog writes or an arbitrary history cap."""
    after = decode_cursor(cursor) if cursor else None
    if settings.DB_BACKEND == "firestore" and not settings.TEST_MODE:
        from google.cloud import firestore

        db = _get_firestore()
        collection = db.collection("video_requests")
        query = collection.order_by("created_at", direction=firestore.Query.DESCENDING).order_by(
            "__name__", direction=firestore.Query.DESCENDING
        )
        if after:
            query = query.start_after(
                {"created_at": after[0], "__name__": collection.document(after[1])}
            )
        records = []
        async for doc in query.limit(limit).stream():
            data = doc.to_dict()
            if data is not None:
                records.append({**data, "request_id": doc.id})
        return records

    return (await _local_records(after))[:limit]


async def _local_records(after=None):
    records = await asyncio.to_thread(_read_local_index)

    def key(record):
        return (record.get("created_at", ""), record.get("request_id", ""))

    records.sort(key=key, reverse=True)
    if after:
        records = [record for record in records if key(record) < after]
    return records


async def iter_requests(batch_size: int, cursor: Optional[str] = None):
    """Iterate storage pages; local filtering shares a single metadata snapshot."""
    if settings.DB_BACKEND != "firestore" or settings.TEST_MODE:
        for record in await _local_records(decode_cursor(cursor) if cursor else None):
            yield record
        return
    while True:
        batch = await list_requests(batch_size, cursor)
        for record in batch:
            yield record
        if len(batch) < batch_size:
            return
        cursor = encode_cursor(batch[-1])
