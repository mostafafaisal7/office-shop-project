# Fix: FastAPI Works on Localhost but NOT on Domain

## ✅ Good News: Your App Works!

Your logs show:
```
INFO: 127.0.0.1:36656 - "GET /products/ HTTP/1.1" 200 OK
```

This means:
- ✅ FastAPI is running correctly
- ✅ Database connection works
- ✅ Endpoints are responding
- ❌ Domain is NOT reaching your app (proxy issue)

---

## 🎯 The Problem

Your FastAPI app is running on `http://localhost:8000` but your domain `https://api.yourdomain.com` can't reach it. This is a **proxy/routing issue**.

---

## 🔧 Solution 1: Configure Python App in cPanel (Recommended)

### Step 1: Check Python App Configuration

1. Go to cPanel → **Setup Python App**
2. Find your application
3. Click **Edit**

**Verify these settings:**
```
Python Version: 3.11 (or whatever you have)
Application Root: fastapi_ecommerce-main
Application URL: api.yourdomain.com
Application Startup File: passenger_wsgi.py
Application Entry Point: application
```

### Step 2: Check Application Status

In the Python App interface, check:
- Status should be **Running** or **Started**
- If status is **Stopped**, click **Start**
- If status shows errors, click **View Logs**

### Step 3: Restart the Application

Click the **Restart** button and wait 30 seconds.

### Step 4: Test

Visit: `https://api.yourdomain.com/docs`

---

## 🔧 Solution 2: Use Apache Reverse Proxy (If Python App Doesn't Work)

### Step 1: Ensure FastAPI is Running

```bash
# Check if FastAPI process is running
ps aux | grep uvicorn

# If not running, start it:
screen -S fastapi
cd ~/fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2

# Press Ctrl+A then D to detach
```

### Step 2: Create/Update .htaccess

Find your subdomain directory (e.g., `~/public_html/api/` or the document root you set for api.yourdomain.com).

Create or update `.htaccess`:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Proxy to FastAPI application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:8000/$1 [P,L]

# CORS Headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    Header always set Access-Control-Expose-Headers "Content-Disposition"
    Header always set Access-Control-Allow-Credentials "true"
</IfModule>

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### Step 3: Enable Required Apache Modules

You may need to enable proxy modules. Contact your hosting provider or check if these are enabled:
- mod_proxy
- mod_proxy_http
- mod_rewrite
- mod_headers

### Step 4: Test Proxy

```bash
# From SSH, test if proxy works
curl -v http://localhost:8000/products/

# Should return JSON data
```

---

## 🔧 Solution 3: Configure ProxyPass (Advanced)

If you have access to Apache configuration or via cPanel's "Apache Includes":

### Create proxy configuration:

```apache
<VirtualHost *:443>
    ServerName api.yourdomain.com

    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert
    SSLCertificateKeyFile /path/to/ssl/key

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/

    <Location />
        Order allow,deny
        Allow from all
    </Location>
</VirtualHost>
```

---

## 🔧 Solution 4: Check If App is Listening on Correct Interface

### Current Status Check:

```bash
# Check what's listening on port 8000
netstat -tlnp | grep 8000

# OR
lsof -i :8000
```

### If nothing shows, start FastAPI:

```bash
cd ~/fastapi_ecommerce-main
source venv/bin/activate

# Make sure it listens on all interfaces (0.0.0.0) or localhost (127.0.0.1)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# OR for localhost only:
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## 🔍 Diagnostic Steps

### 1. Test if FastAPI is accessible from server:

```bash
# From SSH on your cPanel server:
curl http://localhost:8000/docs
curl http://127.0.0.1:8000/products/
```

**Expected:** Should return HTML or JSON data
**If fails:** FastAPI isn't running or not on port 8000

### 2. Test if domain resolves correctly:

```bash
# Check DNS
nslookup api.yourdomain.com

# Check if domain points to your server
ping api.yourdomain.com
```

**Expected:** Should show your server's IP
**If fails:** DNS not configured properly

### 3. Check Apache error logs:

```bash
# Check Apache errors
tail -50 ~/logs/error.log
tail -50 /usr/local/apache/logs/error_log

# Check domain-specific logs
tail -50 ~/logs/api.yourdomain.com.error.log
```

### 4. Test proxy manually:

```bash
# If .htaccess uses proxy, test it:
curl -v -H "Host: api.yourdomain.com" http://localhost:8000/products/
```

---

## 🚨 Quick Fix Checklist

Run through these in order:

### [ ] 1. Verify FastAPI is Running

```bash
ps aux | grep uvicorn
# Should show a uvicorn process
```

If not:
```bash
cd ~/fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
```

### [ ] 2. Test Local Access

```bash
curl http://localhost:8000/products/
# Should return JSON
```

### [ ] 3. Check cPanel Python App Status

- Go to Setup Python App
- Status should be "Running"
- If stopped, click Start
- Click Restart

### [ ] 4. Check .htaccess exists and is correct

```bash
# For subdomain api.yourdomain.com
cat ~/public_html/api/.htaccess

# Should contain RewriteRule with [P,L] flag
```

### [ ] 5. Check Apache can reach localhost:8000

```bash
# Test from Apache's perspective
sudo -u nobody curl http://localhost:8000/products/
```

### [ ] 6. Check SSL Certificate

```bash
# In cPanel, go to SSL/TLS Status
# Make sure api.yourdomain.com has a valid certificate
```

### [ ] 7. Check Firewall

```bash
# Make sure port 8000 isn't blocked (it should only be accessible locally)
iptables -L | grep 8000
```

---

## 🎯 Most Likely Solutions

Based on your logs showing FastAPI works on localhost, try these in order:

### Option A: Python App Method (Simplest)

1. Go to cPanel → Setup Python App
2. Make sure app URL matches your domain exactly
3. Click **Restart**
4. Wait 30 seconds
5. Test `https://api.yourdomain.com/docs`

### Option B: .htaccess Proxy Method

1. Find your subdomain directory (where api.yourdomain.com points)
2. Create/update `.htaccess` with the proxy rules above
3. Make sure mod_proxy is enabled
4. Test `https://api.yourdomain.com/docs`

### Option C: Manual Start + Proxy

1. Start FastAPI manually:
   ```bash
   screen -S fastapi
   cd ~/fastapi_ecommerce-main
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   # Ctrl+A, D to detach
   ```

2. Set up .htaccess proxy (see above)

3. Test `https://api.yourdomain.com/docs`

---

## 📝 Collect This Info If Still Not Working

```bash
# 1. Check what's running
ps aux | grep uvicorn

# 2. Check what's listening
netstat -tlnp | grep 8000

# 3. Test localhost access
curl -v http://localhost:8000/products/

# 4. Check Apache config
cat ~/public_html/api/.htaccess

# 5. Check Apache modules
apachectl -M | grep proxy

# 6. Check subdomain config
# In cPanel → Subdomains, verify api.yourdomain.com exists

# 7. Recent Apache errors
tail -20 ~/logs/error.log
```

Share this output if you need more help!

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ `https://api.yourdomain.com/docs` shows FastAPI documentation
- ✅ `https://api.yourdomain.com/products/` returns JSON data
- ✅ Your Vercel frontend can connect to the API

---

## 💡 Key Insight

Your app works (proven by localhost logs). The issue is the connection between your domain and the app. It's a routing/proxy problem, not a code problem!

**Most common fix:** Set up the .htaccess proxy correctly OR ensure cPanel Python App is properly configured.
