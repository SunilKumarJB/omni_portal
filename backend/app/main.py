import os

os.environ["GOOGLE_API_USE_CLIENT_CERTIFICATE"] = "false"

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

try:
    import urllib3.contrib.pyopenssl

    urllib3.contrib.pyopenssl.extract_from_urllib3()
except Exception:
    pass


from app.config import settings
from app.api.routes import generate, videos
from app.services import omni_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    limits = httpx.Limits(
        max_keepalive_connections=settings.HTTP_MAX_KEEPALIVE_CONNECTIONS,
        max_connections=settings.HTTP_MAX_CONNECTIONS,
    )
    client = httpx.AsyncClient(
        limits=limits,
        timeout=settings.HTTP_TIMEOUT_SECONDS,
    )
    app.state.http_client = client
    omni_service.set_http_client(client)
    try:
        yield
    finally:
        await client.aclose()
        app.state.http_client = None
        omni_service.set_http_client(None)


app = FastAPI(
    title="The Omni Portal",
    description="AI-powered video generation on Google Cloud Gemini Enterprise Agent Platform",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.http_client = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api")
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
            "gemini": settings.GEMINI_MODEL,
        },
    }


@app.get("/")
async def root():
    return {"message": "Omni Video Generator API", "docs": "/docs"}
