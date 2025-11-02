# Deployment Guide: cPanel Backend + Vercel Frontends

## Overview

This guide covers deploying your Office Shop e-commerce with:
- **Backend (FastAPI)**: Running on cPanel localhost (already set up)
- **Customer Frontend**: Deployed to Vercel
- **Admin Frontend**: Deployed to Vercel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your cPanel Server                        │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  FastAPI Backend (Port 8000)                       │     │
│  │  - MySQL Database (localhost:3306)                 │     │
│  │  - Static Files (images, uploads)                  │     │
│  │  - REST API                                        │     │
│  └────────────────────────────────────────────────────┘     │
│                            ▲                                 │
│                            │ HTTPS                           │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ API Calls
                             │
        ┌────────────────────┴────────────────────┐
        │                                          │
        │                                          │
┌───────▼────────┐                        ┌───────▼────────┐
│  Vercel        │                        │  Vercel        │
│  Customer      │                        │  Admin         │
│  Frontend      │                        │  Frontend      │
└────────────────┘                        └────────────────┘
```

## Prerequisites

### cPanel Backend (Already Running)
- ✅ FastAPI running on cPanel
- ✅ MySQL database configured
- ✅ Backend accessible via public domain (e.g., `https://api.yourdomain.com` or `https://yourdomain.com`)

### What You Need
1. **Your cPanel Backend URL** (e.g., `https://yourdomain.com` or `https://api.yourdomain.com`)
2. **Vercel Account** (free tier works)
3. **GitHub Repository** (your code)

## Step 1: Prepare cPanel Backend

### 1.1 Ensure Backend is Publicly Accessible

Your FastAPI backend needs a public URL. Check with:

```bash
curl https://yourdomain.com/
# or
curl https://api.yourdomain.com/
```

If you get a response, your backend is accessible. Note this URL!

### 1.2 Update Backend CORS for Vercel

Once you deploy to Vercel, you'll get URLs like:
- Customer: `https://your-project.vercel.app`
- Admin: `https://your-project-admin.vercel.app`

Update your backend `.env` on cPanel:

```bash
# SSH into cPanel
ssh user@yourdomain.com

# Edit backend .env
cd ~/path/to/fastapi_ecommerce-main
nano .env
```

Update these variables:

```env
# ============================================
# APPLICATION URLS
# ============================================
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://your-project.vercel.app
ADMIN_FRONTEND_URL=https://your-project-admin.vercel.app

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-project-admin.vercel.app
```

**Important**: You'll update these after deploying to Vercel in Step 3.

### 1.3 Restart Backend

```bash
# Restart your FastAPI service (method depends on your cPanel setup)
# Common methods:
pkill -f uvicorn && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
# or restart via cPanel Python app manager
```

## Step 2: Deploy Customer Frontend to Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repository

### 2.2 Create New Project

1. Click **"New Project"**
2. Import your GitHub repository: `mostafafaisal7/office-shop-project`
3. Configure project:

   **Framework Preset**: Next.js ✓

   **Root Directory**: `frontend/customized_product_ecommerce-main`

   **Build Command**: `npm run build` (default)

   **Output Directory**: `.next` (default)

   **Install Command**: `npm install` (default)

### 2.3 Configure Environment Variables

Click **"Environment Variables"** and add:

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
API_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,images.unsplash.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=false
NODE_ENV=production
```

**Replace**:
- `yourdomain.com` - Your actual cPanel domain where FastAPI is running
- `your-project.vercel.app` - Will be assigned by Vercel (you can use placeholder first)

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Note your deployed URL (e.g., `https://your-project.vercel.app`)

### 2.5 Update Environment Variable

After deployment:
1. Go to Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_SITE_URL` to the actual Vercel URL
3. Redeploy (Deployments → ⋯ → Redeploy)

## Step 3: Deploy Admin Frontend to Vercel

### 3.1 Create Another Project

1. From Vercel dashboard, click **"New Project"**
2. Import the same repository again
3. Configure project:

   **Framework Preset**: Next.js ✓

   **Root Directory**: `frontend/admin-ecommerce-cp-main`

   **Build Command**: `npm run build`

   **Output Directory**: `.next`

### 3.2 Configure Environment Variables

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
API_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://your-project-admin.vercel.app
NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,cdn.tiny.cloud
NEXT_PUBLIC_BACKEND_URLS=https://yourdomain.com
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NODE_ENV=production
```

**Replace**:
- `yourdomain.com` - Your cPanel backend domain
- `your-project-admin.vercel.app` - Vercel will assign this

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Note your admin URL (e.g., `https://your-project-admin.vercel.app`)

