from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"
    GCS_BUCKET_NAME: str = "omni-video-demo"

    GEMINI_PRO_MODEL: str = "gemini-2.5-pro"
    GEMINI_FLASH_MODEL: str = "gemini-2.0-flash"
    VEO_MODEL: str = "veo-3.0-generate-preview"

    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    TEST_MODE: bool = False
    STORAGE_BACKEND: str = "local"   # "gcs" or "local"
    DB_BACKEND: str = "local"        # "firestore" or "local"
    LOCAL_STORAGE_PATH: str = "./storage"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
