"""
Omni video generation via Gemini Enterprise Interactions API (gemini-omni-flash-preview).
Supports T2V with reference images, audio-driven generation, and V2V editing.
"""

import asyncio
import base64
import time
from datetime import timezone
from typing import Awaitable, Callable, Optional, Tuple

import httpx
import google.auth
import google.auth.transport.requests

from app.config import settings

_ASPECT_RATIO_MAP = {
    "16:9": "Landscape (16:9)",
    "9:16": "Portrait (9:16)",
}

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
    # gemini-omni-flash-preview (Preview, released 2026-06-30):
    # https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/omni-flash-preview
    # The model is global-only. Override via OMNI_ENDPOINT_URL when the API surface changes.
    project = settings.OMNI_PROJECT_ID or settings.GCP_PROJECT_ID
    if settings.OMNI_ENDPOINT_URL:
        return settings.OMNI_ENDPOINT_URL.format(
            project=project,
            model=settings.GEMINI_MODEL,
        )
    return f"https://aiplatform.googleapis.com/v1beta1/projects/{project}/locations/global/interactions"


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
    if settings.GEMINI_API_KEY:
        return {"X-Goog-Api-Key": settings.GEMINI_API_KEY, "Content-Type": "application/json"}
    token = await _get_cached_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _enrich_prompt(
    prompt: str,
    dialogue: Optional[str] = None,
    language: Optional[str] = None,
    has_character: bool = False,
    has_audio: bool = False,
    is_v2v: bool = False,
) -> str:
    """
    Build the final Omni text input. The scenario template carries the visual style
    inline (it IS the style), so this only adds the things the template can't:
    bind the character reference, speak the dialogue in the chosen language, and
    sync any audio / V2V edit.
    """
    parts = [prompt]

    # Bind the character image. Scenario templates already embed the [REF_Character]
    # token throughout their prompt; only add a binding instruction when the prompt
    # (e.g. a fully custom one) doesn't reference it. Casing matches the templates.
    if has_character and "[REF_Character]" not in prompt:
        parts.append("Use [REF_Character] as the main character in the video.")

    # Speak the dialogue in the selected language with lip-sync — the headline feature.
    if dialogue and dialogue.strip():
        lang_name = _LANGUAGE_NAMES.get(language or "en", "English")
        parts.append(
            f"The character speaks the following line in {lang_name}, "
            f'with natural, accurate lip-sync: "{dialogue.strip()}"'
        )

    if has_audio:
        parts.append(
            "Synchronize with the provided audio track, including lip-sync where applicable."
        )

    if is_v2v:
        parts.append(
            "Apply the described changes to the source video while keeping the core scene intact."
        )

    parts.append("High quality, 4K resolution.")
    return " ".join(parts)


def _media_payload(data: bytes, media_type: str, mime_type: str) -> dict:
    return {
        "type": media_type,
        "mime_type": mime_type,
        "data": base64.b64encode(data).decode(),
    }


def _compose_request(
    prompt: str,
    media_inputs: list,
    aspect_ratio: str,
    duration_seconds: int,
) -> dict:
    omni_ratio = _ASPECT_RATIO_MAP.get(aspect_ratio, "Landscape (16:9)")
    return {
        "model": settings.GEMINI_MODEL,
        "input": [
            {
                "type": "text",
                "text": f"[aspect_ratio={omni_ratio}][duration={duration_seconds}s] {prompt}",
            },
            *media_inputs,
        ],
        "background": True,
    }


def _extract_video_bytes(response: dict) -> Tuple[Optional[bytes], str]:
    contents = []
    if "steps" in response:
        for step in response["steps"]:
            if step.get("type") == "model_output":
                contents.extend(step.get("content", []))
    elif "outputs" in response:
        contents = response["outputs"]

    for output in contents:
        if output.get("type") == "video" and "data" in output:
            return base64.b64decode(output["data"]), output.get("mime_type", "video/mp4")

    return None, "video/mp4"


async def generate_video(
    prompt: str,
    dialogue: Optional[str] = None,
    language: Optional[str] = None,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 10,
    character_image_bytes: Optional[bytes] = None,
    character_image_mime: Optional[str] = None,
    audio_bytes: Optional[bytes] = None,
    audio_mime: Optional[str] = None,
    source_video_bytes: Optional[bytes] = None,
    source_video_mime: Optional[str] = None,
    progress_callback: Optional[Callable[[float], Awaitable[None]]] = None,
) -> Tuple[bytes, str]:
    """
    Generates video via Omni Interactions API.
    Returns (video_bytes, mime_type).
    Raises RuntimeError / TimeoutError on failure.

    progress_callback: optional async fn called with a fraction in [0.0, 1.0]
    on each poll tick so callers can surface live progress during the
    multi-minute generation instead of a frozen bar.
    """
    if settings.TEST_MODE:
        await asyncio.sleep(3)
        return b"", "video/mp4"

    enriched_prompt = _enrich_prompt(
        prompt,
        dialogue=dialogue,
        language=language,
        has_character=bool(character_image_bytes),
        has_audio=bool(audio_bytes),
        is_v2v=bool(source_video_bytes),
    )

    media_inputs = []
    if character_image_bytes:
        media_inputs.append(
            _media_payload(character_image_bytes, "image", character_image_mime or "image/png")
        )
    if audio_bytes:
        media_inputs.append(_media_payload(audio_bytes, "audio", audio_mime or "audio/wav"))
    if source_video_bytes:
        media_inputs.append(
            _media_payload(source_video_bytes, "video", source_video_mime or "video/mp4")
        )

    payload = _compose_request(enriched_prompt, media_inputs, aspect_ratio, duration_seconds)
    endpoint = _api_endpoint()

    # Reuse a single AsyncClient session for the entire lifecycle of the request and polling
    async with httpx.AsyncClient(timeout=60.0) as client:
        headers = await _auth_headers()
        resp = await client.post(endpoint, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "error" in data:
            raise RuntimeError(f"Omni API error: {data['error']}")

        interaction_id = data.get("id")
        status = data.get("status")
        elapsed = 0
        poll_interval = 10

        while status == "in_progress":
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            if elapsed >= settings.OMNI_MAX_WAIT_SECONDS:
                raise TimeoutError(
                    f"Omni video generation timed out after {settings.OMNI_MAX_WAIT_SECONDS}s"
                )

            if progress_callback is not None:
                # Cap below 1.0 so the bar keeps moving but never claims "done"
                # before the model actually returns the video.
                fraction = min(elapsed / settings.OMNI_MAX_WAIT_SECONDS, 0.95)
                try:
                    await progress_callback(fraction)
                except Exception:
                    pass  # progress reporting must never break generation

            headers = await _auth_headers()
            # Reuse the same client session
            poll_resp = await client.get(f"{endpoint}/{interaction_id}", headers=headers)
            poll_resp.raise_for_status()
            data = poll_resp.json()

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

    video_bytes, mime_type = _extract_video_bytes(data)
    if not video_bytes:
        raise RuntimeError("Omni returned no video data in response")

    return video_bytes, mime_type
