"""
E-Commerce Application Settings
Centralized configuration for the e-commerce backend
"""
import os
from pathlib import Path
from typing import List, Optional
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All e-commerce related configuration in one place.
    """

    # ========================
    # Application Settings
    # ========================
    APP_NAME: str = "E-Commerce Catalogue API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = Field(default=True, description="Enable debug mode")

    # Base paths
    PROJECT_PATH: str = str(Path(__file__).resolve().parent.parent)

    # ========================
    # Server Settings
    # ========================
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")

    # ========================
    # CORS Settings
    # ========================
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ========================
    # Database Settings
    # ========================
    DATABASE_URL: Optional[str] = Field(default=None, description="Database URL (for PostgreSQL)")
    SQLITE_DATABASE_PATH: str = Field(
        default="database/ecommerce.db",
        description="SQLite database path (relative to app directory)"
    )

    # ========================
    # Supabase Auth Settings
    # ========================
    # ⚠️ IMPORTANT: In production, set these via environment variables, NOT in code!
    # These defaults are for development only.
    SUPABASE_URL: str = Field(
        default="https://ucdlzbjcdhicoxxkxknf.supabase.co",
        description="Supabase project URL"
    )
    SUPABASE_ANON_KEY: str = Field(
        default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZGx6YmpjZGhpY294eGt4a25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjcwNDEsImV4cCI6MjA4MjA0MzA0MX0.KxQVa8dtqROwxMcKpg3VVM2iiKQ9Xpt6kcfFLFD3jFw",
        description="Supabase anonymous/public key"
    )
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZGx6YmpjZGhpY294eGt4a25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2NzA0MSwiZXhwIjoyMDgyMDQzMDQxfQ.C3h5_G0al65p6iQW6y_3M4WvnciiFi0nyOc42uSx-HU",
        description="Supabase service role key (for admin operations)"
    )

    # ========================
    # OTP Settings - Day 2 Feature
    # ========================
    # OTP_EXPIRY_SECONDS: int = Field(default=300, description="OTP validity in seconds")
    # OTP_MAX_ATTEMPTS: int = Field(default=3, description="Maximum OTP verification attempts")

    # ========================
    # WhatsApp Business API - Day 2 Feature (OTP delivery)
    # Currently only used for Buy Intent redirect
    # ========================
    # WHATSAPP_API_KEY: Optional[str] = Field(default=None, description="WhatsApp Business API key")
    # WHATSAPP_SENDER_ID: Optional[str] = Field(default=None, description="WhatsApp sender ID")
    WHATSAPP_BUSINESS_PHONE: str = Field(
        default="919999999999",
        description="WhatsApp business phone number for buy intent"
    )

    # ========================
    # Instagram Settings
    # ========================
    INSTAGRAM_USERNAME: str = Field(
        default="your_store",
        description="Instagram username for DM redirects"
    )

    # ========================
    # Cloudinary Settings
    # ========================
    CLOUDINARY_CLOUD_NAME: str = Field(default="dhbtdabnd", description="Cloudinary cloud name")
    CLOUDINARY_API_KEY: str = Field(default="419727785166179", description="Cloudinary API key")
    CLOUDINARY_API_SECRET: str = Field(default="S4rLydBrPAeo3vSyB1naARFRQ8I", description="Cloudinary API secret")

    # ========================
    # Media Upload Settings
    # ========================
    MAX_IMAGE_SIZE_MB: int = Field(default=10, description="Maximum image upload size in MB")
    MAX_VIDEO_SIZE_MB: int = Field(default=100, description="Maximum video upload size in MB")
    ALLOWED_IMAGE_TYPES: List[str] = Field(
        default=["image/jpeg", "image/png", "image/gif", "image/webp"],
        description="Allowed image MIME types"
    )
    ALLOWED_VIDEO_TYPES: List[str] = Field(
        default=["video/mp4", "video/quicktime", "video/webm"],
        description="Allowed video MIME types"
    )

    # ========================
    # Rate Limiting
    # ========================
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="Max requests per window")
    RATE_LIMIT_WINDOW: int = Field(default=60, description="Rate limit window in seconds")

    # ========================
    # Security Settings
    # ========================
    AUTH_SECURITY: str = Field(default="false", description="Enable auth security")
    API_KEY_HEADER: str = Field(default="X-API-Key", description="API key header name")

    # ========================
    # Store Settings
    # ========================
    STORE_NAME: str = Field(default="My Footwear Store", description="Store name")
    STORE_CURRENCY: str = Field(default="INR", description="Store currency")
    STORE_CURRENCY_SYMBOL: str = Field(default="₹", description="Currency symbol")
    PRICE_UNIT: str = Field(default="rupees", description="Currency unit (rupees for INR)")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT.lower() == "production"

    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT.lower() == "development"

    def get_database_url(self) -> str:
        """Get the database URL based on configuration"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"sqlite:///{self.PROJECT_PATH}/{self.SQLITE_DATABASE_PATH}"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Use this function to get settings throughout the application.
    """
    return Settings()


# Create a global settings instance for backward compatibility
settings = get_settings()
