from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Erasmus+ Form Completion"

    # OpenAI API
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo"  # Updated model name

    # Database - configured for Render PostgreSQL
    DATABASE_URL: Optional[str] = "sqlite:///./erasmus_forms.db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Application
    FORM_PRICE_EUR: int = 99
    MAX_RESPONSE_TIME_SECONDS: int = 120
    CACHE_TTL_SECONDS: int = 3600
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file

settings = Settings()