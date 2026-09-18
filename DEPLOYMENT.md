# Midnight Monk - Deployment Guide

## Overview

This guide covers deploying Midnight Monk to production with:
- **Frontend:** Vercel (free tier, automatic deployments)
- **Backend:** Render (free tier with sleep limits, paid recommended)
- **Database:** MongoDB Atlas (free M0 tier)
- **Maps:** Google Maps (28,000 free requests/month)

---

## Part 1: Pre-Deployment Checklist

### Security
- [ ] `.env` files added to `.gitignore`
- [ ] No API keys or secrets in source code
- [ ] JWT_SECRET is long and random (32+ chars)
- [ ] MONGO_URI uses strong password (20+ chars)
- [ ] Google Maps API key restricted to domain + APIs

### Code Quality
- [ ] No `console.log()` statements in production code
- [ ] No TypeErrors or unhandled exceptions in console
- [ ] Mobile layout tested (375px, 768px, 1024px, 1920px)
- [ ] All 11 test scenarios pass (see TESTING.md)

### Backend
- [ ] All routes return proper JSON
- [ ] Authorization checks in place
- [ ] Error messages don't expose sensitive data
- [ ] Database indices created for common queries

### Frontend
- [ ] Environment variables documented in .env.example
- [ ] Build succeeds without warnings: `npm run build`
- [ ] No failed imports or missing dependencies
- [ ] Tracking page works with fallback if Maps API fails

---

## Part 2: GitHub Setup

### Step 1: Initialize Git Repository

```bash
cd /path/to/midnight-monk
git init
git add .
git commit -m "Initial commit: Midnight Monk v1.0 with Google Maps tracking"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Name: `midnight-monk`
3. Description: `Late-night food delivery app with live order tracking`
4. Visibility: Public or Private (your choice)
5. Click "Create repository"

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/midnight-monk.git
git branch -M main
git push -u origin main
```

### Step 4: Verify .gitignore

Ensure these are in `.gitignore`:
```
.env
backend/.env
frontend/.env
backend/venv/
backend/.venv/
backend/__pycache__/
frontend/node_modules/
frontend/dist/
```

---

## Part 3: MongoDB Atlas Setup

### Step 1: Create Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up with email
3. Create organization (or use default)

### Step 2: Create Free Cluster

1. Click "Create a Deployment"
2. Select **Free Tier** (M0 - Shared)
3. Provider: AWS
4. Region: Closest to your users
5. Cluster name: `midnight-monk`
6. Click "Create"

⏳ Wait 1-2 minutes for cluster to be ready

### Step 3: Create Database User

1. In left sidebar → "Security" → "Database Access"
2. Click "+ Add New Database User"
3. Username: `midnightmonk` (or your choice)
4. Password: Generate strong password (20+ chars)
   - Copy and save to password manager!
5. Database User Privileges: "Built-in Role" → "Atlas Admin"
6. Click "Add User"

### Step 4: Whitelist IP

1. In left sidebar → "Security" → "Network Access"
2. Click "+ Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ For production, replace with specific IP ranges
4. Click "Confirm"

### Step 5: Get Connection String

1. In left sidebar → "Deployment" → "Clusters"
2. Click "Connect" on your cluster
3. Choose "Drivers" → "Node.js" (or Python)
4. Copy the connection string:
   ```
   mongodb+srv://midnightmonk:<password>@midnight-monk.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Save this as your backend `MONGO_URI`

---

## Part 4: Google Cloud Setup

### Step 1: Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name: `Midnight Monk`
4. Click "Create"

### Step 2: Enable Billing

1. In top navigation, click your project name
2. Go to "Billing"
3. Link a billing account (even for free tier)
4. Add payment method

### Step 3: Enable APIs

1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - **Maps JavaScript API**
   - **Routes API**
   - **Distance Matrix API** (optional)

For each API:
1. Click on it
2. Click "Enable"
3. Wait for it to show as enabled

### Step 4: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Click "Restrict Key"

### Step 5: Add Restrictions

**Application Restrictions:**
- Type: "HTTP referrers"
- Add these referrers:
  ```
  localhost:5173
  localhost:3000
  *.vercel.app
  yourdomain.com
  ```

**API Restrictions:**
- Select "Restrict key"
- Check: Maps JavaScript API, Routes API, Distance Matrix API

Click "Save"

---

## Part 5: Vercel Deployment (Frontend)

### Step 1: Connect GitHub to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (or email)
3. Click "Import Project"
4. Paste your GitHub repo URL
5. Click "Continue"

### Step 2: Configure Project

1. **Project Name:** `midnight-monk` (auto-filled)
2. **Framework:** React
3. **Root Directory:** `./frontend`
4. Click "Continue"

### Step 3: Add Environment Variables

1. Expand "Environment Variables"
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (we'll get this from Render)
   
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google API key (from Part 4)

3. Click "Deploy"

⏳ Vercel auto-builds and deploys (~2-3 minutes)

### Step 4: Verify Deployment

1. Vercel shows "Congratulations!" with deployment URL
2. Visit your app at `https://midnight-monk-xxx.vercel.app`
3. Verify it loads (will show API error because backend not deployed yet)