### 3.4 Update Environment Variable

After deployment:
1. Update `NEXT_PUBLIC_SITE_URL` to actual URL
2. Redeploy

## Step 4: Update Backend CORS

Now that you have both Vercel URLs, update cPanel backend:

```bash
# SSH to cPanel
cd ~/path/to/fastapi_ecommerce-main
nano .env
```

Update:

```env
FRONTEND_URL=https://your-actual-customer.vercel.app
ADMIN_FRONTEND_URL=https://your-actual-admin.vercel.app
ALLOWED_ORIGINS=https://your-actual-customer.vercel.app,https://your-actual-admin.vercel.app
```

Restart backend:

```bash
# Restart FastAPI
pkill -f uvicorn && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

## Step 5: Test Everything

### 5.1 Test Customer Frontend

1. Visit `https://your-customer.vercel.app`
2. Browse products
3. Add to cart
4. Test login/registration
5. Test checkout

### 5.2 Test Admin Frontend

1. Visit `https://your-admin.vercel.app`
2. Login with admin credentials
3. Check dashboard
4. Test product management
5. Test order management

### 5.3 Test Image Loading

- Upload a product image in admin
- Verify it appears in customer frontend
- Check browser console for errors

## Environment Variables Reference

### Customer Frontend (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://yourdomain.com` | Your cPanel backend URL |
| `API_URL` | `https://yourdomain.com` | Internal API URL |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_IMAGE_DOMAINS` | `yourdomain.com,images.unsplash.com` | Allowed image domains |
| `NODE_ENV` | `production` | Environment |

### Admin Frontend (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://yourdomain.com` | Your cPanel backend URL |
| `API_URL` | `https://yourdomain.com` | Internal API URL |
| `NEXT_PUBLIC_SITE_URL` | `https://your-admin.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_IMAGE_DOMAINS` | `yourdomain.com,cdn.tiny.cloud` | Allowed image domains |
| `NEXT_PUBLIC_BACKEND_URLS` | `https://yourdomain.com` | For CSP headers |
| `NODE_ENV` | `production` | Environment |

### Backend (cPanel)

| Variable | Current Value | Update To |
|----------|---------------|-----------|
| `BASE_URL` | `http://127.0.0.1:8000` | `https://yourdomain.com` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://your-customer.vercel.app` |
| `ADMIN_FRONTEND_URL` | `http://localhost:3000` | `https://your-admin.vercel.app` |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | `https://your-customer.vercel.app,https://your-admin.vercel.app` |
| `ENVIRONMENT` | `development` | `production` |
| `DEBUG` | `true` | `false` |

## Local Development Still Works!

Your local development setup remains unchanged:

```bash
# Backend (cPanel keeps running)
# You can also run locally:
cd fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --reload

# Customer Frontend (local)
cd frontend/customized_product_ecommerce-main
npm run dev
# Uses .env.local (points to http://127.0.0.1:8000)

# Admin Frontend (local)
cd frontend/admin-ecommerce-cp-main
npm run dev
# Uses .env.local (points to http://127.0.0.1:8000)
```

## Automatic Deployments

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys new version
# 4. Live in ~2 minutes!
```

## Custom Domains (Optional)

### For Vercel Frontends

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `shop.yourdomain.com`)
3. Update DNS records as instructed
4. Update environment variables with new domain

### Example with Custom Domains

- Backend: `https://api.yourdomain.com` (cPanel)
- Customer: `https://shop.yourdomain.com` (Vercel)
- Admin: `https://admin.yourdomain.com` (Vercel)

## Troubleshooting

### CORS Errors in Browser Console

**Error**: `Access to fetch at 'https://yourdomain.com' from origin 'https://your-project.vercel.app' has been blocked by CORS`

