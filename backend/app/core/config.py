from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Erasmus+ Form Completion"
    
    # OpenAI API
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    # Database
    DATABASE_URL: Optional[str] = "sqlite:///./erasmus_forms.db"
    
    # Redis Cache
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PRICE_ID: str = "price_erasmus_form_99"
    
    # Application
    FORM_PRICE_EUR: int = 99
    MAX_RESPONSE_TIME_SECONDS: int = 120
    CACHE_TTL_SECONDS: int = 3600
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()