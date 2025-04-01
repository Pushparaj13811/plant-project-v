import os
import secrets
from typing import List, Optional, Union, Any

from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 1  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # Project info
    PROJECT_NAME: str = "Plant Data Management API"
    PROJECT_DESCRIPTION: str = "API for managing plant data and formula variables"
    PROJECT_VERSION: str = "0.1.0"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost:5173"
    
    # Database settings
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_USE_SSL: bool = False
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    
    # Email settings
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    EMAILS_USE_TLS: bool = True
    
    # External APIs
    GROQ_API_KEY: Optional[str] = None
    
    # Frontend URL for links in emails
    FRONTEND_URL: str = "http://localhost:5173"
    
    @field_validator("BACKEND_CORS_ORIGINS")
    def validate_cors_origins(cls, v: str) -> List[str]:
        # First try comma-separated format
        if "," in v:
            return [i.strip() for i in v.split(",")]
        # If no comma, treat as single origin
        return [v.strip()]
    
    @model_validator(mode='after')
    def validate_settings(self) -> 'Settings':
        # Set database URI if not provided
        if not self.SQLALCHEMY_DATABASE_URI:
            if all([self.DB_USER, self.DB_PASSWORD, self.DB_HOST, self.DB_PORT, self.DB_NAME]):
                # PostgreSQL connection
                ssl_args = "?sslmode=require" if self.DB_USE_SSL else ""
                self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}{ssl_args}"
            else:
                # Default to SQLite database
                self.SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.abspath('')}/app.db"
        
        # Debug based on environment
        if self.ENVIRONMENT != "development":
            self.DEBUG = False
        
        return self
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()  # type: ignore 