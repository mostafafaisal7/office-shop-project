# cPanel Deployment Guide for Office Shop E-commerce

This guide will walk you through deploying your Office Shop e-commerce application to Namecheap cPanel for production use.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Database Setup](#step-1-database-setup)
4. [Step 2: Backend (FastAPI) Deployment](#step-2-backend-fastapi-deployment)
5. [Step 3: Frontend Deployment](#step-3-frontend-deployment)
6. [Step 4: Environment Configuration](#step-4-environment-configuration)
7. [Step 5: Running the Application](#step-5-running-the-application)
8. [Switching Between Development and Production](#switching-between-development-and-production)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Namecheap cPanel hosting account with:
  - Python support (version 3.9+)
  - Node.js support (version 18+)
  - MySQL database
  - SSH access (recommended)
- Domain name pointed to your cPanel server
- FTP/SFTP client (FileZilla, WinSCP, etc.) or Git access

## Architecture Overview

Your application consists of three parts:

1. **Backend (FastAPI)**: Python API server running on port 8000
2. **Customer Frontend (Next.js)**: Customer-facing storefront
3. **Admin Frontend (Next.js)**: Admin dashboard for managing the store

## Step 1: Database Setup

### 1.1 Create MySQL Database

1. Log into your cPanel
2. Navigate to **MySQL® Databases**
3. Create a new database:
   - Database Name: `your_db_name` (e.g., `office_shop_db`)
   - Click **Create Database**

### 1.2 Create Database User

1. In the same section, create a new MySQL user:
   - Username: `your_db_user`
   - Password: **Generate a strong password**
   - Click **Create User**

### 1.3 Add User to Database

1. Under **Add User To Database**:
   - Select your user
   - Select your database
   - Click **Add**
2. Grant **ALL PRIVILEGES** to the user

### 1.4 Note Your Database Credentials

```
Host: localhost (or specific hostname from cPanel)
Port: 3306
Database: your_db_name
Username: your_db_user
Password: your_strong_password
```

## Step 2: Backend (FastAPI) Deployment

### 2.1 Upload Backend Files

Upload the `fastapi_ecommerce-main` directory to your cPanel:

```bash
# Via SSH
cd ~/public_html  # or your desired directory
git clone your-repository-url
# or upload via FTP
```

### 2.2 Set Up Python Virtual Environment

```bash
cd ~/public_html/fastapi_ecommerce-main

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.3 Configure Environment Variables

```bash
cd ~/public_html/fastapi_ecommerce-main

# Copy the production example
cp .env.production.example .env

# Edit the .env file
nano .env  # or use vi, or edit via File Manager in cPanel
```

Update the following values in `.env`:

```bash
# Database Configuration
DATABASE_URL=mysql+aiomysql://your_db_user:your_strong_password@localhost:3306/your_db_name
SYNC_DATABASE_URL=mysql+pymysql://your_db_user:your_strong_password@localhost:3306/your_db_name

# Application URLs
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# JWT Secret - IMPORTANT: Generate a secure key!
# Run: openssl rand -hex 32
SECRET_KEY=your_generated_secret_key_here

# Environment
ENVIRONMENT=production
DEBUG=false
```

### 2.4 Run Database Migrations

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
alembic upgrade head
```

### 2.5 Create Startup Script

Create a file `start_backend.sh`:

```bash
#!/bin/bash
cd ~/public_html/fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Make it executable:

```bash
chmod +x start_backend.sh
```

### 2.6 Set Up Process Manager

**Option A: Using cPanel Application Manager (if available)**

1. Go to cPanel → **Setup Python App**
2. Create a new application:
   - Python version: 3.9+
   - Application root: `/home/username/public_html/fastapi_ecommerce-main`
   - Application URL: Your domain
   - Application startup file: `app/main.py`

**Option B: Using Passenger (if available)**

Create `passenger_wsgi.py` in the backend root:

```python
import sys
import os

# Add your application to the path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app as application
```

**Option C: Using systemd (via SSH with sudo access)**

Create `/etc/systemd/system/office-shop-backend.service`:

```ini
[Unit]
Description=Office Shop FastAPI Backend
After=network.target

[Service]
User=your_cpanel_username
WorkingDirectory=/home/your_cpanel_username/public_html/fastapi_ecommerce-main
ExecStart=/home/your_cpanel_username/public_html/fastapi_ecommerce-main/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable office-shop-backend
sudo systemctl start office-shop-backend
```

**Option D: Using Screen (simple method)**

```bash
# Start a screen session
screen -S backend

# Run the backend
./start_backend.sh

# Detach with Ctrl+A, then D
```

## Step 3: Frontend Deployment

### 3.1 Build Customer Frontend

```bash
cd ~/public_html/frontend/customized_product_ecommerce-main

# Copy production environment
cp .env.production.example .env.production

# Edit .env.production
nano .env.production
```

Update `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com
API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,images.unsplash.com
NODE_ENV=production
```

Install and build:

```bash
# Install Node.js dependencies
npm install

# Build for production
npm run build
```

### 3.2 Build Admin Frontend

```bash
cd ~/public_html/frontend/admin-ecommerce-cp-main

# Copy production environment
cp .env.production.example .env.production

# Edit .env.production
nano .env.production
```

Update `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com
API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=https://admin.yourdomain.com
NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,cdn.tiny.cloud
NEXT_PUBLIC_BACKEND_URLS=https://yourdomain.com
NODE_ENV=production
```

Install and build:

```bash
npm install
npm run build
```

### 3.3 Set Up Frontend Startup Scripts

**Customer Frontend:**

Create `start_customer_frontend.sh`:

```bash
#!/bin/bash
cd ~/public_html/frontend/customized_product_ecommerce-main
npm run start
```

**Admin Frontend:**

Create `start_admin_frontend.sh`:

```bash
#!/bin/bash
cd ~/public_html/frontend/admin-ecommerce-cp-main
PORT=3001 npm run start
```

Make them executable:

```bash
chmod +x start_customer_frontend.sh
chmod +x start_admin_frontend.sh
```

### 3.4 Configure Nginx/Apache Reverse Proxy

**For Apache (.htaccess method):**

Create `.htaccess` in your public_html root:

```apache
# Backend API
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:8000/$1 [P,L]

# Customer Frontend (port 3000)
RewriteCond %{HTTP_HOST} ^(www\.)?yourdomain\.com$
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Admin Frontend (port 3001)
RewriteCond %{HTTP_HOST} ^admin\.yourdomain\.com$
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

**For Nginx (if you have access):**

```nginx
# Backend
location /api {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Customer Frontend
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Admin Frontend (on admin subdomain)
server {
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 4: Environment Configuration

### Quick Configuration Summary

**To use in DEVELOPMENT:**

1. Backend: Use `.env` file with development values
2. Customer Frontend: Use `.env.local`
3. Admin Frontend: Use `.env.local`

**To use in PRODUCTION:**

1. Backend: Use `.env` file with production values
2. Customer Frontend: Use `.env.production`
3. Admin Frontend: Use `.env.production`

### Changing from Development to Production

**Backend:**

```bash
# Edit .env file and change these values:
ENVIRONMENT=production
DEBUG=false
BASE_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Frontends:**

```bash
# Build with production environment
npm run build

# Or ensure .env.production exists and run
NODE_ENV=production npm run build
```

## Step 5: Running the Application

### Start All Services

```bash
# Terminal 1: Start Backend
cd ~/public_html/fastapi_ecommerce-main
./start_backend.sh

# Terminal 2: Start Customer Frontend
cd ~/public_html/frontend/customized_product_ecommerce-main
./start_customer_frontend.sh

# Terminal 3: Start Admin Frontend
cd ~/public_html/frontend/admin-ecommerce-cp-main
./start_admin_frontend.sh
```

### Using Screen for Multiple Processes

```bash
# Backend
screen -S backend
./start_backend.sh
# Ctrl+A, D to detach

# Customer Frontend
screen -S customer
./start_customer_frontend.sh
# Ctrl+A, D to detach

# Admin Frontend
screen -S admin
./start_admin_frontend.sh
# Ctrl+A, D to detach

# List screens
screen -ls

# Reattach to a screen
screen -r backend
```

## Switching Between Development and Production

### Quick Switch Guide

**Switch to PRODUCTION:**

```bash
# 1. Backend - Edit .env
nano fastapi_ecommerce-main/.env
# Set: ENVIRONMENT=production, DEBUG=false, Update URLs

# 2. Customer Frontend
cd frontend/customized_product_ecommerce-main
npm run build

# 3. Admin Frontend
cd frontend/admin-ecommerce-cp-main
npm run build

# 4. Restart services
```

**Switch to DEVELOPMENT:**

```bash
# 1. Backend - Edit .env
nano fastapi_ecommerce-main/.env
# Set: ENVIRONMENT=development, DEBUG=true, Update URLs to localhost

# 2. Customer Frontend
cd frontend/customized_product_ecommerce-main
npm run dev

# 3. Admin Frontend
cd frontend/admin-ecommerce-cp-main
npm run dev
```

## Troubleshooting

### Backend Not Starting

```bash
# Check Python version
python3 --version

# Check if port 8000 is in use
lsof -i :8000

# Check logs
tail -f ~/public_html/fastapi_ecommerce-main/logs/app.log

# Test database connection
cd fastapi_ecommerce-main
source venv/bin/activate
python -c "from app.core.database import database; print('DB OK')"
```

### Frontend Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check Node.js version
node --version  # Should be 18+

# Check environment variables
cat .env.production
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -h localhost -u your_db_user -p your_db_name

# Check database URL format in .env
# Should be: mysql+aiomysql://user:pass@localhost:3306/dbname
```

### CORS Errors

Check `ALLOWED_ORIGINS` in backend `.env`:

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

### Static Files Not Loading

Check permissions:

```bash
chmod -R 755 fastapi_ecommerce-main/app/static
chown -R your_cpanel_username:your_cpanel_username fastapi_ecommerce-main/app/static
```

## Security Checklist

- [ ] Changed `SECRET_KEY` to a secure random string
- [ ] Set `DEBUG=false` in production
- [ ] Database user has strong password
- [ ] `.env` files are not committed to Git (add to `.gitignore`)
- [ ] CORS is properly configured
- [ ] SSL certificate is installed and HTTPS is enforced
- [ ] File upload directory permissions are correct (755)
- [ ] Database backups are configured

## Maintenance

### Creating Database Backup

```bash
mysqldump -u your_db_user -p your_db_name > backup_$(date +%Y%m%d).sql
```

### Updating the Application

```bash
# 1. Backup database
# 2. Pull latest code
git pull origin main

# 3. Backend: Install dependencies and run migrations
cd fastapi_ecommerce-main
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# 4. Frontend: Rebuild
cd frontend/customized_product_ecommerce-main
npm install
npm run build

cd frontend/admin-ecommerce-cp-main
npm install
npm run build

# 5. Restart services
```

### Monitoring

```bash
# Check running processes
ps aux | grep uvicorn
ps aux | grep node

# Check resource usage
top
df -h

# View logs
tail -f fastapi_ecommerce-main/logs/*.log
```

## Support

For issues:

1. Check the troubleshooting section
2. Review application logs
3. Check cPanel error logs
4. Verify environment variable configuration

---

**Congratulations!** Your Office Shop e-commerce application is now configured for flexible deployment on cPanel, with the ability to switch between development and production with minimal changes!
