"""
Omni video generation via Vertex Interactions API (gemini-omni-flash-preview).
Supports T2V with reference images, audio-driven generation, and V2V editing.
"""
import asyncio
import base64
from typing import Optional, Tuple

import httpx
import google.auth
import google.auth.transport.requests

from app.config import settings

_ENVIRONMENTS = {
    "autopush": "autopush-aiplatform.sandbox.googleapis.com",
    "staging": "staging-aiplatform.sandbox.googleapis.com",
    "prod": "aiplatform.googleapis.com",
}

_ASPECT_RATIO_MAP = {
    "16:9": "Landscape (16:9)",
    "9:16": "Portrait (9:16)",
    "1:1": "Square (1:1)",
}

_STYLE_MODIFIERS = {
    "cinematic": "cinematic wide shots, dramatic lighting, film grain, shallow depth of field",
    "commercial": "clean commercial aesthetic, product-focused, bright even lighting, professional",
    "documentary": "authentic handheld feel, natural lighting, real-world environment",
    "social": "vertical format energy, fast cuts, modern trending aesthetic, vibrant",
    "tutorial": "clear instructional visuals, step-by-step, well-lit, educational tone",
    "lifestyle": "golden hour warm tones, aspirational lifestyle, candid moments",
}

_THEME_MODIFIERS = {
    "professional": "corporate polish, muted professional colors, trust-inspiring",
    "vibrant": "saturated vivid colors, high energy, youthful dynamic",
    "dark_moody": "deep shadows, luxury dark palette, mysterious atmosphere",
    "minimalist": "clean negative space, elegant simplicity, monochromatic tones",
    "nature": "organic natural greens, fresh outdoor feel, sustainable aesthetic",
    "urban": "city backdrop, concrete textures, modern metropolitan energy",
}


def _api_endpoint() -> str:
    project = settings.OMNI_PROJECT_ID or settings.GCP_PROJECT_ID
    host = _ENVIRONMENTS.get(settings.OMNI_ENVIRONMENT, _ENVIRONMENTS["autopush"])
    return f"https://{host}/v1beta1/projects/{project}/locations/{settings.OMNI_REGION}/interactions"


def _get_token() -> str:
    """Refresh and return a Google OAuth2 access token (blocking — run via asyncio.to_thread)."""
    creds, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token


async def _auth_headers() -> dict:
    token = await asyncio.to_thread(_get_token)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _enrich_prompt(
    prompt: str,
    style_id: str,
    theme_id: str,
    has_product: bool = False,
    has_character: bool = False,
    has_audio: bool = False,
    is_v2v: bool = False,
) -> str:
    parts = [prompt]

    if has_product and has_character:
        parts.append(
            "Feature [REF_PRODUCT] prominently and use [REF_CHARACTER] as the main presenter."
        )
    elif has_product:
        parts.append("Feature [REF_PRODUCT] prominently in the video.")
    elif has_character:
        parts.append("Use [REF_CHARACTER] as the main character in the video.")

    if has_audio:
        parts.append(
            "Synchronize with the provided audio track, including lip-sync where applicable."
        )

    if is_v2v:
        parts.append(
            "Apply the described changes to the source video while keeping the core scene intact."
        )

    style_mod = _STYLE_MODIFIERS.get(style_id, "")
    theme_mod = _THEME_MODIFIERS.get(theme_id, "")
    if style_mod:
        parts.append(f"Visual style: {style_mod}.")
    if theme_mod:
        parts.append(f"Color theme: {theme_mod}.")

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
        "model": settings.OMNI_MODEL,
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
    style_id: str,
    theme_id: str,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 10,
    product_image_bytes: Optional[bytes] = None,
    product_image_mime: Optional[str] = None,
    character_image_bytes: Optional[bytes] = None,
    character_image_mime: Optional[str] = None,
    audio_bytes: Optional[bytes] = None,
    audio_mime: Optional[str] = None,
    source_video_bytes: Optional[bytes] = None,
    source_video_mime: Optional[str] = None,
) -> Tuple[bytes, str]:
    """
    Generates video via Omni Interactions API.
    Returns (video_bytes, mime_type).
    Raises RuntimeError / TimeoutError on failure.
    """
    if settings.TEST_MODE:
        await asyncio.sleep(3)
        return b"", "video/mp4"

    enriched_prompt = _enrich_prompt(
        prompt, style_id, theme_id,
        has_product=bool(product_image_bytes),
        has_character=bool(character_image_bytes),
        has_audio=bool(audio_bytes),
        is_v2v=bool(source_video_bytes),
    )

    media_inputs = []
    if product_image_bytes:
        media_inputs.append(
            _media_payload(product_image_bytes, "image", product_image_mime or "image/jpeg")
        )
    if character_image_bytes:
        media_inputs.append(
            _media_payload(character_image_bytes, "image", character_image_mime or "image/jpeg")
        )
    if audio_bytes:
        media_inputs.append(
            _media_payload(audio_bytes, "audio", audio_mime or "audio/wav")
        )
    if source_video_bytes:
        media_inputs.append(
            _media_payload(source_video_bytes, "video", source_video_mime or "video/mp4")
        )

    payload = _compose_request(enriched_prompt, media_inputs, aspect_ratio, duration_seconds)
    endpoint = _api_endpoint()

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

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await _auth_headers()
            poll_resp = await client.get(
                f"{endpoint}/{interaction_id}", headers=headers
            )
            poll_resp.raise_for_status()
            data = poll_resp.json()

        if "error" in data:
            raise RuntimeError(f"Omni API error: {data['error']}")

        status = data.get("status")

    video_bytes, mime_type = _extract_video_bytes(data)
    if not video_bytes:
        raise RuntimeError("Omni returned no video data in response")

    return video_bytes, mime_type
