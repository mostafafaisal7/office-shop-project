# Quick Start: Connect FastAPI to Your Domain

## What You Need First

1. **Your Domain Name** - Which domain will you use?
   - Option A: Subdomain (e.g., `api.yourdomain.com`) ✅ **RECOMMENDED**
   - Option B: Path (e.g., `yourdomain.com/api`)

2. **Database Information** (you already have this)
   - Database Name: `fastapi_ecommerce`
   - Database User: `niloy`
   - Database Password: `niloy940`

3. **Your Vercel Frontend URLs** - What are your deployed URLs?
   - Customer Frontend: `https://your-app.vercel.app`
   - Admin Frontend: `https://your-admin.vercel.app`

---

## 5-Minute Setup (Most Common Method)

### Step 1: Create Subdomain in cPanel

1. Login to cPanel
2. Search for "**Subdomains**"
3. Create subdomain: `api` (full domain will be `api.yourdomain.com`)
4. Document root: Can be any folder (we'll use proxy)

### Step 2: Setup Python Application

1. In cPanel, search for "**Setup Python App**"
2. Click "**Create Application**"
3. Fill in:
   ```
   Python Version: 3.11 (or highest available)
   Application Root: /home/yourusername/fastapi_ecommerce-main
   Application URL: api.yourdomain.com
   Application Startup File: passenger_wsgi.py
   Application Entry Point: application
   ```

### Step 3: Create passenger_wsgi.py

SSH into your cPanel or use File Manager to create this file in `/home/yourusername/fastapi_ecommerce-main/passenger_wsgi.py`:

```python
import sys
import os

# Add application directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import FastAPI application
from app.main import app as application
```

### Step 4: Update .env File

Edit `/home/yourusername/fastapi_ecommerce-main/.env`:

```bash
# IMPORTANT: Update these values!

# Database (keep your existing values)
DATABASE_URL=mysql+aiomysql://niloy:niloy940@localhost:3306/fastapi_ecommerce
SYNC_DATABASE_URL=mysql+pymysql://niloy:niloy940@localhost:3306/fastapi_ecommerce

# ⚠️ CHANGE THESE - Backend URL
BASE_URL=https://api.yourdomain.com

# ⚠️ CHANGE THESE - Frontend URLs (your Vercel deployments)
FRONTEND_URL=https://your-customer-frontend.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-frontend.vercel.app

# ⚠️ CHANGE THIS - CORS (add your Vercel URLs)
ALLOWED_ORIGINS=https://your-customer-frontend.vercel.app,https://your-admin-frontend.vercel.app

# ⚠️ GENERATE NEW SECRET - Run: openssl rand -hex 32
SECRET_KEY=your_super_secret_key_CHANGE_THIS

# Production settings
ENVIRONMENT=production
DEBUG=false

# Keep the rest as is
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3600
REFRESH_TOKEN_EXPIRE_DAYS=7
HOST=0.0.0.0
PORT=8000
SMS_PROVIDER=greenweb
GREENWEB_API_KEY=your_greenweb_api_key
```

### Step 5: Install Dependencies

SSH into cPanel:

```bash
cd ~/fastapi_ecommerce-main

# Activate virtual environment (cPanel creates this automatically)
source /home/yourusername/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "from app.main import app; print('✓ App imported successfully')"
```

### Step 6: Enable SSL Certificate

1. In cPanel, go to "**SSL/TLS Status**"
2. Find `api.yourdomain.com`
3. Click "**Run AutoSSL**"
4. Wait 5-10 minutes for certificate

### Step 7: Restart Python Application

1. Go back to "**Setup Python App**" in cPanel
2. Find your application
3. Click "**Restart**" button
4. Check for errors in logs

### Step 8: Test Your Backend

```bash
# Test if API is accessible
curl https://api.yourdomain.com/docs

# Should return FastAPI documentation page
```

### Step 9: Update Vercel Environment Variables

In your Vercel dashboard:

**Customer Frontend Project:**
1. Go to Settings → Environment Variables
2. Add/Update:
   ```
   NEXT_PUBLIC_API_URL = https://api.yourdomain.com
   API_URL = https://api.yourdomain.com
   ```
3. Redeploy

**Admin Frontend Project:**
1. Go to Settings → Environment Variables
2. Add/Update:
   ```
   NEXT_PUBLIC_API_URL = https://api.yourdomain.com
   API_URL = https://api.yourdomain.com
   ```
3. Redeploy

### Step 10: Test Everything

Visit your Vercel frontend and test:
- ✅ User login
- ✅ Product listing
- ✅ Product images loading
- ✅ Add to cart
- ✅ Checkout flow

---

## If Python App Doesn't Work - Alternative Method

Use Apache reverse proxy instead:

### 1. Start FastAPI Manually

```bash
# SSH into cPanel
cd ~/fastapi_ecommerce-main
source venv/bin/activate

# Use screen to keep it running
screen -S fastapi
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Press Ctrl+A then D to detach
# To reattach later: screen -r fastapi
```

### 2. Create .htaccess in Subdomain Directory

In `/home/yourusername/public_html/api/.htaccess`:

```apache
RewriteEngine On

# Proxy all requests to FastAPI
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:8000/$1 [P,L]

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "*"
Header always set Access-Control-Expose-Headers "Content-Disposition"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

---

## Common Issues & Quick Fixes

### ❌ 500 Internal Server Error

**Fix:**
```bash
# Check logs
cat ~/logs/yourusername.com.error.log

# Or in cPanel Python App, click "View Logs"
```

### ❌ CORS Error in Browser

**Fix:** Add your exact Vercel URL to `.env`:
```bash
ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
```

### ❌ Images Not Loading

**Fix:**
```bash
cd ~/fastapi_ecommerce-main
chmod -R 755 app/static
```

### ❌ Database Connection Error

**Fix:** Verify database credentials:
```bash
# Test database connection
python -c "from app.core.database import database; print('DB connection OK')"
```

---

## Need to Know Your Info?

Run these commands to find out:

```bash
# Your cPanel username
whoami

# Your home directory path
pwd

# Check if Python app is configured
ls -la ~/virtualenv/

# Check current domain
hostname
```

---

## Contact Information Needed

Before you start, please provide:

1. **Your domain name**: _________________
2. **Your cPanel username**: _________________
3. **Your Vercel customer frontend URL**: _________________
4. **Your Vercel admin frontend URL**: _________________

---

## Summary of What Changes

| Location | What Changes | Old Value | New Value |
|----------|--------------|-----------|-----------|
| Backend `.env` | `BASE_URL` | `http://127.0.0.1:8000` | `https://api.yourdomain.com` |
| Backend `.env` | `FRONTEND_URL` | `http://localhost:3000` | Your Vercel URL |
| Backend `.env` | `ALLOWED_ORIGINS` | `localhost:3000` | Your Vercel URLs |
| Frontend Vercel | `NEXT_PUBLIC_API_URL` | - | `https://api.yourdomain.com` |
| Frontend Vercel | `API_URL` | - | `https://api.yourdomain.com` |

---

**Time Required**: 15-30 minutes
**Difficulty**: Medium
**Support**: Check full guide in `CPANEL_FASTAPI_DOMAIN_SETUP.md`
