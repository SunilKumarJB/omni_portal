"""
Omni video generation via Gemini Enterprise Interactions API (gemini-omni-1.1-flash-preview).
Supports T2V with reference images and V2V editing.
"""

import asyncio
import base64
import logging
import math
import time
from datetime import timezone
from typing import Awaitable, Callable, NamedTuple, Optional, Tuple

import httpx
import google.auth
import google.auth.transport.requests

from app.config import settings

logger = logging.getLogger(__name__)

_ASPECT_RATIOS = ("16:9", "9:16")

# HTTP statuses worth retrying: quota pushback and transient backend failures.
_POLL_RETRY_STATUSES = (429, 500, 502, 503, 504)
_SUBMIT_RETRY_STATUSES = (429, 502, 503, 504)
_MAX_POLL_FAILURES = 5
_MAX_SUBMIT_ATTEMPTS = 3

# A completed interaction can carry a multi-MB base64 video; parse those off the event loop.
_LARGE_BODY_BYTES = 1_000_000

# Maps the UI's language codes (DialogueSelector.tsx) to human-readable names so the
# prompt can instruct Omni to speak the dialogue in the chosen language with lip-sync.
_LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
}


def _api_endpoint() -> str:
    # Endpoint per the Gemini Enterprise Agent Platform docs for
    # gemini-omni-1.1-flash:
    # The model is global-only. Override via OMNI_ENDPOINT_URL when the API surface changes.
    project = settings.OMNI_PROJECT_ID or settings.GCP_PROJECT_ID
    if settings.OMNI_ENDPOINT_URL:
        return settings.OMNI_ENDPOINT_URL.format(
            project=project,
            model=settings.GEMINI_MODEL,
        )
    return f"https://aiplatform.googleapis.com/v1beta1/projects/{project}/locations/global/interactions"


# Shared and fallback HTTP clients for connection pooling
_shared_client: Optional[httpx.AsyncClient] = None
_fallback_client: Optional[httpx.AsyncClient] = None


def set_http_client(client: Optional[httpx.AsyncClient]) -> None:
    """Register or clear the shared HTTP client managed by application lifespan."""
    global _shared_client
    _shared_client = client


def get_http_client(client: Optional[httpx.AsyncClient] = None) -> httpx.AsyncClient:
    """
    Retrieve the shared HTTP client if available, or create/cache an AsyncClient fallback.

    Priority:
    1. Explicitly passed client argument.
    2. Lifespan-registered shared client (_shared_client) if not closed.
    3. FastAPI app.state.http_client (if available and not closed).
    4. Cached fallback AsyncClient (for standalone scripts or tests outside lifespan).
    """
    if client is not None:
        return client

    if _shared_client is not None and not _shared_client.is_closed:
        return _shared_client

    try:
        from app.main import app

        if (
            hasattr(app.state, "http_client")
            and app.state.http_client is not None
            and not app.state.http_client.is_closed
        ):
            return app.state.http_client
    except (ImportError, AttributeError):
        pass

    global _fallback_client
    if _fallback_client is None or _fallback_client.is_closed:
        limits = httpx.Limits(
            max_keepalive_connections=getattr(settings, "HTTP_MAX_KEEPALIVE_CONNECTIONS", 50),
            max_connections=getattr(settings, "HTTP_MAX_CONNECTIONS", 200),
        )
        timeout = getattr(settings, "HTTP_TIMEOUT_SECONDS", 60.0)
        _fallback_client = httpx.AsyncClient(limits=limits, timeout=timeout)

    return _fallback_client


async def close_fallback_client() -> None:
    """Close cached fallback client if open."""
    global _fallback_client
    if _fallback_client is not None and not _fallback_client.is_closed:
        await _fallback_client.aclose()
        _fallback_client = None


# Thread-safe async-safe Google OAuth2 Token Cache
_token_cache = None
_token_expiry = 0.0
_token_lock = asyncio.Lock()