---

## Part 6: Render Deployment (Backend)

### Step 1: Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repos

### Step 2: Create Web Service

1. Click "Create +" → "Web Service"
2. Select your GitHub repo (`midnight-monk`)
3. Click "Connect"

### Step 3: Configure Service

1. **Name:** `midnight-monk-backend`
2. **Environment:** Python 3
3. **Root Directory:** `backend`
4. **Build Command:**
   ```
   pip install -r requirements.txt
   ```
5. **Start Command:**
   ```
   gunicorn -w 1 -b 0.0.0.0:$PORT app:app
   ```

### Step 4: Add Environment Variables

1. Scroll to "Environment Variables"
2. Add:
   - **Key:** `MONGO_URI`
   - **Value:** Your MongoDB connection string (from Part 3, Step 5)
   
   - **Key:** `JWT_SECRET`
   - **Value:** Generate random 32-char string
   - Example: `$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')`
   
   - **Key:** `PORT`
   - **Value:** `5000` (Render assigns one, but this is default)

3. Click "Create Web Service"

⏳ Render builds and deploys (~5-10 minutes)

### Step 5: Get Backend URL

1. Once deployed, Render shows your service URL:
   ```
   https://midnight-monk-backend.onrender.com
   ```
2. Copy this URL
3. Go back to Vercel:
   - Settings → Environment Variables
   - Update `VITE_API_URL` with this URL
   - Redeploy (click "Redeploy" in Deployments tab)

---

## Part 7: Test Production Deployment

### Frontend (Vercel)

1. Visit your Vercel app URL
2. Test:
   - Register new customer ✅
   - Login as kitchen admin ✅
   - Place order ✅
   - Verify tracking page loads (may show error if backend slow first time) ✅

### Backend (Render)

1. Visit `https://your-backend.onrender.com/api/kitchens/all`
2. Should return JSON list of kitchens
3. Check Render logs for errors: No 500 errors

### Cross-Domain Testing

1. From Vercel frontend, place order
2. Should successfully create order in MongoDB Atlas
3. Kitchen admin should see order in Render backend
4. Tracking page should show live map

---

## Part 8: Production Monitoring

### Vercel Analytics

1. Go to Vercel dashboard → Your project
2. Analytics tab shows:
   - Page load times
   - Web Vitals (LCP, FID, CLS)
   - Request volume
   - Error rate

**Target Metrics:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

### Render Logs

1. Go to Render dashboard → Your service
2. Logs tab shows real-time backend output
3. Watch for errors during peak hours

**Set up alerts:**
1. Settings → Notifications
2. Email on deploy/failure

### Google Cloud Billing

1. Go to Google Cloud Console → Billing
2. Check usage under "Usage" tab
3. Set budget alert (optional):
   - Click "Budgets & Alerts"
   - Create budget for $10 (safe limit)
   - Get email if exceeds

**Expected monthly cost:** $0 (free tier)

---

## Part 9: Custom Domain Setup

### Using Vercel Domain

1. In Vercel dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `www.midnightmonk.app`)
4. Vercel shows DNS records to add
5. Update your domain registrar DNS
6. Wait 5-30 minutes for propagation

### Update Backend URL

1. After domain is live:
2. Go to Render → Settings
3. Update environment if needed
4. Go to Vercel → Environment Variables
5. Update `VITE_API_URL` to include new domain

---

## Part 10: Scaling Considerations

### Current Free Tier Limits

| Service | Free Tier | Limit | Cost to Upgrade |
|---------|-----------|-------|-----------------|
| Vercel | 100 GB bandwidth | Per month | Included in Pro |
| Render | 750 hours | Per month (then sleeps) | $7/month for always-on |
| MongoDB | 512 MB | Storage | $57/month for 2GB |
| Google Maps | 28,000 requests | Per month | $0.50 per 1000 above |

