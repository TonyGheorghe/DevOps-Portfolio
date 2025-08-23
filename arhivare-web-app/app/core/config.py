# app/core/config.py - FIXED VERSION
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Arhivare Web App"
    
    # Database Configuration
    DATABASE_URL: str
    
    # JWT Configuration  
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Admin Bootstrap
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    # Optional SQLAlchemy Pool Settings (from your .env)
    sqlalchemy_pool_size: Optional[int] = None
    sqlalchemy_max_overflow: Optional[int] = None
    sqlalchemy_pool_recycle: Optional[int] = None
    sqlalchemy_pool_pre_ping: Optional[bool] = None

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False
        # IMPORTANT: Allow extra fields to prevent validation errors
        extra = "allow"


# Create settings instance
settings = Settings()