async def _get_cached_token() -> str:
    global _token_cache, _token_expiry
    now = time.time()
    # Return cached token if valid (with a 5-minute buffer)
    if _token_cache and now < (_token_expiry - 300):
        return _token_cache

    async with _token_lock:
        # Double check after acquiring lock
        now = time.time()
        if _token_cache and now < (_token_expiry - 300):
            return _token_cache

        def refresh():
            creds, _ = google.auth.default()
            auth_req = google.auth.transport.requests.Request()
            creds.refresh(auth_req)
            expiry_ts = (
                creds.expiry.replace(tzinfo=timezone.utc).timestamp()
                if creds.expiry
                else time.time() + 3600
            )
            return creds.token, expiry_ts

        token, expiry = await asyncio.to_thread(refresh)
        _token_cache = token
        _token_expiry = expiry
        return token


async def _auth_headers() -> dict:
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("local-proxy"):
        return {"X-Goog-Api-Key": settings.GEMINI_API_KEY, "Content-Type": "application/json"}
    token = await _get_cached_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _enrich_prompt(
    prompt: str,
    dialogue: Optional[str] = None,
    language: Optional[str] = None,
    has_character: bool = False,
    is_v2v: bool = False,
    character_image_uri: Optional[str] = None,
    character_image_bytes: Optional[bytes] = None,
    source_video_uri: Optional[str] = None,
    source_video_bytes: Optional[bytes] = None,
) -> str:
    """
    Build the final Omni text input. The scenario template carries the visual style
    inline (it IS the style), so this only adds the things the template can't:
    bind the character reference, speak the dialogue in the chosen language, and
    describe the V2V edit.
    """
    character_present = has_character or bool(character_image_uri) or bool(character_image_bytes)
    v2v_present = is_v2v or bool(source_video_uri) or bool(source_video_bytes)

    parts = [prompt]

    # Bind the character image. Scenario templates already embed the [REF_Character]
    # token throughout their prompt; only add a binding instruction when the prompt
    # (e.g. a fully custom one) doesn't reference it. Casing matches the templates.
    if character_present and "[REF_Character]" not in prompt:
        parts.append("Use [REF_Character] as the main character in the video.")

    # Speak the dialogue in the selected language with lip-sync — the headline feature.
    if dialogue and dialogue.strip():
        lang_name = _LANGUAGE_NAMES.get(language or "en", "English")
        parts.append(
            f"The character speaks the following line in {lang_name}, "
            f'with natural, accurate lip-sync: "{dialogue.strip()}"'
        )

    if v2v_present:
        parts.append(
            "Apply the described changes to the source video while keeping the core scene intact."
        )

    return " ".join(parts)


def _media_payload(
    data: Optional[bytes] = None,
    media_type: str = "image",
    mime_type: str = "image/png",
    uri: Optional[str] = None,
) -> dict:
    if uri:
        return {
            "type": media_type,
            "mime_type": mime_type,
            "uri": uri,
        }
    if data is not None:
        return {
            "type": media_type,
            "mime_type": mime_type,
            "data": base64.b64encode(data).decode(),
        }
    raise ValueError(f"Either uri or data must be provided for {media_type} media payload")


def _video_task(has_character: bool, has_source_video: bool) -> str:
    """Pick generation_config.video_config.task to match the supplied inputs."""
    if has_source_video:
        return "edit"
    if has_character:
        return "reference_to_video"
    return "text_to_video"


def _output_gcs_uri(request_id: Optional[str]) -> Optional[str]:
    """Cloud Storage prefix for uri delivery, or None when output must come back inline."""
    if settings.TEST_MODE or settings.STORAGE_BACKEND != "gcs":
        return None
    if not settings.GCS_BUCKET_NAME:
        return None
    prefix = f"gs://{settings.GCS_BUCKET_NAME}"
    return f"{prefix}/{request_id}/" if request_id else f"{prefix}/"