### When to Upgrade

- **Render:** When you exceed 750 hours/month (24/7 operation) → Upgrade to Pro ($7/month)
- **MongoDB:** When you exceed 512 MB storage → Upgrade to M2 ($15/month, 10 GB)
- **Google Maps:** When exceeding 28,000 requests/month → Keep free (standard pricing applies)

### Optimization Tips

1. **Reduce API calls:**
   - Increase polling interval from 6s to 10s
   - Cache tracking data client-side

2. **Database indexes:**
   - Ensure indexes on `user.mobile`, `kitchen_id`, `status`
   - Check with: `db.orders.getIndexes()`

3. **Image optimization:**
   - Use WebP format for marker icons
   - Compress images < 100KB

4. **CDN for assets:**
   - Vercel automatically serves static files via CDN
   - No additional setup needed

---

## Part 11: Troubleshooting Deployment

### Vercel: Build Fails

**Error:** `VITE_API_URL not found`
**Fix:** Ensure env var exists in Vercel Settings

**Error:** `Cannot find module 'react'`
**Fix:** Check `package.json` exists in `frontend/` folder

### Render: Service Won't Start

**Error:** `ModuleNotFoundError: No module named 'flask'`
**Fix:** Check `requirements.txt` exists in `backend/` folder

**Error:** `Gunicorn error: port already in use`
**Fix:** Use `PORT` environment variable (Render handles this)

### MongoDB: Connection Timeout

**Error:** `MongoClient can't connect`
**Fix:** 
1. Check IP whitelist (0.0.0.0/0 for dev)
2. Verify password doesn't contain special chars that need encoding
3. Check network access in Atlas console

### Google Maps: API Key Invalid

**Error:** `Error: Google Maps authentication failed`
**Fix:**
1. Verify API key in Vercel env vars
2. Check APIs enabled in Google Cloud
3. Verify HTTP referrer restrictions include `*.vercel.app`

---

## Part 12: Rolling Back a Deployment

### Vercel

1. Go to Deployments tab
2. Find previous working version
3. Click "..." → "Redeploy"
4. Confirm redeploy

### Render

1. Go to "Deploy" tab
2. Find previous working build
3. Click "Deploy" to rollback

---

## Checklist Before Going Live

### Code
- [ ] No `console.log()` in production
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] Error messages user-friendly
- [ ] Security checks in place

### Deployment
- [ ] Backend deployed to Render ✅
- [ ] Frontend deployed to Vercel ✅
- [ ] Database set up in MongoDB Atlas ✅
- [ ] Google Maps API key configured ✅
- [ ] Environment variables set in both services ✅
- [ ] Custom domain pointing to Vercel (optional) ✅

### Testing (in production)
- [ ] User can register & login ✅
- [ ] Customer can place order ✅
- [ ] Kitchen admin can accept/update orders ✅
- [ ] Live tracking works with Google Maps ✅
- [ ] Mobile layout responsive ✅
- [ ] No console errors ✅
- [ ] API calls succeed ✅
- [ ] Error handling works (invalid order shows error) ✅

### Monitoring
- [ ] Vercel analytics accessible ✅
- [ ] Render logs accessible ✅
- [ ] Google Cloud billing alerts set ✅
- [ ] Email notifications working ✅

---

## Post-Deployment

### Week 1: Monitoring

1. Check Vercel analytics daily
2. Monitor Render logs for errors
3. Test all 11 scenarios from TESTING.md on production
4. Collect user feedback

### Week 2+: Optimization

1. Analyze slow endpoints (Render logs)
2. Add database indices if needed
3. Cache frequently accessed data
4. Optimize image sizes

### Ongoing Maintenance

1. Monitor Google Cloud API usage (keep under 28,000/month)
2. Check MongoDB storage (currently using < 100 MB)
3. Review error logs weekly
4. Update dependencies monthly

---

## Support & Resources

- **Vercel:** https://vercel.com/docs
- **Render:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Google Maps:** https://developers.google.com/maps
- **Flask:** https://flask.palletsprojects.com
- **React:** https://react.dev

---

**Last Updated:** September 18, 2024
**Deployment Status:** Production Ready ✅
**Estimated Setup Time:** 30-60 minutes
