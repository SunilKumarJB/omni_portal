from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class VideoStyle(BaseModel):
    id: str
    name: str
    description: str
    icon: str


class VideoTheme(BaseModel):
    id: str
    name: str
    description: str
    color: str


class SamplePrompt(BaseModel):
    id: str
    text: str
    style_hint: str


class PromptsResponse(BaseModel):
    styles: List[VideoStyle]
    themes: List[VideoTheme]
    sample_prompts: List[SamplePrompt]
    product_description: str


class GenerateVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=1000)
    style_id: str
    theme_id: str
    character_preset_id: Optional[str] = None
    audio_preset_id: Optional[str] = None
    request_id: Optional[str] = None


class VideoRequestStatus(BaseModel):
    request_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: int = 0
    video_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    video_page_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str
    prompt: Optional[str] = None
    style_id: Optional[str] = None
    theme_id: Optional[str] = None
    product_image_url: Optional[str] = None
    character_image_url: Optional[str] = None
    audio_url: Optional[str] = None


class UploadResponse(BaseModel):
    url: str
    path: str
    asset_type: str


PRESET_STYLES: List[VideoStyle] = [
    VideoStyle(
        id="cinematic",
        name="Cinematic",
        description="Epic wide shots, dramatic lighting, film-grade color grading",
        icon="🎬",
    ),
    VideoStyle(
        id="commercial",
        name="Commercial Ad",
        description="Clean, punchy, brand-focused with strong CTA energy",
        icon="📺",
    ),
    VideoStyle(
        id="documentary",
        name="Documentary",
        description="Authentic, real-world feel with natural lighting",
        icon="🎥",
    ),
    VideoStyle(
        id="social",
        name="Social Media",
        description="Vertical 9:16, fast cuts, trending aesthetic",
        icon="📱",
    ),
    VideoStyle(
        id="tutorial",
        name="Tutorial",
        description="Clear, step-by-step, educational tone with clean visuals",
        icon="📚",
    ),
    VideoStyle(
        id="lifestyle",
        name="Lifestyle",
        description="Aspirational, warm tones, everyday-beautiful moments",
        icon="✨",
    ),
]

PRESET_THEMES: List[VideoTheme] = [
    VideoTheme(
        id="professional",
        name="Professional",
        description="Corporate polish, trust, authority",
        color="#1e40af",
    ),
    VideoTheme(
        id="vibrant",
        name="Vibrant & Bold",
        description="High energy, saturated colors, youthful",
        color="#7c3aed",
    ),
    VideoTheme(
        id="dark_moody",
        name="Dark & Moody",
        description="Deep shadows, luxury feel, mysterious",
        color="#1f2937",
    ),
    VideoTheme(
        id="minimalist",
        name="Minimalist",
        description="Clean space, elegant simplicity",
        color="#6b7280",
    ),
    VideoTheme(
        id="nature",
        name="Nature & Fresh",
        description="Organic greens, outdoors, sustainability",
        color="#065f46",
    ),
    VideoTheme(
        id="urban",
        name="Urban Modern",
        description="City energy, concrete aesthetic, contemporary",
        color="#b45309",
    ),
]

PRESET_CHARACTERS = [
    {
        "id": "char_01",
        "name": "Business Pro (M)",
        "description": "Professional male presenter",
        "image": "/assets/characters/char_01.svg",
    },
    {
        "id": "char_02",
        "name": "Business Pro (F)",
        "description": "Professional female presenter",
        "image": "/assets/characters/char_02.svg",
    },
    {
        "id": "char_03",
        "name": "Creative (M)",
        "description": "Casual creative male",
        "image": "/assets/characters/char_03.svg",
    },
    {
        "id": "char_04",
        "name": "Creative (F)",
        "description": "Casual creative female",
        "image": "/assets/characters/char_04.svg",
    },
    {
        "id": "char_05",
        "name": "Tech Enthusiast",
        "description": "Young tech-savvy person",
        "image": "/assets/characters/char_05.svg",
    },
    {
        "id": "char_06",
        "name": "Lifestyle Influencer",
        "description": "Aspirational lifestyle persona",
        "image": "/assets/characters/char_06.svg",
    },
]

PRESET_AUDIO = [
    {
        "id": "audio_01",
        "name": "Upbeat Corporate",
        "description": "Energetic, professional background music",
        "duration": "0:30",
        "bpm": 128,
        "mood": "energetic",
    },
    {
        "id": "audio_02",
        "name": "Cinematic Epic",
        "description": "Orchestral, dramatic buildup",
        "duration": "0:30",
        "bpm": 90,
        "mood": "dramatic",
    },
    {
        "id": "audio_03",
        "name": "Calm Ambient",
        "description": "Peaceful, meditative tones",
        "duration": "0:30",
        "bpm": 70,
        "mood": "calm",
    },
    {
        "id": "audio_04",
        "name": "Energetic Pop",
        "description": "Fun, catchy, modern pop beat",
        "duration": "0:30",
        "bpm": 138,
        "mood": "fun",
    },
    {
        "id": "audio_05",
        "name": "Inspirational",
        "description": "Uplifting, motivational piano",
        "duration": "0:30",
        "bpm": 100,
        "mood": "inspiring",
    },
    {
        "id": "audio_06",
        "name": "Minimal Modern",
        "description": "Clean electronic, contemporary",
        "duration": "0:30",
        "bpm": 110,
        "mood": "modern",
    },
]
