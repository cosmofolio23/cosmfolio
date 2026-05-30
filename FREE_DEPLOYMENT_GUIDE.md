# COSMFOLIO - FREE DEPLOYMENT GUIDE (Testing & Checking)

Complete guide to deploy CosmoFolio using only free services.

---

## **DEPLOYMENT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────┐
│                    USERS                                 │
└──────────┬──────────────────────────────┬────────────────┘
           │                              │
      Frontend                        Backend
           │                              │
    ┌──────▼─────────┐          ┌────────▼──────────┐
    │  Vercel (Free) │          │ Railway.app (Free)│
    │  - React App   │          │ - FastAPI API     │
    │  - Static Site │          │ - 5GB RAM free    │
    └────────────────┘          └────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Supabase (Free)    │
                              │ - PostgreSQL DB    │
                              │ - Storage (1GB)    │
                              │ - Auth             │
                              └───────────────────┘
```

---

## **STEP 1: PREPARE BACKEND FOR PRODUCTION**

### 1.1 Create Production .env

```bash
cd backend
cp .env.example .env.production
```

**File: `.env.production`**
```env
# PRODUCTION SETTINGS
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
SECRET_KEY=generate_random_64_char_string_with_openssl_rand

# DATABASE (Use Supabase free tier)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI - Use free Replicate
REPLICATE_API_TOKEN=your_replicate_token

# Storage (Supabase Storage - free tier)
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=cosmofolio-assets

# SECURITY
SECURE_COOKIES=true
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true

# CORS (adjust for production domain)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Optional Firebase (if using auth)
FIREBASE_API_KEY=optional

# Replicate (free tier)
REPLICATE_MAX_TIMEOUT=120
```

### 1.2 Create Dockerfile

**File: `backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.3 Create docker-compose.yml (for local testing)

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
    volumes:
      - ./backend:/app
    restart: unless-stopped
```

---

## **STEP 2: DEPLOY BACKEND TO RAILWAY (FREE)**

Railway gives you free tier with generous limits. Perfect for testing!

### 2.1 Sign up to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (easiest)
3. Create new project

### 2.2 Deploy from GitHub

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit - CosmoFolio"
git remote add origin https://github.com/yourusername/cosmfolio.git
git branch -M main
git push -u origin main

# 2. In Railway dashboard:
# - Click "New Project"
# - Select "Deploy from GitHub"
# - Connect your GitHub account
# - Select "cosmfolio" repo
# - Railway auto-detects Python/FastAPI
```

### 2.3 Configure Environment Variables in Railway

In Railway dashboard, add variables:
```
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
REPLICATE_API_TOKEN=...
SECRET_KEY=...
```

### 2.4 Set Build & Deploy Settings

```
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Wait for deployment to complete...**
- You'll get a free URL like: `https://cosmfolio-production.up.railway.app`

---

## **STEP 3: DEPLOY FRONTEND TO VERCEL (FREE)**

Vercel is perfect for React apps. Free tier includes:
- Unlimited deployments
- SSL/HTTPS included
- Custom domains (optional)

### 3.1 Create vercel.json

**File: `frontend/vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite-api-url"
  }
}
```

### 3.2 Sign up to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your project

### 3.3 Deploy

```bash
# Option 1: Deploy from Vercel dashboard
# - Click "Import Project"
# - Select your GitHub repo
# - Select "frontend" folder as root
# - Vercel auto-detects React/Vite

# Option 2: Deploy from CLI
npm install -g vercel
cd frontend
vercel --prod
```

### 3.4 Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://cosmfolio-production.up.railway.app
VITE_APP_URL=https://cosmfolio.vercel.app
```

**Your frontend will be live at:** `https://cosmfolio.vercel.app`

---

## **STEP 4: VERIFY DEPLOYMENT**

### 4.1 Test Backend

```bash
# Health check
curl https://cosmfolio-production.up.railway.app/health

# Expected response:
# {"status":"healthy","service":"ArchPortfolio API"}

# Access Swagger docs
# https://cosmfolio-production.up.railway.app/docs
```

### 4.2 Test Frontend

1. Open `https://cosmfolio.vercel.app` in browser
2. Should load React app
3. Check browser console for API connection

### 4.3 Test API Endpoints

```bash
# Test authentication endpoint
curl -X POST https://cosmfolio-production.up.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'

# Test health
curl https://cosmfolio-production.up.railway.app/health
```

---

## **STEP 5: CONFIGURE SUPABASE FOR PRODUCTION**

### 5.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project (free tier)
3. Get your:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 5.2 Run Database Migrations

