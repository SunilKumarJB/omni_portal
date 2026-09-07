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
    # Service account used to sign v4 URLs through the IAM API when the running
    # credentials have no email of their own (local user ADC). The caller needs
    # roles/iam.serviceAccountTokenCreator on it; the account needs objectViewer.
    GCS_SIGNING_SERVICE_ACCOUNT: str = ""
    FIRESTORE_DATABASE_ID: str = ""

    # Omni / Gemini (Gemini Enterprise Agent Platform / Interactions API) settings
    GEMINI_MODEL: str = "gemini-omni-1.1-flash-preview"
    REGION: str = "global"  # global (default)
    OMNI_PROJECT_ID: str = ""  # defaults to GCP_PROJECT_ID when empty
    GEMINI_API_KEY: str = ""  # Optional API key override (if not using ADC)
    OMNI_ENDPOINT_URL: str = ""  # Optional custom endpoint URL template
    OMNI_MAX_WAIT_SECONDS: int = 600
    OMNI_POLL_INTERVAL_SECONDS: float = 3.0
    # A pending/processing record whose updated_at is older than this is considered
    # stalled: progress ticks refresh updated_at on every poll.
    OMNI_STALE_SECONDS: int = 90
    OMNI_DEFAULT_DURATION: int = 10
    OMNI_DEFAULT_ASPECT_RATIO: str = "16:9"

    # HTTP client / connection pooling settings
    HTTP_MAX_KEEPALIVE_CONNECTIONS: int = 50
    HTTP_MAX_CONNECTIONS: int = 200
    HTTP_TIMEOUT_SECONDS: float = 60.0

    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    TEST_MODE: bool = False
    STORAGE_BACKEND: str = "local"  # "gcs" or "local"
    DB_BACKEND: str = "local"  # "firestore" or "local"
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    LOCAL_STORAGE_PATH: str = str(Path(__file__).resolve().parent.parent / "storage")

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    LOG_LEVEL: str = "INFO"
    # When set, gates POST /api/generate* behind header X-Demo-Key. Empty disables gating.
    DEMO_API_KEY: str = ""

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
