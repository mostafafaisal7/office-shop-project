import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment")

# Sync database URL for Alembic migrations
SYNC_DATABASE_URL = os.getenv("SYNC_DATABASE_URL")
if not SYNC_DATABASE_URL:
    # Fallback: try to convert async URL to sync URL
    if DATABASE_URL:
        SYNC_DATABASE_URL = DATABASE_URL.replace("mysql+aiomysql://", "mysql+pymysql://")

# ============================================
# APPLICATION URLS
# ============================================
# Base URL for internal service calls and API responses
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")

# Frontend URLs for email verification links and redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ADMIN_FRONTEND_URL = os.getenv("ADMIN_FRONTEND_URL", "http://localhost:3000")

# ============================================
# CORS CONFIGURATION
# ============================================
# Parse comma-separated allowed origins
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS: List[str] = [
    origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()
]

# ============================================
# JWT AUTHENTICATION
# ============================================
SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_key")
if SECRET_KEY == "your_super_secret_key" and os.getenv("ENVIRONMENT") == "production":
    raise ValueError("SECRET_KEY must be changed in production environment")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "3600"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ============================================
# FILE STORAGE
# ============================================
STATIC_DIR = os.getenv("STATIC_DIR", "app/static")
STATIC_URL_PATH = os.getenv("STATIC_URL_PATH", "/images")

# ============================================
# SMS PROVIDER CONFIGURATION
# ============================================
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "greenweb")
GREENWEB_API_KEY = os.getenv("GREENWEB_API_KEY")
GREENWEB_URL = os.getenv("GREENWEB_URL", "http://api.greenweb.com.bd/api.php")

# ============================================
# API KEYS
# ============================================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# ============================================
# SERVER CONFIGURATION
# ============================================
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
