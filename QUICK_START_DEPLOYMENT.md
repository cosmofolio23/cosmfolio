# 🚀 CosmoFolio - Quick Start Deployment

**Deploy your complete app in 3 steps!**

---

## **STEP 1️⃣: Run Setup Script (5 minutes)**

```bash
bash scripts/setup.sh
```

This will:
- ✅ Install all prerequisites (Node.js, Python, CLI tools)
- ✅ Install dependencies (backend & frontend)
- ✅ Initialize Git repository
- ✅ Create GitHub secrets template

---

## **STEP 2️⃣: Get Your Credentials (10 minutes)**

### **A. Supabase (Free Database)**
1. Go to https://supabase.com
2. Sign up (free) → Create new project
3. Note these:
   - `SUPABASE_URL` (like: `https://xyz.supabase.co`)
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### **B. Replicate (Free LLM - Optional)**
1. Go to https://replicate.com
2. Sign up → Create API token
3. Note your `REPLICATE_API_TOKEN`
   - (Skip if you want to test with mock mode)

### **C. GitHub Repository**
1. Go to https://github.com/new
2. Create new repository: `cosmfolio`
3. Note your username

---

## **STEP 3️⃣: Deploy Everything (15 minutes)**

### **Run the master deployment script:**

```bash
bash scripts/deploy-all.sh
```

The script will prompt for:
- GitHub username
- GitHub repo name
- Supabase URL & keys
- Replicate token (optional)

**Then it will:**
1. ✅ Initialize Git & push to GitHub
2. ✅ Deploy backend to Railway (FREE)
3. ✅ Deploy frontend to Vercel (FREE)
4. ✅ Show you your live URLs

---

## **Your Live App URLs**

After deployment, you'll have:

```
Frontend:  https://cosmfolio.vercel.app
Backend:   https://cosmfolio-xxxx.up.railway.app
Docs:      https://cosmfolio-xxxx.up.railway.app/docs
```

---

## **QUICK VERIFICATION**

### **Check Backend is Live**
```bash
curl https://YOUR_RAILWAY_URL/health
```

Expected response:
```json
{"status": "healthy", "service": "ArchPortfolio API"}
```

### **Check Frontend is Live**
- Open `https://cosmfolio.vercel.app` in browser
- Should load React app

### **Test an API Endpoint**
```bash
curl https://YOUR_RAILWAY_URL/api/auth/ai-tones
```

---

## **COMMANDS REFERENCE**

| Command | What it does |
|---------|------------|
| `bash scripts/setup.sh` | Install everything needed |
| `bash scripts/deploy-all.sh` | Deploy backend + frontend |
| `bash scripts/deploy-backend.sh` | Deploy backend only |
| `bash scripts/deploy-frontend.sh` | Deploy frontend only |

---

## **TROUBLESHOOTING**

### **"Command not found: railway"**
```bash
npm install -g @railway/cli
```

### **"Command not found: vercel"**
```bash
npm install -g vercel
```

### **"Python dependencies failed"**
```bash
cd backend
pip install -r requirements.txt
```

### **"Git not initialized"**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/cosmfolio.git
```

---

## **FREE TIER LIMITS**

| Service | Limit | Cost |
|---------|-------|------|
| Railway | 5GB RAM, shared CPU | FREE |
| Vercel | 100GB bandwidth/mo | FREE |
| Supabase | 500MB DB, 1GB storage | FREE |
| Replicate | 25 API calls/mo | FREE |
| GitHub Actions | 2,000 min/mo | FREE |

**Total cost: $0 for testing & checking!**

---

## **NEXT STEPS AFTER DEPLOYMENT**

1. ✅ Open frontend URL in browser
2. ✅ Create test account
3. ✅ Upload test images
4. ✅ Create presentation sheets
5. ✅ Test AI content generation
6. ✅ Export PDF
7. ✅ Test all features

---

## **AUTOMATIC DEPLOYMENT (Optional)**

After first deployment, set up auto-deployment:

1. Go to GitHub repo → Settings → Secrets
2. Add secrets from `.github/SECRETS_TEMPLATE.md`:
   - `RAILWAY_TOKEN`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

3. Now every `git push` to `main` auto-deploys!

---

## **HELP & DOCS**

- Full guide: `FREE_DEPLOYMENT_GUIDE.md`
- GitHub workflow: `.github/workflows/deploy.yml`
- Backend setup: `backend/.env.example`
- Frontend setup: `frontend/.env.example`

---

## **Support Resources**

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com

---

**Created:** 2026-05-30  
**Status:** All 8 Phases Complete & Deployment Ready  
**Cost:** FREE  
**Time to Deploy:** ~30 minutes
