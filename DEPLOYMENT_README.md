# Office Shop E-commerce - Deployment Documentation

Complete deployment documentation for your e-commerce platform with FastAPI backend and Next.js frontends.

## 📋 Documentation Index

### Quick Start
- **[QUICK_START_VERCEL_DEPLOYMENT.md](./QUICK_START_VERCEL_DEPLOYMENT.md)** ⚡
  - **5-minute deployment guide**
  - Deploy frontends to Vercel with backend on cPanel
  - Perfect for getting started quickly!

### Detailed Guides
1. **[CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md](./CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md)** 📚
   - Complete guide for hybrid deployment
   - FastAPI on cPanel + Frontends on Vercel
   - Includes architecture diagrams and troubleshooting
   - **Use this for your setup!**

2. **[BACKEND_CORS_UPDATE_FOR_VERCEL.md](./BACKEND_CORS_UPDATE_FOR_VERCEL.md)** 🔧
   - Quick reference for updating backend CORS
   - Step-by-step SSH commands
   - Troubleshooting CORS issues

3. **[CPANEL_DEPLOYMENT_GUIDE.md](./CPANEL_DEPLOYMENT_GUIDE.md)** 🖥️
   - Full cPanel deployment (all components)
   - For deploying everything to cPanel

4. **[VERCEL_DEPLOYMENT_READINESS.md](./VERCEL_DEPLOYMENT_READINESS.md)** ✅
   - Deployment readiness checklist
   - Backend platform options
   - General Vercel information

5. **[ENVIRONMENT_CONFIGURATION_SUMMARY.md](./ENVIRONMENT_CONFIGURATION_SUMMARY.md)** ⚙️
   - Complete environment variables reference
   - How configuration works
   - Development vs Production setup

## 🏗️ Your Architecture

```
┌─────────────────────────────────────────────┐
│           cPanel Server                     │
│  ┌──────────────────────────────────────┐  │
│  │  FastAPI Backend + MySQL Database    │  │
│  │  https://yourdomain.com              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ▲
                    │ API Calls (HTTPS)
                    │
       ┌────────────┴────────────┐
       │                          │
┌──────▼─────┐           ┌───────▼──────┐
│  Vercel    │           │  Vercel      │
│  Customer  │           │  Admin       │
│  Frontend  │           │  Frontend    │
└────────────┘           └──────────────┘
```

## 🚀 Deployment Workflow

### Recommended: cPanel Backend + Vercel Frontends

**Why this setup?**
- ✅ Best of both worlds
- ✅ Fast global frontend delivery (Vercel CDN)
- ✅ Backend with full database access (cPanel)
- ✅ Free Vercel tier works perfectly
- ✅ Automatic deployments on git push

**Follow this guide**: `QUICK_START_VERCEL_DEPLOYMENT.md` (5 minutes)

### Alternative: Full cPanel Deployment

Deploy everything to cPanel.

**Follow this guide**: `CPANEL_DEPLOYMENT_GUIDE.md`

## 📁 Environment Files

### Development (Your PC)
```
fastapi_ecommerce-main/.env              # Backend config (localhost)
frontend/admin-ecommerce-cp-main/.env.local    # Admin config (localhost)
frontend/customized_product_ecommerce-main/.env.local  # Customer config (localhost)
```

### Production (Vercel)
```
# Use these as reference:
frontend/admin-ecommerce-cp-main/.env.vercel.example
frontend/customized_product_ecommerce-main/.env.vercel.example

# Add variables in Vercel Dashboard (not as files)
```

### Backend Production (cPanel)
```
fastapi_ecommerce-main/.env.production.example  # Reference
# Update your existing .env on cPanel with production values
```

## 🎯 Common Tasks

### Deploy Frontends to Vercel
```bash
# It's automatic! Just push to GitHub:
git add .
git commit -m "Update feature"
git push
# Vercel deploys automatically in ~2 minutes
```

### Update Backend CORS (After Vercel Deployment)
```bash
# SSH to cPanel
ssh user@yourdomain.com
cd ~/path/to/fastapi_ecommerce-main

# Edit .env
nano .env
# Update ALLOWED_ORIGINS with Vercel URLs

# Restart backend
pkill -f uvicorn && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

See `BACKEND_CORS_UPDATE_FOR_VERCEL.md` for details.

### Run Locally (Development)
```bash
# Backend
cd fastapi_ecommerce-main
source venv/bin/activate
uvicorn app.main:app --reload

# Customer Frontend (new terminal)
cd frontend/customized_product_ecommerce-main
npm run dev

# Admin Frontend (new terminal)
cd frontend/admin-ecommerce-cp-main
npm run dev
```

### Test Production Build Locally
```bash
cd frontend/customized_product_ecommerce-main
npm run build
npm start
```

## 🔑 Key Environment Variables

### Backend (cPanel)
```env
DATABASE_URL=mysql+aiomysql://user:pass@localhost:3306/db
BASE_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://your-shop.vercel.app,https://your-admin.vercel.app
ENVIRONMENT=production
DEBUG=false
```

### Frontends (Vercel Dashboard)
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_IMAGE_DOMAINS=yourdomain.com
NODE_ENV=production
```

Full reference: `ENVIRONMENT_CONFIGURATION_SUMMARY.md`

## ✅ Pre-Deployment Checklist

