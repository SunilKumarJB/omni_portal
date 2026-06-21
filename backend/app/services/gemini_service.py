"""
Gemini service for prompt generation and image analysis.
Uses gemini-2.5-pro for structured outputs (lowest hallucination risk)
and gemini-2.0-flash for fast image understanding.
"""
import json
import base64
from typing import Optional
from app.config import settings
from app.models.schemas import PromptsResponse, VideoStyle, VideoTheme, SamplePrompt, PRESET_STYLES, PRESET_THEMES

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


PROMPT_GENERATION_SCHEMA = {
    "type": "object",
    "properties": {
        "product_description": {
            "type": "string",
            "description": "Brief description of what the product is"
        },
        "suggested_styles": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "icon": {"type": "string"}
                },
                "required": ["id", "name", "description", "icon"]
            }
        },
        "suggested_themes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "color": {"type": "string"}
                },
                "required": ["id", "name", "description", "color"]
            }
        },
        "sample_prompts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "text": {"type": "string"},
                    "style_hint": {"type": "string"}
                },
                "required": ["id", "text", "style_hint"]
            }
        }
    },
    "required": ["product_description", "suggested_styles", "suggested_themes", "sample_prompts"]
}


async def generate_prompts_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> PromptsResponse:
    if settings.TEST_MODE:
        return _test_prompts_response()

    from google import genai
    from google.genai import types

    client = _get_client()
    image_b64 = base64.b64encode(image_bytes).decode()

    system_instruction = (
        "You are a creative video production director. Analyze product images and generate "
        "compelling video production briefs. Always respond with valid JSON only. "
        "Be specific, creative, and avoid generic descriptions."
    )

    user_prompt = """Analyze this product image and generate a video production brief.

Return a JSON object with:
1. product_description: What this product is (1-2 sentences, factual)
2. suggested_styles: Array of 3 video styles best suited for this product (choose from: cinematic, commercial, documentary, social, tutorial, lifestyle)
3. suggested_themes: Array of 3 visual themes that match this product's audience (choose from: professional, vibrant, dark_moody, minimalist, nature, urban)
4. sample_prompts: Array of 3 specific, detailed video prompts for this product. Each prompt should be 2-3 sentences describing exactly what happens in the video.

For each style use these icons: cinematic=🎬 commercial=📺 documentary=🎥 social=📱 tutorial=📚 lifestyle=✨
For each theme use these hex colors: professional=#1e40af vibrant=#7c3aed dark_moody=#1f2937 minimalist=#6b7280 nature=#065f46 urban=#b45309"""

    response = client.models.generate_content(
        model=settings.GEMINI_PRO_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_b64)),
                    types.Part(text=user_prompt),
                ]
            )
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=PROMPT_GENERATION_SCHEMA,
            temperature=0.3,
            max_output_tokens=2048,
        )
    )

    data = json.loads(response.text)

    styles = [VideoStyle(**s) for s in data.get("suggested_styles", [])] or PRESET_STYLES[:3]
    themes = [VideoTheme(**t) for t in data.get("suggested_themes", [])] or PRESET_THEMES[:3]
    prompts = [SamplePrompt(**p) for p in data.get("sample_prompts", [])]

    return PromptsResponse(
        styles=styles,
        themes=themes,
        sample_prompts=prompts,
        product_description=data.get("product_description", ""),
    )


async def analyze_image_for_video(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Use Gemini Flash (Omni/multimodal) to get a brief description of an uploaded image."""
    if settings.TEST_MODE:
        return "A person with a professional appearance, suitable as a video presenter."

    from google import genai
    from google.genai import types

    client = _get_client()
    image_b64 = base64.b64encode(image_bytes).decode()

    response = client.models.generate_content(
        model=settings.GEMINI_FLASH_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_b64)),
                    types.Part(text="Describe this image in 1-2 sentences for use as a video character reference. Focus on appearance only."),
                ]
            )
        ],
        config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=150)
    )
    return response.text.strip()


def _test_prompts_response() -> PromptsResponse:
    return PromptsResponse(
        product_description="A premium consumer product with modern design aesthetics.",
        styles=PRESET_STYLES[:3],
        themes=PRESET_THEMES[:3],
        sample_prompts=[
            SamplePrompt(
                id="sp_01",
                text="A confident professional holds the product against a clean white background. Close-up shots reveal intricate details while upbeat music builds. The camera pulls back to reveal the full product in perfect lighting.",
                style_hint="cinematic"
            ),
            SamplePrompt(
                id="sp_02",
                text="Hands unbox the product in slow motion, particles of light catching the air. The product is placed on a sleek surface as the camera orbits around it. Text overlays highlight key features with clean animations.",
                style_hint="commercial"
            ),
            SamplePrompt(
                id="sp_03",
                text="A lifestyle shot shows someone enjoying the product outdoors in golden hour light. Candid moments of use tell an authentic story. The video ends with the product prominently featured against a sunset.",
                style_hint="lifestyle"
            ),
        ],
    )