def _compose_request(
    prompt: str,
    media_inputs: list,
    aspect_ratio: str,
    duration_seconds: int,
    task: str = "text_to_video",
    output_gcs_uri: Optional[str] = None,
) -> dict:
    response_format: dict = {
        "type": "video",
        "aspect_ratio": aspect_ratio if aspect_ratio in _ASPECT_RATIOS else "16:9",
        "duration": f"{duration_seconds}s",
    }
    if output_gcs_uri:
        response_format["delivery"] = "uri"
        response_format["gcs_uri"] = output_gcs_uri

    return {
        "model": settings.GEMINI_MODEL,
        "input": [
            {"type": "text", "text": prompt},
            *media_inputs,
        ],
        "background": True,
        "response_format": [response_format],
        "generation_config": {"video_config": {"task": task}},
    }


def _extract_video_output(response: dict) -> Tuple[Optional[bytes], str, Optional[str]]:
    """Return (inline_bytes, mime_type, uri) for the first video output in the interaction."""
    contents = []
    if "steps" in response:
        for step in response["steps"]:
            if step.get("type") == "model_output":
                contents.extend(step.get("content", []))
    elif "outputs" in response:
        contents = response["outputs"]

    for output in contents:
        if output.get("type") != "video":
            continue
        mime_type = output.get("mime_type") or "video/mp4"
        if output.get("data"):
            return base64.b64decode(output["data"]), mime_type, None
        if output.get("uri"):
            return None, mime_type, output["uri"]

    return None, "video/mp4", None


def calculate_progress_fraction(elapsed: float) -> float:
    """
    Calculate an asymptotic smooth progress fraction based on expected generation duration (~55s median).
    Fraction smoothly approaches 0.98 so the progress bar keeps advancing on long jobs without
    prematurely claiming completion before the model returns the video.
    """
    if elapsed <= 0:
        return 0.0
    return min(0.98, 1.0 - math.exp(-elapsed / 25.0))


def _raise_for_status(context: str, resp: httpx.Response) -> None:
    """Surface the status code and body prefix — safety blocks and quota reasons live there."""
    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Omni {context} failed with HTTP {resp.status_code}: {resp.text[:500]}"
        ) from exc


async def _parse_body(resp: httpx.Response) -> dict:
    if len(resp.content) > _LARGE_BODY_BYTES:
        return await asyncio.to_thread(resp.json)
    return resp.json()


async def _submit_interaction(http_client: httpx.AsyncClient, endpoint: str, payload: dict) -> dict:
    last_error: Optional[Exception] = None
    for attempt in range(_MAX_SUBMIT_ATTEMPTS):
        headers = await _auth_headers()
        try:
            resp = await http_client.post(endpoint, headers=headers, json=payload)
        except httpx.TransportError as exc:
            last_error = exc
        else:
            if resp.status_code not in _SUBMIT_RETRY_STATUSES:
                _raise_for_status("submit", resp)
                return await _parse_body(resp)
            last_error = RuntimeError(
                f"Omni submit failed with HTTP {resp.status_code}: {resp.text[:500]}"
            )
        if attempt < _MAX_SUBMIT_ATTEMPTS - 1:
            await asyncio.sleep(2**attempt)
    raise RuntimeError(
        f"Omni submit failed after {_MAX_SUBMIT_ATTEMPTS} attempts: {last_error}"
    ) from last_error


async def _poll_interaction(http_client: httpx.AsyncClient, url: str) -> dict:
    last_error: Optional[Exception] = None
    for attempt in range(_MAX_POLL_FAILURES):
        headers = await _auth_headers()
        try:
            resp = await http_client.get(url, headers=headers)
        except httpx.TransportError as exc:
            last_error = exc
        else:
            if resp.status_code not in _POLL_RETRY_STATUSES:
                _raise_for_status("poll", resp)
                return await _parse_body(resp)
            last_error = RuntimeError(
                f"Omni poll failed with HTTP {resp.status_code}: {resp.text[:500]}"
            )
        if attempt < _MAX_POLL_FAILURES - 1:
            await asyncio.sleep(2**attempt)
    raise RuntimeError(
        f"Omni poll failed after {_MAX_POLL_FAILURES} consecutive attempts: {last_error}"
    ) from last_error


class VideoResult(NamedTuple):
    video_bytes: Optional[bytes]
    mime_type: str
    uri: Optional[str]
    final_prompt: str


