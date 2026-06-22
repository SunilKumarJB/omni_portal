from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.api.routes import generate, assets, videos

app = FastAPI(
    title="The Omni Portal",
    description="AI-powered video generation using Omni and Nano Banana",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(videos.router, prefix="/api")

# Serve local storage files
storage_dir = Path(settings.LOCAL_STORAGE_PATH)
storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "test_mode": settings.TEST_MODE,
        "storage_backend": settings.STORAGE_BACKEND,
        "db_backend": settings.DB_BACKEND,
        "models": {
            "gemini_pro": settings.GEMINI_PRO_MODEL,
            "gemini_flash": settings.GEMINI_FLASH_MODEL,
            "veo": settings.VEO_MODEL,
        },
    }


@app.get("/")
async def root():
    return {"message": "Omni Video Generator API", "docs": "/docs"}
