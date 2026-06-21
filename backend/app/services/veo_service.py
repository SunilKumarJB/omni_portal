"""
Omni video generation service via google-genai SDK.
"""
import asyncio
import time
from typing import Optional
from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        from google import genai
        _client = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_LOCATION,
        )
    return _client


async def generate_video(
    prompt: str,
    style_id: str,
    theme_id: str,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 8,
    product_image_gcs_uri: Optional[str] = None,
    character_image_gcs_uri: Optional[str] = None,
) -> str:
    """
    Kicks off Omni video generation and polls until complete.
    Returns the GCS URI of the generated video.
    """
    if settings.TEST_MODE:
        await asyncio.sleep(3)
        return "TEST_MODE_PLACEHOLDER_VIDEO"

    from google import genai
    from google.genai import types

    client = _get_client()

    enriched_prompt = _enrich_prompt(prompt, style_id, theme_id)

    image_parts = []
    if product_image_gcs_uri:
        image_parts.append(
            types.Image(gcs_uri=product_image_gcs_uri, mime_type="image/jpeg")
        )
    if character_image_gcs_uri:
        image_parts.append(
            types.Image(gcs_uri=character_image_gcs_uri, mime_type="image/jpeg")
        )

    generate_config = types.GenerateVideoConfig(
        aspect_ratio=aspect_ratio,
        output_gcs_uri=f"gs://{settings.GCS_BUCKET_NAME}/generated_videos/",
        number_of_videos=1,
        duration_seconds=duration_seconds,
        person_generation="allow_adult",
        enhance_prompt=True,
    )

    if image_parts:
        operation = client.models.generate_videos(
            model=settings.VEO_MODEL,
            prompt=enriched_prompt,
            image=image_parts[0] if len(image_parts) == 1 else image_parts,
            config=generate_config,
        )
    else:
        operation = client.models.generate_videos(
            model=settings.VEO_MODEL,
            prompt=enriched_prompt,
            config=generate_config,
        )

    # Poll for completion (Omni generation takes 2-5 minutes)
    max_wait = 600
    elapsed = 0
    poll_interval = 10

    while not operation.done:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
        operation = client.operations.get(operation)
        if elapsed >= max_wait:
            raise TimeoutError("Video generation timed out after 10 minutes")

    if operation.result and operation.result.generated_videos:
        video = operation.result.generated_videos[0]
        return video.video.uri

    raise RuntimeError("Video generation completed but no video was returned")


def _enrich_prompt(prompt: str, style_id: str, theme_id: str) -> str:
    style_modifiers = {
        "cinematic": "cinematic wide shots, dramatic lighting, film grain, shallow depth of field",
        "commercial": "clean commercial aesthetic, product-focused, bright even lighting, professional",
        "documentary": "authentic handheld feel, natural lighting, real-world environment",
        "social": "vertical format energy, fast cuts, modern trending aesthetic, vibrant",
        "tutorial": "clear instructional visuals, step-by-step, well-lit, educational tone",
        "lifestyle": "golden hour warm tones, aspirational lifestyle, candid moments",
    }
    theme_modifiers = {
        "professional": "corporate polish, muted professional colors, trust-inspiring",
        "vibrant": "saturated vivid colors, high energy, youthful dynamic",
        "dark_moody": "deep shadows, luxury dark palette, mysterious atmosphere",
        "minimalist": "clean negative space, elegant simplicity, monochromatic tones",
        "nature": "organic natural greens, fresh outdoor feel, sustainable aesthetic",
        "urban": "city backdrop, concrete textures, modern metropolitan energy",
    }
    style_mod = style_modifiers.get(style_id, "")
    theme_mod = theme_modifiers.get(theme_id, "")
    return f"{prompt}. Visual style: {style_mod}. Color theme: {theme_mod}. High quality, 4K resolution."