```bash
# Connect to your Supabase DB
cd backend

# Run initialization
python run_migrations.py

# This creates:
# - users table
# - projects table
# - assets table
# - portfolios table
# - presentation_sheets table
# - All other required tables
```

### 5.3 Set Up Storage Bucket

```bash
# In Supabase dashboard:
# 1. Go to Storage → New Bucket
# 2. Create bucket: "cosmofolio-assets"
# 3. Make it public
# 4. Add policies for authenticated users
```

---

## **STEP 6: SET UP CI/CD (GITHUB ACTIONS - FREE)**

Automatic deployment on every commit!

### 6.1 Create GitHub Actions Workflow

**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy CosmoFolio

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up -d
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token $VERCEL_TOKEN
```

### 6.2 Add GitHub Secrets

Go to GitHub repo → Settings → Secrets:
1. Add `RAILWAY_TOKEN` (from Railway dashboard)
2. Add `VERCEL_TOKEN` (from Vercel settings)

---

## **STEP 7: MONITORING & LOGS (FREE)**

### 7.1 View Backend Logs

```bash
# Railway CLI
railway logs --follow

# Or in Railway dashboard:
# Project → Service → Logs tab
```

### 7.2 View Frontend Logs

```bash
# Vercel dashboard:
# Project → Deployments → Select deployment → Logs
```

### 7.3 Set Up Error Tracking (Optional)

```bash
# Using Sentry (free tier available)
# 1. Sign up at sentry.io (free)
# 2. Create project for Python
# 3. Add SENTRY_DSN to .env
```

---

## **STEP 8: DOMAIN (OPTIONAL - FREE)**

### Option 1: Use Free Subdomains
- Railway: `yourapp.up.railway.app`
- Vercel: `yourapp.vercel.app`

### Option 2: Custom Domain (Free with Freenom)
1. Go to [freenom.com](https://freenom.com)
2. Register free domain (.tk, .ml, .ga)
3. Point DNS to Railway & Vercel
4. Configure in both dashboards

---

## **QUICK START CHECKLIST**

```
BEFORE DEPLOYMENT:
[ ] Backend .env.production configured
[ ] Dockerfile created and tested locally
[ ] GitHub repo created and code pushed
[ ] Supabase project created
[ ] Environment variables documented

DEPLOYMENT:
[ ] Backend deployed to Railway
[ ] Frontend deployed to Vercel
[ ] Environment variables set in both platforms
[ ] Database migrations run
[ ] API endpoints tested
[ ] Frontend connected to API

POST-DEPLOYMENT:
[ ] Health check passes
[ ] Swagger docs accessible
[ ] Frontend loads
[ ] Basic CRUD operations tested
[ ] Logs monitored
[ ] Error tracking set up (optional)
```

---

## **TESTING YOUR DEPLOYMENT**

### Test Suite

```bash
# 1. Test health endpoint
curl https://YOUR_BACKEND_URL/health

# 2. Test API docs
curl https://YOUR_BACKEND_URL/docs

# 3. Test basic endpoints
curl -X GET https://YOUR_BACKEND_URL/api/auth/tones

# 4. Open frontend
open https://YOUR_FRONTEND_URL

# 5. Create test user (from frontend)
# 6. Upload test image
# 7. Create presentation sheet
# 8. Export PDF
```

---

## **FREE TIER LIMITS**

| Service | Limit | Cost |
|---------|-------|------|
| Railway | 5GB RAM, shared CPU | Free |
| Vercel | 100GB bandwidth | Free |
| Supabase | 500MB DB, 1GB storage | Free |
| Replicate | 25 free API calls/month | Free |
| GitHub Actions | 2,000 minutes/month | Free |

---

## **TROUBLESHOOTING**

### Backend won't start
```bash
# Check logs
railway logs --follow

# Common issues:
# - Missing environment variables
# - Database connection error
# - Port already in use
```

### Frontend can't connect to API
```bash
# Check:
# 1. VITE_API_URL is correct
# 2. Backend is running
# 3. CORS enabled (should be by default)
# 4. No firewall blocking
```

### Database errors
```bash
# Run migrations again
python run_migrations.py

# Check Supabase dashboard for errors
```

---

## **NEXT STEPS**

1. **Deploy backend to Railway** (5 minutes)
2. **Deploy frontend to Vercel** (5 minutes)
3. **Test all endpoints** (10 minutes)
4. **Share your live app!** 🚀

---

## **SUPPORT LINKS**

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- React/Vite Docs: https://vitejs.dev

---

**Created:** 2026-05-30
**For:** CosmoFolio - AI Architecture Portfolio Generator
**Status:** All 8 Phases Complete & Ready for Production Testing