**Solution**:
1. Check `ALLOWED_ORIGINS` in cPanel backend `.env`
2. Must include exact Vercel URL (with https://)
3. Restart backend after changes

```bash
# Check current CORS settings
cat ~/path/to/fastapi_ecommerce-main/.env | grep ALLOWED_ORIGINS

# Should show:
ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-admin.vercel.app
```

### Images Not Loading

**Error**: Images return 403 or don't load

**Solution**:
1. Check `NEXT_PUBLIC_IMAGE_DOMAINS` includes your cPanel domain
2. Verify static files are accessible: `https://yourdomain.com/images/test.jpg`
3. Check CSP headers in `next.config.ts`

### Build Fails on Vercel

**Error**: "Module not found" or build errors

**Solution**:
1. Test build locally first:
   ```bash
   cd frontend/customized_product_ecommerce-main
   npm run build
   ```
2. Check all dependencies in `package.json`
3. Verify environment variables are set in Vercel
4. Check build logs in Vercel dashboard

### API Calls Return 404

**Error**: API endpoints not found

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
2. Test backend directly: `curl https://yourdomain.com/api/products`
3. Check backend is running on cPanel
4. Verify cPanel domain is accessible

### Backend Connection Issues

**Error**: Cannot connect to backend

**Solution**:
1. Verify backend is running:
   ```bash
   ps aux | grep uvicorn
   ```
2. Check backend logs for errors
3. Verify firewall allows connections
4. Test with curl: `curl https://yourdomain.com`

## Monitoring and Logs

### Vercel Logs

1. Go to Deployments
2. Click on deployment
3. View **Build Logs** and **Function Logs**

### Backend Logs (cPanel)

```bash
# View FastAPI logs
tail -f ~/path/to/logs/app.log

# Or check systemd logs if using service
journalctl -u fastapi-app -f
```

## Performance Optimization

### Vercel Edge Network

Vercel automatically distributes your frontends globally for fast loading.

### Image Optimization

Next.js automatically optimizes images. Make sure:
1. Use `<Image>` component from `next/image`
2. `NEXT_PUBLIC_IMAGE_DOMAINS` is configured
3. Images are accessible from backend

### Caching

Vercel caches static assets automatically. For API caching:
- Configure cache headers in FastAPI
- Use Vercel's Edge Config for dynamic data

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Keep secrets in Vercel dashboard
- Rotate `SECRET_KEY` regularly

### 2. CORS Configuration
- Only allow your specific Vercel domains
- Don't use wildcards (`*`) in production

### 3. HTTPS Only
- Ensure backend uses HTTPS
- Vercel provides HTTPS automatically

### 4. Database Security
- Use strong database passwords
- Limit database access to cPanel localhost
- Regular backups

## Cost Estimate

### Vercel (Free Tier)
- ✅ 2 Projects (Customer + Admin)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- **Cost**: $0/month

### cPanel (Your Existing Hosting)
- Backend hosting
- Database
- Static file storage
- **Cost**: Your current hosting plan

**Total Additional Cost**: $0 (using Vercel free tier)

## Backup Strategy

### Code (Git)
- ✅ All code in GitHub
- ✅ Vercel deploys from Git
- ✅ Easy rollback to previous versions

### Database
```bash
# On cPanel, backup MySQL regularly
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql
```

### Uploaded Files
```bash
# Backup static files directory
tar -czf static_backup_$(date +%Y%m%d).tar.gz app/static/
```

## Quick Deployment Checklist

- [ ] cPanel backend running and accessible via HTTPS
- [ ] Backend URL noted (e.g., `https://yourdomain.com`)
- [ ] Created Vercel account
- [ ] Deployed customer frontend to Vercel
- [ ] Deployed admin frontend to Vercel
- [ ] Updated backend CORS with Vercel URLs
- [ ] Restarted backend on cPanel
- [ ] Tested customer frontend functionality
- [ ] Tested admin frontend functionality
- [ ] Tested image uploads and display
- [ ] Tested login/authentication
- [ ] Tested cart and checkout
- [ ] Checked browser console for errors
- [ ] Verified CORS is working
- [ ] Set up automatic deployments from GitHub

## Summary

Your deployment setup:

```
✅ Backend: Running on cPanel (https://yourdomain.com)
✅ Customer Frontend: Deployed to Vercel (auto-updates on git push)
✅ Admin Frontend: Deployed to Vercel (auto-updates on git push)
✅ Database: MySQL on cPanel
✅ Local Development: Still works with .env.local files
```

**Benefits**:
- 🚀 Fast global frontend delivery (Vercel Edge Network)
- 💰 Zero additional cost (Vercel free tier)
- 🔄 Automatic deployments on git push
- 🛡️ Free HTTPS for frontends
- 💻 Local development unchanged
- 📊 Easy monitoring via Vercel dashboard

## Next Steps

1. **Deploy customer frontend** following Step 2
2. **Deploy admin frontend** following Step 3
3. **Update backend CORS** following Step 4
4. **Test everything** following Step 5
5. **Set up custom domains** (optional)
6. **Share your live URLs!** 🎉

---

**Questions?** Refer to:
- `ENVIRONMENT_CONFIGURATION_SUMMARY.md` - Environment variables details
- `CPANEL_DEPLOYMENT_GUIDE.md` - Full cPanel deployment
- `VERCEL_DEPLOYMENT_READINESS.md` - Vercel-specific information
