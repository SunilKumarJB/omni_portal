"""
Unified storage service: GCS or local filesystem.
"""

import asyncio
from datetime import timedelta
import logging
from pathlib import Path
from typing import Tuple

import aiofiles
from app.config import settings

logger = logging.getLogger(__name__)

_gcs_client = None
_bucket = None

# How long generated-video / asset links stay valid. Event-scale TTL; v4 caps at 7 days.
_SIGNED_URL_TTL = timedelta(days=7)


def _get_client():
    global _gcs_client
    if _gcs_client is None:
        from google.cloud import storage

        _gcs_client = storage.Client(project=settings.GCP_PROJECT_ID)
    return _gcs_client


def _get_bucket(bucket_name: str | None = None):
    global _gcs_client, _bucket
    target_name = bucket_name or settings.GCS_BUCKET_NAME
    if target_name == settings.GCS_BUCKET_NAME and _bucket is not None:
        return _bucket
    client = _get_client()
    bucket = client.bucket(target_name)
    if target_name == settings.GCS_BUCKET_NAME:
        _bucket = bucket
    return bucket


async def upload_bytes(
    data: bytes,
    path: str,
    content_type: str = "application/octet-stream",
    save_local: bool = False,
) -> Tuple[str, str]:
    """
    Uploads bytes to storage.
    Returns (public_url, storage_path).
    """
    if settings.STORAGE_BACKEND == "gcs" and not settings.TEST_MODE:
        try:
            return await _upload_to_gcs(data, path, content_type, save_local=save_local)
        except Exception as exc:
            logger.warning(
                "GCS upload failed for path %s (%s). Falling back to local storage.",
                path,
                exc,
            )
            return await _upload_to_local(data, path)
    return await _upload_to_local(data, path)


async def _upload_to_gcs(
    data: bytes,
    path: str,
    content_type: str,
    save_local: bool = False,
) -> Tuple[str, str]:
    bucket = _get_bucket()
    blob = bucket.blob(path)
    # Wrap blocking GCS upload in asyncio.to_thread
    await asyncio.to_thread(blob.upload_from_string, data, content_type=content_type)
    if save_local:
        await _upload_to_local(data, path)
    public_url = await asyncio.to_thread(_signed_url, blob)
    return public_url, f"gs://{settings.GCS_BUCKET_NAME}/{path}"


def _signed_url(blob) -> str:
    """
    Generate a v4 GET signed URL for a blob.

    Uses the IAM SignBlob path (credentials' service-account email + access token)
    so it works on Cloud Run / GCE without a downloaded private-key file. Falls
    back to the public URL if signing isn't possible, so generation never hard-fails
    on the link step.
    """
    import google.auth
    import google.auth.transport.requests

    try:
        try:
            creds, _ = google.auth.default()
            creds.refresh(google.auth.transport.requests.Request())
            sa_email = getattr(creds, "service_account_email", None)
            if sa_email and sa_email != "default":
                return blob.generate_signed_url(
                    version="v4",
                    expiration=_SIGNED_URL_TTL,
                    method="GET",
                    service_account_email=sa_email,
                    access_token=creds.token,
                )
        except Exception:
            pass

        # Local ADC with a service-account key or mock can sign directly.
        return blob.generate_signed_url(version="v4", expiration=_SIGNED_URL_TTL, method="GET")
    except Exception as exc:
        logger.warning(
            "Signed URL generation failed for blob %s (%s); falling back to public URL",
            getattr(blob, "name", str(blob)),
            exc,
        )
        # Last resort: bucket/objects must be public for this to resolve.
        try:
            return blob.public_url
        except Exception:
            bucket_name = getattr(getattr(blob, "bucket", None), "name", settings.GCS_BUCKET_NAME)
            blob_name = getattr(blob, "name", "")
            return f"https://storage.googleapis.com/{bucket_name}/{blob_name}"


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
        bucket_name = parts[0]
        blob_name = parts[1] if len(parts) > 1 else ""
        try:
            bucket = _get_bucket(bucket_name)
            blob = bucket.blob(blob_name)
            return await asyncio.to_thread(_signed_url, blob)
        except Exception as exc:
            logger.warning(
                "Failed to get signed URL for %s (%s). Returning static public URL.",
                storage_path,
                exc,
            )
            return f"https://storage.googleapis.com/{bucket_name}/{blob_name}"

    if storage_path.startswith(("http://", "https://")):
        return storage_path

    if storage_path.startswith(settings.LOCAL_STORAGE_PATH):
        rel = Path(storage_path).relative_to(settings.LOCAL_STORAGE_PATH).as_posix().lstrip("/")
        return f"{settings.BASE_URL}/storage/{rel}"

    if storage_path.startswith("/storage/"):
        return f"{settings.BASE_URL}{storage_path}"

    clean_path = storage_path.lstrip("/")
    return f"{settings.BASE_URL}/storage/{clean_path}"


async def copy_gcs_to_local(gcs_uri: str, local_path: str) -> str:
    """Copy a GCS file to local storage and return the local URL."""
    bucket_name, blob_name = gcs_uri[5:].split("/", 1)
    bucket = _get_bucket(bucket_name)
    blob = bucket.blob(blob_name)
    # Wrap blocking GCS download in asyncio.to_thread
    data = await asyncio.to_thread(blob.download_as_bytes)
    url, _ = await _upload_to_local(data, local_path)
    return url


async def read_bytes(storage_path: str) -> Tuple[bytes, str]:
    """
    Reads bytes from a storage path (local absolute path or GCS URI).
    Returns (data, content_type).
    """
    if storage_path.startswith("gs://"):
        bucket_name, blob_name = storage_path[5:].split("/", 1)
        bucket = _get_bucket(bucket_name)
        blob = bucket.blob(blob_name)
        # Wrap blocking GCS download in asyncio.to_thread
        data = await asyncio.to_thread(blob.download_as_bytes)
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
