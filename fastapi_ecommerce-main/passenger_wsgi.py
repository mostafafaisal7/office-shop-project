#!/usr/bin/env python3
"""
Passenger WSGI file for FastAPI application
This file is used by cPanel Python App to run the FastAPI application
"""

import sys
import os

# Get the virtual environment Python interpreter
INTERP = os.path.join(os.environ['HOME'], 'virtualenv', 'fastapi_ecommerce-main', '3.11', 'bin', 'python3')

# Activate virtual environment if not already activated
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add application directory to Python path
app_dir = os.path.dirname(__file__)
sys.path.insert(0, app_dir)

# Log for debugging
print(f"Python Version: {sys.version}", file=sys.stderr)
print(f"Python Executable: {sys.executable}", file=sys.stderr)
print(f"Application Directory: {app_dir}", file=sys.stderr)
print(f"Python Path: {sys.path}", file=sys.stderr)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = os.path.join(app_dir, '.env')
    load_dotenv(env_path)
    print(f"✓ Loaded environment from: {env_path}", file=sys.stderr)
except ImportError as e:
    print(f"⚠ Warning: python-dotenv not installed: {e}", file=sys.stderr)
    print("  Install with: pip install python-dotenv", file=sys.stderr)
except Exception as e:
    print(f"⚠ Warning: Could not load .env file: {e}", file=sys.stderr)

# Verify critical environment variables
required_vars = ['DATABASE_URL', 'SECRET_KEY']
for var in required_vars:
    value = os.getenv(var)
    if not value:
        print(f"✗ ERROR: {var} not set in environment", file=sys.stderr)
    else:
        # Mask sensitive values in logs
        masked_value = value[:10] + '...' if len(value) > 10 else '***'
        print(f"✓ {var}: {masked_value}", file=sys.stderr)

# Import and configure the FastAPI application
try:
    print("Importing FastAPI application...", file=sys.stderr)
    from app.main import app as application
    print("✓ FastAPI application loaded successfully!", file=sys.stderr)

    # Log application info
    print(f"Application title: {application.title}", file=sys.stderr)
    print(f"Available routes: {len(application.routes)}", file=sys.stderr)

except ImportError as e:
    print(f"✗ Import Error: {e}", file=sys.stderr)
    print(f"Make sure 'app' directory exists and contains __init__.py", file=sys.stderr)
    print(f"Current directory: {os.getcwd()}", file=sys.stderr)
    print(f"App directory contents: {os.listdir(app_dir)}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise

except Exception as e:
    print(f"✗ Error loading FastAPI application: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise

# Test database connection at startup
try:
    print("Testing database connection...", file=sys.stderr)
    from app.core.database import database
    print("✓ Database module imported successfully", file=sys.stderr)
except Exception as e:
    print(f"⚠ Warning: Database import failed: {e}", file=sys.stderr)
    print("  The app will start but database operations may fail", file=sys.stderr)

print("=" * 60, file=sys.stderr)
print("FastAPI Application Started Successfully", file=sys.stderr)
print("=" * 60, file=sys.stderr)

# The 'application' variable is what Passenger looks for
# It should be an ASGI application (FastAPI app)