async def generate_video(
    prompt: str,
    dialogue: Optional[str] = None,
    language: Optional[str] = None,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 10,
    character_image_bytes: Optional[bytes] = None,
    character_image_mime: Optional[str] = None,
    character_image_uri: Optional[str] = None,
    source_video_bytes: Optional[bytes] = None,
    source_video_mime: Optional[str] = None,
    source_video_uri: Optional[str] = None,
    request_id: Optional[str] = None,
    progress_callback: Optional[Callable[[float], Awaitable[None]]] = None,
    client: Optional[httpx.AsyncClient] = None,
) -> VideoResult:
    """
    Generates video via Omni Interactions API.
    Returns a VideoResult: inline bytes for inline delivery, or a gs:// uri when the
    output was delivered to Cloud Storage.
    Raises RuntimeError / TimeoutError on failure.

    progress_callback: optional async fn called with a fraction in [0.0, 1.0]
    on each poll tick so callers can surface live progress during the
    multi-minute generation instead of a frozen bar.
    """
    enriched_prompt = _enrich_prompt(
        prompt,
        dialogue=dialogue,
        language=language,
        character_image_uri=character_image_uri,
        character_image_bytes=character_image_bytes,
        source_video_uri=source_video_uri,
        source_video_bytes=source_video_bytes,
    )

    if settings.TEST_MODE:
        await asyncio.sleep(3)
        return VideoResult(b"", "video/mp4", None, enriched_prompt)

    has_character = bool(character_image_uri or character_image_bytes)
    has_source_video = bool(source_video_uri or source_video_bytes)

    media_inputs = []
    if has_character:
        media_inputs.append(
            _media_payload(
                data=character_image_bytes,
                media_type="image",
                mime_type=character_image_mime or "image/png",
                uri=character_image_uri,
            )
        )
    if has_source_video:
        media_inputs.append(
            _media_payload(
                data=source_video_bytes,
                media_type="video",
                mime_type=source_video_mime or "video/mp4",
                uri=source_video_uri,
            )
        )

    payload = _compose_request(
        enriched_prompt,
        media_inputs,
        aspect_ratio,
        duration_seconds,
        task=_video_task(has_character, has_source_video),
        output_gcs_uri=_output_gcs_uri(request_id),
    )
    endpoint = _api_endpoint()

    # Reuse shared AsyncClient connection pool for request and polling
    http_client = get_http_client(client)
    data = await _submit_interaction(http_client, endpoint, payload)

    if "error" in data:
        raise RuntimeError(f"Omni API error: {data['error']}")

    interaction_id = data.get("id")
    status = data.get("status")
    started = time.monotonic()
    logger.info(
        "omni interaction submitted request_id=%s interaction_id=%s", request_id, interaction_id
    )

    # Keep polling until the interaction reaches a terminal state; an unexpected
    # non-terminal status (for example a queued state) must not end the loop early.
    while status not in (None, "completed", "failed"):
        await asyncio.sleep(settings.OMNI_POLL_INTERVAL_SECONDS)
        elapsed = time.monotonic() - started
        if elapsed >= settings.OMNI_MAX_WAIT_SECONDS:
            raise TimeoutError(
                f"Omni video generation timed out after {settings.OMNI_MAX_WAIT_SECONDS}s"
            )

        if progress_callback is not None:
            fraction = calculate_progress_fraction(elapsed)
            try:
                await progress_callback(fraction)
            except Exception:
                logger.warning("progress callback failed request_id=%s", request_id, exc_info=True)

        data = await _poll_interaction(http_client, f"{endpoint}/{interaction_id}")

        if "error" in data:
            raise RuntimeError(f"Omni API error: {data['error']}")

        status = data.get("status")

    if status == "failed":
        fail_msg = (
            data.get("error")
            or data.get("failure_reason")
            or "Omni generation failed on the model endpoint"
        )
        raise RuntimeError(f"Omni generation failed: {fail_msg}")

    video_bytes, mime_type, video_uri = _extract_video_output(data)
    if not video_bytes and not video_uri:
        raise RuntimeError("Omni returned no video data in response")

    return VideoResult(video_bytes, mime_type, video_uri, enriched_prompt)