### Backend on cPanel
- [ ] FastAPI running and accessible via HTTPS
- [ ] MySQL database created and configured
- [ ] Backend URL noted (e.g., `https://yourdomain.com`)
- [ ] `.env` file configured correctly
- [ ] Static files directory exists and writable

### Frontends to Vercel
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Backend URL ready for environment variables
- [ ] Local build tested: `npm run build`

### After Deployment
- [ ] Vercel URLs noted
- [ ] Backend CORS updated with Vercel URLs
- [ ] Backend restarted
- [ ] Customer frontend tested
- [ ] Admin frontend tested
- [ ] No CORS errors in browser console
- [ ] Images loading correctly
- [ ] Login functionality working

## 🐛 Troubleshooting

### CORS Errors
**File**: `BACKEND_CORS_UPDATE_FOR_VERCEL.md`
- Check `ALLOWED_ORIGINS` in backend `.env`
- Restart backend after changes
- Verify exact URLs (include https://)

### Build Failures
**File**: `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md` → Troubleshooting section
- Test build locally first
- Check environment variables
- Review build logs in Vercel

### Images Not Loading
**File**: `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md` → Troubleshooting section
- Check `NEXT_PUBLIC_IMAGE_DOMAINS`
- Verify static files accessible
- Check CSP headers

### API Connection Issues
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Test backend directly with curl
- Check CORS configuration

## 📊 Deployment Status

```
✅ Backend Configuration     - Environment variables ready
✅ Frontend Configuration    - .env.local and .env.vercel.example created
✅ CORS Setup               - Instructions provided
✅ Development Environment  - Works with localhost
✅ Production Environment   - Ready for Vercel + cPanel
✅ Documentation           - Complete guides available
✅ Automatic Deployments   - Via Vercel + GitHub
```

## 💡 Best Practices

### Security
- Never commit `.env` files to Git
- Use strong `SECRET_KEY` in production
- Only allow specific origins in CORS
- Keep `DEBUG=false` in production
- Regular database backups

### Development
- Test builds locally before deploying
- Use `.env.local` for development
- Keep development and production configs separate
- Review Vercel build logs for warnings

### Deployment
- Deploy backend first, then frontends
- Update CORS immediately after frontend deployment
- Test thoroughly after each deployment
- Monitor error logs regularly
- Use Vercel preview deployments for testing

## 📈 Monitoring

### Vercel Dashboard
- View deployment status
- Check build logs
- Monitor function logs
- Review performance metrics

### Backend Logs (cPanel)
```bash
ssh user@yourdomain.com
tail -f ~/path/to/logs/app.log
```

### Browser Console
- F12 → Console for frontend errors
- Network tab for API call debugging
- Check for CORS errors

## 🎓 Learning Resources

### Next.js
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Deployment](https://nextjs.org/docs/deployment)

### Vercel
- [Deploying Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

### FastAPI
- [Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [CORS Configuration](https://fastapi.tiangolo.com/tutorial/cors/)

## 💰 Cost Estimate

### Free Tier (Vercel)
- 2 projects (Customer + Admin)
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN
- **Cost**: $0/month

### cPanel Hosting
- Backend + Database + Static files
- **Cost**: Your existing hosting plan

**Total Additional Cost**: $0 using Vercel free tier!

## 🚦 Next Steps

### 1. First Time Deploying?
Start here: **[QUICK_START_VERCEL_DEPLOYMENT.md](./QUICK_START_VERCEL_DEPLOYMENT.md)**

### 2. Need Detailed Guide?
Read: **[CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md](./CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md)**

### 3. Updating CORS?
Quick reference: **[BACKEND_CORS_UPDATE_FOR_VERCEL.md](./BACKEND_CORS_UPDATE_FOR_VERCEL.md)**

### 4. Understanding Environment Variables?
See: **[ENVIRONMENT_CONFIGURATION_SUMMARY.md](./ENVIRONMENT_CONFIGURATION_SUMMARY.md)**

## 📞 Support

### Issues?
1. Check browser console for errors
2. Review relevant documentation file
3. Verify environment variables
4. Check backend logs
5. Test with curl/Postman

### Documentation Files
All guides are in the project root:
- `QUICK_START_VERCEL_DEPLOYMENT.md` - Quick start (5 min)
- `CPANEL_BACKEND_VERCEL_FRONTEND_GUIDE.md` - Detailed guide
- `BACKEND_CORS_UPDATE_FOR_VERCEL.md` - CORS configuration
- `ENVIRONMENT_CONFIGURATION_SUMMARY.md` - Environment variables
- `CPANEL_DEPLOYMENT_GUIDE.md` - Full cPanel deployment
- `VERCEL_DEPLOYMENT_READINESS.md` - Readiness checklist

## 🎉 Summary

Your Office Shop e-commerce platform is **ready for deployment** with:

✅ **Flexible Configuration** - Same code works everywhere
✅ **Modern Stack** - FastAPI + Next.js + Vercel
✅ **Zero Additional Cost** - Free Vercel tier
✅ **Automatic Deployments** - Push to deploy
✅ **Global Performance** - Vercel CDN
✅ **Complete Documentation** - Step-by-step guides
✅ **Development Ready** - Local setup works seamlessly
✅ **Production Ready** - Tested and documented

**Start deploying**: Open `QUICK_START_VERCEL_DEPLOYMENT.md` and follow along!

---

**Made with ❤️ for Office Shop E-commerce**
