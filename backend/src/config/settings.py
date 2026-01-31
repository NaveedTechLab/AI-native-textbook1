from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import ValidationError, field_validator
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Database settings
    neon_db_url: str

    # Qdrant settings
    qdrant_url: str
    qdrant_api_key: Optional[str] = None

    # Gemini API settings
    gemini_api_key: str

    # JWT settings
    secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expires_in: int = 3600  # 1 hour default

    # OAuth settings (optional - for Google/Facebook login)
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    facebook_app_id: Optional[str] = None
    facebook_app_secret: Optional[str] = None

    # Application settings
    debug: bool = False
    log_level: str = "info"

    # Server settings
    server_host: str = "0.0.0.0"
    server_port: int = 8000

    @field_validator('neon_db_url', 'qdrant_url', 'gemini_api_key', 'secret_key')
    @classmethod
    def validate_required_fields(cls, v, info):
        if not v:
            raise ValueError(f"{info.field_name} is required and must be set in environment variables")
        return v

    @field_validator('debug')
    @classmethod
    def validate_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ['true', '1', 'yes', 'on']
        return bool(v)

    @field_validator('jwt_expires_in')
    @classmethod
    def validate_jwt_expires_in(cls, v):
        if v <= 0:
            raise ValueError("JWT expires in must be a positive integer")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True


# Create a single instance of settings with error handling
try:
    settings = Settings()
    logger.info("Configuration loaded successfully")
except ValidationError as e:
    logger.error(f"Configuration validation error: {e}")
    raise
except Exception as e:
    logger.error(f"Configuration error: {e}")
    raise