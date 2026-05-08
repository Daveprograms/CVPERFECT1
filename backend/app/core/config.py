"""
Application settings — loaded from environment / backend/.env
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = Field(
        default="",
        description="PostgreSQL URL (required at runtime; validated in database module)",
    )

    JWT_SECRET: str = ""
    GEMINI_API_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    FRONTEND_URL: str = "http://localhost:3000"

    USE_REAL_DATA: bool = True
    MOCK_DATA_ALLOWED: bool = False
    ENABLE_WEB_SCRAPING: bool = True
    ENABLE_AI_FALLBACK: bool = True
    VALIDATE_PRODUCTION_DATA: bool = True

    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "resumes"

    DEVELOPER_CODE: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"
    EMAIL_FROM: str = ""
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""


settings = Settings()
