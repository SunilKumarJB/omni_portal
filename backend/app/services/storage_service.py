"""
Unified storage service: GCS or local filesystem.
"""
import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings

_gcs_client = None
_bucket = None


def _get_bucket():
    global _gcs_client, _bucket
    if _bucket is None:
        from google.cloud import storage
        _gcs_client = storage.Client(project=settings.GCP_PROJECT_ID)
        _bucket = _gcs_client.bucket(settings.GCS_BUCKET_NAME)
    return _bucket


async def upload_bytes(
    data: bytes,
    path: str,
    content_type: str = "application/octet-stream",
) -> Tuple[str, str]:
    """
    Uploads bytes to storage.
    Returns (public_url, storage_path)
    """
    if settings.STORAGE_BACKEND == "gcs" and not settings.TEST_MODE:
        return await _upload_to_gcs(data, path, content_type)
    return await _upload_to_local(data, path)


async def _upload_to_gcs(data: bytes, path: str, content_type: str) -> Tuple[str, str]:
    bucket = _get_bucket()
    blob = bucket.blob(path)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    return blob.public_url, f"gs://{settings.GCS_BUCKET_NAME}/{path}"


async def _upload_to_local(data: bytes, path: str) -> Tuple[str, str]:
    full_path = Path(settings.LOCAL_STORAGE_PATH) / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(full_path, "wb") as f:
        await f.write(data)
    relative = f"/storage/{path}"
    return relative, str(full_path)


async def get_public_url(storage_path: str) -> str:
    """Convert a storage path to a publicly accessible URL."""
    if storage_path.startswith("gs://"):
        bucket_and_path = storage_path[5:]
        parts = bucket_and_path.split("/", 1)
        return f"https://storage.googleapis.com/{parts[0]}/{parts[1]}"
    if storage_path.startswith("/storage/"):
        return f"{settings.BASE_URL}{storage_path}"
    return f"{settings.BASE_URL}/storage/{storage_path}"


async def copy_gcs_to_local(gcs_uri: str, local_path: str) -> str:
    """Copy a GCS file to local storage and return the local URL."""
    from google.cloud import storage as gcs
    client = gcs.Client(project=settings.GCP_PROJECT_ID)
    bucket_name, blob_name = gcs_uri[5:].split("/", 1)
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    data = blob.download_as_bytes()
    url, _ = await _upload_to_local(data, local_path)
    return url


async def read_bytes(storage_path: str) -> Tuple[bytes, str]:
    """
    Reads bytes from a storage path (local absolute path or GCS URI).
    Returns (data, content_type).
    """
    if storage_path.startswith("gs://"):
        from google.cloud import storage as gcs
        import mimetypes as _mt
        client = gcs.Client(project=settings.GCP_PROJECT_ID)
        bucket_name, blob_name = storage_path[5:].split("/", 1)
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        data = blob.download_as_bytes()
        content_type = blob.content_type or "application/octet-stream"
        return data, content_type
    else:
        import mimetypes as _mt
        async with aiofiles.open(storage_path, "rb") as f:
            data = await f.read()
        content_type, _ = _mt.guess_type(storage_path)
        return data, content_type or "application/octet-stream"


def local_storage_dir(request_id: str) -> Path:
    p = Path(settings.LOCAL_STORAGE_PATH) / request_id
    p.mkdir(parents=True, exist_ok=True)
    return p
