import os

os.environ["GOOGLE_API_USE_CLIENT_CERTIFICATE"] = "false"

try:
    import urllib3.contrib.pyopenssl

    urllib3.contrib.pyopenssl.extract_from_urllib3()
except Exception:
    pass

from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"
    GCS_BUCKET_NAME: str = "your-gcs-bucket-name"
    FIRESTORE_DATABASE_ID: str = "omni-portal-demo-store"

    # Omni (Vertex AI / Interactions API) settings
    OMNI_MODEL: str = "gemini-omni-flash-preview"
    OMNI_ENVIRONMENT: str = "prod"  # prod
    OMNI_REGION: str = "us-central1"  # us-central1 | global
    OMNI_PROJECT_ID: str = ""  # defaults to GCP_PROJECT_ID when empty
    OMNI_API_KEY: str = ""  # Optional API key override (if not using ADC)
    OMNI_ENDPOINT_URL: str = ""  # Optional custom endpoint URL template
    OMNI_MAX_WAIT_SECONDS: int = 600
    OMNI_DEFAULT_DURATION: int = 10
    OMNI_DEFAULT_ASPECT_RATIO: str = "16:9"

    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    TEST_MODE: bool = False
    STORAGE_BACKEND: str = "local"  # "gcs" or "local"
    DB_BACKEND: str = "local"  # "firestore" or "local"
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    LOCAL_STORAGE_PATH: str = str(Path(__file__).resolve().parent.parent / "storage")

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
