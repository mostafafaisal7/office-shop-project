# FastAPI Domain Setup Guide for cPanel

## Overview
This guide will help you connect your FastAPI backend (currently on localhost) to a public domain on cPanel.

---

## Prerequisites

- ✅ cPanel hosting account with Python support
- ✅ Domain name (e.g., `api.yourdomain.com` or `yourdomain.com/api`)
- ✅ FastAPI application in `fastapi_ecommerce-main` directory
- ✅ MySQL database already configured on cPanel
- ✅ SSH/Terminal access to cPanel (recommended)

---

## Method 1: Using Python App in cPanel (Recommended)

### Step 1: Access cPanel Python App Manager

1. Log into your cPanel
2. Search for "Setup Python App" or "Python Apps"
3. Click "Create Application"

### Step 2: Configure Python Application

Fill in the following details:

```
Python Version: 3.11 or higher
Application Root: fastapi_ecommerce-main
Application URL: api.yourdomain.com (or yourdomain.com/api)
Application Startup File: app/main.py
Application Entry Point: app
```

**Note:** The entry point format depends on your cPanel configuration. Try:
- `app` (if using Passenger)
- `app:app` (standard ASGI)

### Step 3: Configure Environment Variables

In the Python App interface, add these environment variables:

```bash
# Database
DATABASE_URL=mysql+aiomysql://your_db_user:your_db_pass@localhost:3306/your_db_name
SYNC_DATABASE_URL=mysql+pymysql://your_db_user:your_db_pass@localhost:3306/your_db_name

# Application URLs
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://your-vercel-app.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-vercel-app.vercel.app

# CORS Configuration
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-admin-vercel-app.vercel.app,https://yourdomain.com

# JWT Security
SECRET_KEY=<generate_with_openssl_rand_-hex_32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3600
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=false

# SMS Provider (if using)
SMS_PROVIDER=greenweb
GREENWEB_API_KEY=your_actual_api_key
GREENWEB_URL=http://api.greenweb.com.bd/api.php
```

### Step 4: Install Dependencies

SSH into your cPanel and run:

```bash
cd ~/fastapi_ecommerce-main
source /home/yourusername/virtualenv/fastapi_ecommerce-main/3.11/bin/activate
pip install -r requirements.txt
```

### Step 5: Create Passenger WSGI File

Create `passenger_wsgi.py` in your application root:

```python
import sys
import os

# Add your application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import FastAPI app
from app.main import app as application

# Passenger expects 'application' to be the ASGI app
```

### Step 6: Restart the Application

In cPanel Python App Manager:
1. Click "Restart" button
2. Wait for the application to start
3. Check the logs for any errors

---

## Method 2: Using .htaccess Proxy (Alternative)

If Method 1 doesn't work, use Apache proxy:

### Step 1: Run FastAPI as a Service

Create a systemd service file or use screen/tmux:

```bash
# Using screen (simple approach)
screen -S fastapi
cd ~/fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
# Press Ctrl+A then D to detach
```

### Step 2: Create .htaccess Proxy

In your public_html (or subdomain directory):

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:8000/$1 [P,L]

# Enable CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

---

## Method 3: Using Subdomain with Reverse Proxy

### Step 1: Create Subdomain

In cPanel:
1. Go to "Subdomains"
2. Create subdomain: `api.yourdomain.com`
3. Point it to a directory (e.g., `public_html/api`)

### Step 2: Configure Reverse Proxy

Add this `.htaccess` in the subdomain directory:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:8000/$1 [P,L]

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "*"

# Handle OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

---

## Step 7: Update Frontend Configuration

### Update Vercel Environment Variables

In your Vercel project settings, add:

```bash
# For Customer Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com

# For Admin Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com
```

### Update Local Development

Update both frontend `.env.local` files:

```bash
# .env.local (both frontends)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com
```

---

## Step 8: Update Backend CORS

Your backend `.env` file should already be configured (you did this in Step 3), but double-check:

