# Quick Start: Deploy to Vercel (5 Minutes)

Your FastAPI backend is already running on cPanel. Let's deploy your frontends to Vercel!

## Prerequisites

- ✅ Backend running on cPanel
- ✅ Backend accessible via HTTPS (e.g., `https://yourdomain.com`)
- ✅ Code pushed to GitHub
- ✅ Vercel account (free)

## Step-by-Step Deployment

### 1️⃣ Deploy Customer Frontend (3 minutes)

1. **Go to Vercel**: https://vercel.com/new
2. **Import repository**: `mostafafaisal7/office-shop-project`
3. **Configure**:
   - Root Directory: `frontend/customized_product_ecommerce-main`
   - Click "Environment Variables"

4. **Add these variables** (copy-paste):
   ```
   NEXT_PUBLIC_API_URL=https://yourdomain.com
   API_URL=https://yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://temp-placeholder.vercel.app
   NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,images.unsplash.com
   NODE_ENV=production
   ```
   > Replace `yourdomain.com` with your actual cPanel domain!

5. **Click Deploy** → Wait 2-3 minutes
6. **Copy your URL**: e.g., `https://office-shop-abc123.vercel.app`
7. **Update NEXT_PUBLIC_SITE_URL**:
   - Project Settings → Environment Variables
   - Edit `NEXT_PUBLIC_SITE_URL` to your actual URL
   - Redeploy

### 2️⃣ Deploy Admin Frontend (3 minutes)

1. **New Project**: https://vercel.com/new
2. **Same repository**: `mostafafaisal7/office-shop-project`
3. **Configure**:
   - Root Directory: `frontend/admin-ecommerce-cp-main`
   - Add Environment Variables:

   ```
   NEXT_PUBLIC_API_URL=https://yourdomain.com
   API_URL=https://yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://temp-placeholder.vercel.app
   NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com,cdn.tiny.cloud
   NEXT_PUBLIC_BACKEND_URLS=https://yourdomain.com
   NODE_ENV=production
   ```

4. **Click Deploy** → Wait 2-3 minutes
5. **Copy admin URL**: e.g., `https://office-admin-xyz789.vercel.app`
6. **Update NEXT_PUBLIC_SITE_URL** (same as step 1.7)

### 3️⃣ Update Backend CORS (2 minutes)

SSH into your cPanel:

```bash
ssh username@yourdomain.com
cd ~/path/to/fastapi_ecommerce-main
nano .env
```

Update these lines:
```env
FRONTEND_URL=https://office-shop-abc123.vercel.app
ADMIN_FRONTEND_URL=https://office-admin-xyz789.vercel.app
ALLOWED_ORIGINS=https://office-shop-abc123.vercel.app,https://office-admin-xyz789.vercel.app
ENVIRONMENT=production
DEBUG=false
```

Save (Ctrl+X, Y, Enter) and restart:
```bash
pkill -f uvicorn && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

### 4️⃣ Test Everything (1 minute)

- ✅ Visit customer frontend → Should load
- ✅ Browse products → Should display
- ✅ Visit admin frontend → Should load
- ✅ Login to admin → Should work
- ✅ Check browser console → No CORS errors

## Done! 🎉

Your app is live:
- **Customer Shop**: `https://office-shop-abc123.vercel.app`
- **Admin Dashboard**: `https://office-admin-xyz789.vercel.app`
- **Backend**: `https://yourdomain.com` (cPanel)

## What Happens Now?

### Automatic Deployments
Every time you push to GitHub, Vercel automatically:
1. Detects the push
2. Builds your project
3. Deploys new version
4. Goes live in ~2 minutes

```bash
git add .
git commit -m "Update feature"
git push
# Vercel automatically deploys! 🚀
```

## Local Development Still Works!

Your local setup is unchanged:

```bash
# Frontend (local)
cd frontend/customized_product_ecommerce-main
npm run dev  # Uses .env.local → points to localhost

# Backend (local)
cd fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --reload
```

## Common Issues

### CORS Error?
```
Update backend CORS → See BACKEND_CORS_UPDATE_FOR_VERCEL.md
```

### Images Not Loading?
```
Check NEXT_PUBLIC_IMAGE_DOMAINS includes your cPanel domain
```

### Build Failed?
```
Test locally first: npm run build
Check environment variables in Vercel dashboard
```

## Next Steps

### Add Custom Domains (Optional)
1. Vercel Project → Settings → Domains
2. Add your domain (e.g., `shop.yourdomain.com`)
3. Update DNS records
4. Update environment variables
5. Update backend CORS

### Monitor Your App
- **Vercel Dashboard**: View deployments and logs
- **Backend Logs**: SSH and `tail -f logs/app.log`

### Optimize Performance
- Images automatically optimized by Next.js
- Frontend cached globally by Vercel CDN
- Zero configuration needed!

## Cost

- **Vercel**: $0/month (free tier)
- **cPanel**: Your existing hosting
- **Total Additional Cost**: $0

## Documentation

- **Full Guide**: `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md`
- **CORS Update**: `BACKEND_CORS_UPDATE_FOR_VERCEL.md`
- **Environment Vars**: `ENVIRONMENT_CONFIGURATION_SUMMARY.md`
- **Vercel Templates**: `.env.vercel.example` files

## Troubleshooting

Check browser console for errors:
- F12 → Console tab
- Look for red errors
- Check Network tab for failed requests

## Summary

```
✅ Customer frontend deployed to Vercel
✅ Admin frontend deployed to Vercel
✅ Backend CORS updated
✅ Automatic deployments enabled
✅ Local development unchanged
✅ Same code works everywhere
```

**Your e-commerce store is now live on Vercel!** 🚀

Share your URLs and start selling! 🎊

---

**Need help?** Check the full guide: `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md`
