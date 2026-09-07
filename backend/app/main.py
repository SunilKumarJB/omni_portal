import os

os.environ["GOOGLE_API_USE_CLIENT_CERTIFICATE"] = "false"

import asyncio
import hmac
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.datastructures import Headers
import httpx

try:
    import urllib3.contrib.pyopenssl

    urllib3.contrib.pyopenssl.extract_from_urllib3()
except Exception:
    pass


from app.config import settings
from app.api.routes import generate, videos
from app.services import db_service, omni_service, storage_service

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def _warmup() -> None:
    """Best-effort pre-warm of the OAuth token and backend client handles so the
    first real request doesn't pay for ADC/client setup. Never fails startup."""
    try:
        await omni_service._get_cached_token()
        if settings.STORAGE_BACKEND == "gcs":
            await asyncio.to_thread(storage_service._get_bucket)
        if settings.DB_BACKEND == "firestore":
            await asyncio.to_thread(db_service._get_firestore)
    except Exception as exc:
        logger.warning("Startup warm-up failed (%s); continuing without pre-warmed clients.", exc)


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
    if not settings.TEST_MODE:
        await _warmup()
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


class DemoKeyMiddleware:
    """Pure-ASGI gate on POST /api/generate*, so it never touches the GET routes
    the SSE EventSource and QR-scanning phones rely on (neither can send custom
    headers). No-op when DEMO_API_KEY is unset. Added before CORSMiddleware so
    CORS stays the outermost layer and a 401 still carries CORS headers."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] == "http"
            and settings.DEMO_API_KEY
            and scope["method"] == "POST"
            and scope["path"].startswith("/api/generate")
        ):
            provided = Headers(scope=scope).get("x-demo-key", "")
            if not hmac.compare_digest(provided.encode(), settings.DEMO_API_KEY.encode()):
                response = JSONResponse(
                    status_code=401, content={"detail": "Missing or invalid demo key"}
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


app.add_middleware(DemoKeyMiddleware)

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


async def _timed_check(coro) -> dict:
    start = time.monotonic()
    try:
        await coro
        return {"ok": True, "ms": int((time.monotonic() - start) * 1000), "error": None}
    except Exception as exc:
        return {"ok": False, "ms": int((time.monotonic() - start) * 1000), "error": str(exc)}


async def _check_gcs() -> dict:
    if settings.STORAGE_BACKEND != "gcs":
        return {"ok": True, "skipped": True}

    async def _probe():
        bucket = storage_service._get_bucket()
        await asyncio.to_thread(bucket.exists)

    return await _timed_check(_probe())


async def _check_firestore() -> dict:
    if settings.DB_BACKEND != "firestore":
        return {"ok": True, "skipped": True}

    async def _probe():
        db = db_service._get_firestore()
        await db.collection("video_requests").document("_healthcheck").get()

    return await _timed_check(_probe())


@app.get("/health/deep")
async def health_deep():
    if settings.TEST_MODE:
        skipped = {"ok": True, "skipped": True}
        checks = {"token": skipped, "gcs": skipped, "firestore": skipped}
    else:
        checks = {
            "token": await _timed_check(omni_service._get_cached_token()),
            "gcs": await _check_gcs(),
            "firestore": await _check_firestore(),
        }

    status = "ok" if all(c.get("ok") for c in checks.values()) else "degraded"
    return JSONResponse(
        status_code=200 if status == "ok" else 503,
        content={"status": status, "checks": checks},
    )


@app.get("/")
async def root():
    return {"message": "Omni Video Generator API", "docs": "/docs"}