```bash
ALLOWED_ORIGINS=https://your-customer-frontend.vercel.app,https://your-admin-frontend.vercel.app
```

---

## Step 9: SSL Certificate

### Enable SSL in cPanel

1. Go to "SSL/TLS Status" in cPanel
2. Enable AutoSSL for your domain/subdomain
3. Wait for certificate to be issued (usually 5-10 minutes)

### Force HTTPS

Add to your `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Testing Your Setup

### 1. Test Backend Health

```bash
curl https://api.yourdomain.com/docs
# Should return FastAPI documentation
```

### 2. Test CORS

```bash
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.yourdomain.com/auth/login
```

### 3. Test API Endpoint

```bash
curl https://api.yourdomain.com/products/
# Should return products list
```

### 4. Test from Frontend

Deploy your frontend to Vercel and test:
- User login
- Product listing
- Cart operations
- Image loading

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Check:**
1. Python app logs in cPanel
2. Error logs in cPanel File Manager
3. Database connection in `.env`

**Solution:**
```bash
# SSH into cPanel
cd ~/fastapi_ecommerce-main
source venv/bin/activate
python -c "from app.core.database import database; print('DB OK')"
```

### Issue: CORS Errors

**Check:**
1. `ALLOWED_ORIGINS` includes your Vercel domain
2. No trailing slashes in URLs
3. HTTPS vs HTTP mismatch

**Solution:**
Update `.env`:
```bash
ALLOWED_ORIGINS=https://customer.vercel.app,https://admin.vercel.app
```

### Issue: Images Not Loading

**Check:**
1. Static files directory exists
2. Correct permissions (755 for directories, 644 for files)

**Solution:**
```bash
cd ~/fastapi_ecommerce-main
chmod -R 755 app/static
chmod -R 644 app/static/**/*.*
```

### Issue: Database Connection Failed

**Check:**
1. Database credentials in `.env`
2. Database exists in cPanel MySQL
3. User has permissions

**Solution:**
1. Go to cPanel > MySQL Databases
2. Verify database name and user
3. Add user to database if needed

### Issue: Application Not Starting

**Check logs:**
```bash
# In cPanel Python App Manager, click "View Logs"
# Or via SSH:
tail -f ~/logs/stderr.log
tail -f ~/logs/access.log
```

---

## Performance Optimization

### 1. Enable Production Mode

```bash
# .env
ENVIRONMENT=production
DEBUG=false
```

### 2. Use Production Server

Instead of uvicorn directly, use Gunicorn:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Enable Caching

Add to your FastAPI app:

```python
# app/main.py
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
# Configure as needed
```

### 4. Database Connection Pooling

Already configured in your `database.py` file.

---

## Security Checklist

- [ ] Change `SECRET_KEY` in production (use `openssl rand -hex 32`)
- [ ] Set `DEBUG=false` in production
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure firewall to block direct port 8000 access
- [ ] Set restrictive CORS origins (no wildcards)
- [ ] Keep dependencies updated: `pip install -U -r requirements.txt`
- [ ] Regular database backups via cPanel
- [ ] Monitor error logs regularly

---

## Quick Commands Reference

```bash
# Activate virtual environment
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server manually (testing)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check Python app status
# Use cPanel Python App Manager interface

# View logs
tail -f ~/logs/stderr.log

# Restart application
# Use cPanel Python App Manager "Restart" button
```

---

## Next Steps

1. ✅ Configure Python app in cPanel
2. ✅ Set environment variables
3. ✅ Install dependencies
4. ✅ Enable SSL certificate
5. ✅ Update frontend environment variables
6. ✅ Test all endpoints
7. ✅ Deploy frontends to Vercel
8. ✅ Monitor logs and fix any issues

---

## Support Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **cPanel Docs**: Your hosting provider's documentation
- **Python ASGI**: https://asgi.readthedocs.io/

---

**Created**: November 2, 2024
**For**: Office Shop E-commerce Project
**Backend**: FastAPI + MySQL on cPanel
**Frontend**: Next.js on Vercel
