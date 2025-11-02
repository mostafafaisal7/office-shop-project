# Backend CORS Configuration for Vercel Frontends

## Quick Reference

When deploying frontends to Vercel, you need to update your cPanel backend's CORS settings.

## What You Need

After deploying to Vercel, you'll have two URLs:
- **Customer Frontend**: `https://your-shop.vercel.app`
- **Admin Frontend**: `https://your-admin.vercel.app`

## Steps to Update Backend on cPanel

### 1. SSH into cPanel

```bash
ssh username@yourdomain.com
```

### 2. Navigate to Backend Directory

```bash
cd ~/path/to/fastapi_ecommerce-main
# Common paths:
# cd ~/public_html/fastapi_ecommerce-main
# cd ~/www/fastapi_ecommerce-main
```

### 3. Edit .env File

```bash
nano .env
# or
vim .env
```

### 4. Update These Variables

Find and update these lines:

```env
# ============================================
# APPLICATION URLS
# ============================================
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://your-shop.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-admin.vercel.app

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=https://your-shop.vercel.app,https://your-admin.vercel.app

# ============================================
# SERVER CONFIGURATION
# ============================================
ENVIRONMENT=production
DEBUG=false
```

**Replace**:
- `your-shop.vercel.app` → Your actual customer frontend URL
- `your-admin.vercel.app` → Your actual admin frontend URL
- `yourdomain.com` → Your actual cPanel domain

### 5. Save and Exit

**In nano**: Press `Ctrl+X`, then `Y`, then `Enter`

**In vim**: Press `Esc`, type `:wq`, press `Enter`

### 6. Restart Backend

```bash
# Method 1: Kill and restart (if running in background)
pkill -f uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Method 2: If using systemd service
sudo systemctl restart fastapi-app

# Method 3: If using cPanel Python app manager
# Go to cPanel → Setup Python App → Restart
```

## Verify CORS Settings

### Check Environment Variables

```bash
cat .env | grep -E "(ALLOWED_ORIGINS|FRONTEND_URL|ADMIN_FRONTEND_URL)"
```

Should output:
```
FRONTEND_URL=https://your-shop.vercel.app
ADMIN_FRONTEND_URL=https://your-admin.vercel.app
ALLOWED_ORIGINS=https://your-shop.vercel.app,https://your-admin.vercel.app
```

### Test CORS

From your browser console on Vercel-deployed frontend:

```javascript
fetch('https://yourdomain.com/api/products')
  .then(res => res.json())
  .then(data => console.log('CORS works!', data))
  .catch(err => console.error('CORS error:', err));
```

## Common Issues

### Issue: CORS Error After Deployment

**Error in browser**:
```
Access to fetch at 'https://yourdomain.com' from origin 'https://your-shop.vercel.app'
has been blocked by CORS policy
```

**Solution**:
1. Check `ALLOWED_ORIGINS` includes exact Vercel URL
2. Must include `https://`
3. No trailing slash
4. Restart backend after changes

### Issue: Backend Not Restarting

**Solution**:
```bash
# Find the process
ps aux | grep uvicorn

# Kill it manually
kill -9 <process_id>

# Start again
cd ~/path/to/fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

### Issue: Changes Not Taking Effect

**Solution**:
1. Verify .env file was saved: `cat .env | grep ALLOWED_ORIGINS`
2. Make sure backend was restarted
3. Clear browser cache
4. Hard refresh frontend (Ctrl+Shift+R)

## Complete Backend .env Template for Vercel

Here's a complete example for production with Vercel:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=mysql+aiomysql://db_user:db_pass@localhost:3306/db_name
SYNC_DATABASE_URL=mysql+pymysql://db_user:db_pass@localhost:3306/db_name

# ============================================
# APPLICATION URLS
# ============================================
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://shop.yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=https://shop.yourdomain.com,https://admin.yourdomain.com

# ============================================
# JWT AUTHENTICATION
# ============================================
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3600
REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# FILE STORAGE
# ============================================
STATIC_DIR=app/static
STATIC_URL_PATH=/images

# ============================================
# SMS PROVIDER CONFIGURATION
# ============================================
SMS_PROVIDER=greenweb
GREENWEB_API_KEY=your_greenweb_api_key
GREENWEB_URL=http://api.greenweb.com.bd/api.php

# ============================================
# API KEYS
# ============================================
ANTHROPIC_API_KEY=your_api_key_here

# ============================================
# SERVER CONFIGURATION
# ============================================
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=false
```

## Testing Checklist

After updating CORS:

- [ ] Backend restarted successfully
- [ ] Can access backend directly: `curl https://yourdomain.com`
- [ ] Customer frontend loads without CORS errors
- [ ] Admin frontend loads without CORS errors
- [ ] Can login to customer frontend
- [ ] Can login to admin frontend
- [ ] Images load properly
- [ ] API calls work (check Network tab in browser)
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Quick Commands Reference

```bash
# SSH to cPanel
ssh username@yourdomain.com

# Edit backend .env
cd ~/path/to/fastapi_ecommerce-main && nano .env

# Check CORS settings
cat .env | grep ALLOWED_ORIGINS

# Restart backend
pkill -f uvicorn && uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Check if backend is running
ps aux | grep uvicorn

# View backend logs
tail -f ~/logs/app.log  # adjust path as needed

# Test backend is accessible
curl https://yourdomain.com
```

## When to Update CORS

You need to update CORS settings when:

1. **First deployment** to Vercel (add Vercel URLs)
2. **Custom domain added** to Vercel project
3. **New frontend added** (e.g., mobile app)
4. **Testing from new domain** (add to ALLOWED_ORIGINS temporarily)

## Security Best Practices

### ✅ DO:
- Only allow specific domains you control
- Use HTTPS URLs only
- Keep the list minimal
- Remove test/development URLs from production

### ❌ DON'T:
- Use wildcard `*` in production
- Include HTTP URLs (only HTTPS)
- Add random domains
- Leave development URLs in production

## Example Configurations

### Development (Local PC)
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
DEBUG=true
```

### Production (Vercel)
```env
ALLOWED_ORIGINS=https://shop.yourdomain.com,https://admin.yourdomain.com
FRONTEND_URL=https://shop.yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com
ENVIRONMENT=production
DEBUG=false
```

### Mixed (Testing)
```env
# For testing both local and production simultaneously
ALLOWED_ORIGINS=http://localhost:3000,https://shop.vercel.app,https://admin.vercel.app
FRONTEND_URL=https://shop.vercel.app
ADMIN_FRONTEND_URL=https://admin.vercel.app
ENVIRONMENT=production
DEBUG=false
```

## Troubleshooting Decision Tree

```
CORS error?
├─ Yes → Check ALLOWED_ORIGINS in backend .env
│   ├─ Correct? → Restart backend
│   │   ├─ Still failing? → Check frontend URL exactly matches
│   │   └─ Works? → Done! ✓
│   └─ Incorrect? → Update and restart
│
└─ No → Check other issues:
    ├─ Backend not accessible? → Check if running
    ├─ Images not loading? → Check IMAGE_DOMAINS
    └─ Login failing? → Check JWT settings
```

## Need Help?

Check these files:
- `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md` - Full deployment guide
- `ENVIRONMENT_CONFIGURATION_SUMMARY.md` - All environment variables
- `CPANEL_DEPLOYMENT_GUIDE.md` - cPanel-specific setup

Or verify current configuration:
```bash
# Show all environment URLs
cd ~/path/to/fastapi_ecommerce-main
cat .env | grep -E "(URL|ORIGINS|ENVIRONMENT|DEBUG)"
```
