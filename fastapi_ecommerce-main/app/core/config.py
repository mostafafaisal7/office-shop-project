import os
from dotenv import load_dotenv

load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_URL = os.environ["DATABASE_URL"]

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment")

# Base URL for internal service calls
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")

# Frontend URL for email verification links
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
