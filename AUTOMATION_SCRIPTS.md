# 🤖 COSMFOLIO - AUTOMATED DEPLOYMENT SCRIPTS

Complete automation for deploying CosmoFolio to production (FREE).

---

## **📋 Available Scripts**

### **1. Setup Script** 
**Purpose:** Install all prerequisites and dependencies  
**File:** `scripts/setup.sh`  
**Time:** ~5 minutes  

```bash
bash scripts/setup.sh
```

**Does:**
- ✅ Install Node.js, Python, Git (if missing)
- ✅ Install Railway & Vercel CLI
- ✅ Install backend Python dependencies
- ✅ Install frontend npm dependencies
- ✅ Initialize Git repository
- ✅ Create GitHub secrets template

**Run first!** This is one-time setup.

---

### **2. Verification Script**
**Purpose:** Check if everything is ready for deployment  
**File:** `scripts/verify-ready.sh`  
**Time:** ~1 minute  

```bash
bash scripts/verify-ready.sh
```

**Checks:**
- ✅ System requirements (Node, Python, Git)
- ✅ CLI tools installed (Railway, Vercel)
- ✅ Project structure intact
- ✅ Dependencies installed
- ✅ Configuration files present
- ✅ Git repository setup
- ✅ Backend imports correctly
- ✅ Frontend builds successfully

**Output:** Pass/Fail percentage + recommendations

---

### **3. Deploy Backend Script**
**Purpose:** Deploy FastAPI backend to Railway  
**File:** `scripts/deploy-backend.sh`  
**Time:** ~10 minutes  

```bash
bash scripts/deploy-backend.sh
```

**Does:**
1. Checks Railway CLI installed
2. Initializes Git (if needed)
3. Pushes code to GitHub
4. Logs in to Railway
5. Deploys backend
6. Shows backend URL

**Output:**
```
Backend URL: https://cosmfolio-xxxx.up.railway.app
Swagger Docs: https://cosmfolio-xxxx.up.railway.app/docs
```

---

### **4. Deploy Frontend Script**
**Purpose:** Deploy React frontend to Vercel  
**File:** `scripts/deploy-frontend.sh`  
**Time:** ~5 minutes  

```bash
bash scripts/deploy-frontend.sh
```

**Requires:**
- Backend URL (from deploy-backend.sh output)

**Does:**
1. Prompts for backend URL
2. Configures frontend env variables
3. Pushes to GitHub
4. Logs in to Vercel
5. Deploys frontend
6. Shows frontend URL

**Output:**
```
Frontend URL: https://cosmfolio.vercel.app
API URL: https://cosmfolio-xxxx.up.railway.app
```

---

### **5. Deploy All Script (MASTER)**
**Purpose:** Deploy entire app in one command  
**File:** `scripts/deploy-all.sh`  
**Time:** ~20 minutes  

```bash
bash scripts/deploy-all.sh
```

**One-Click Deployment!**

**Does:**
1. Checks all prerequisites
2. Installs missing CLI tools
3. Prompts for configuration:
   - GitHub username & repo
   - Supabase URL & keys
   - Replicate token (optional)
4. Creates production env files
5. Initializes Git & pushes to GitHub
6. Deploys backend to Railway
7. Deploys frontend to Vercel
8. Shows both live URLs

**Recommended for first deployment!**

---

## **🚀 QUICK START WORKFLOW**

### **Option A: Automatic Setup (Recommended)**

```bash
# 1. One-time setup (5 min)
bash scripts/setup.sh

# 2. Verify ready (1 min)
bash scripts/verify-ready.sh

# 3. Deploy everything (20 min)
bash scripts/deploy-all.sh
```

**Total time: ~26 minutes**

### **Option B: Manual Steps**

```bash
# 1. Setup
bash scripts/setup.sh

# 2. Deploy backend
bash scripts/deploy-backend.sh

# 3. Deploy frontend (enter backend URL when prompted)
bash scripts/deploy-frontend.sh
```

**Total time: ~30 minutes**

---

## **📊 Script Dependency Map**

```
setup.sh
  ├─ install Node.js, Python, Git
  ├─ install CLI tools
  └─ initialize git + npm dependencies
       ↓
verify-ready.sh (optional check)
       ↓
deploy-all.sh (Master - does everything)
  ├─ git setup
  ├─ environment config
  ├─ backend deployment
  └─ frontend deployment

OR separately:

deploy-backend.sh
  ├─ git push
  └─ railway deploy
       ↓
deploy-frontend.sh
  ├─ configure env
  ├─ git push
  └─ vercel deploy
```

---

## **🔐 GitHub Secrets (For Auto-Deployment)**

After first deployment, enable auto-deployment on every git push:

```bash
# 1. Get your tokens:
# - Railway Token: https://railway.app/account/tokens
# - Vercel Token: https://vercel.com/account/tokens
# - Vercel Org ID: https://vercel.com/account
# - Vercel Project ID: (from Vercel dashboard)

# 2. Add to GitHub:
# Repo → Settings → Secrets and variables → Actions
# Add: RAILWAY_TOKEN, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

# 3. Every git push now auto-deploys!
git push origin main
```

---

## **📝 Configuration Reference**

### **What Each Script Needs**

| Script | Needs | Creates |
|--------|-------|---------|
| `setup.sh` | Nothing | Node, Python, npm packages |
| `verify-ready.sh` | Nothing | Report only |
| `deploy-backend.sh` | GitHub remote | Backend .env.production |
| `deploy-frontend.sh` | Backend URL | Frontend .env.production |
| `deploy-all.sh` | GitHub username, Supabase credentials | All env files + deploys |

---

## **🆘 Troubleshooting**

### **"Permission denied" on scripts**

```bash
chmod +x scripts/*.sh
```

### **"Command not found: railway"**

```bash
npm install -g @railway/cli
```

### **"Backend deploy fails"**

```bash
cd backend
pip install -r requirements.txt
python -c "from main import app"
```

### **"Frontend build fails"**

```bash
cd frontend
npm install
npm run build
```

### **"Git remote not configured"**

```bash
git remote add origin https://github.com/USERNAME/cosmfolio.git
git branch -M main
git push -u origin main
```

---

## **📊 Deployment Status**

Each script will show:

```
╔═══════════════════════════════════════╗
║     DEPLOYMENT COMPLETE!              ║
╚═══════════════════════════════════════╝

✓ Backend: https://cosmfolio-prod.railway.app
✓ Frontend: https://cosmfolio.vercel.app
✓ Database: Supabase (configured)
✓ Docs: https://cosmfolio-prod.railway.app/docs
```

---

## **⏱️ Time Estimates**

| Task | Time |
|------|------|
| Run `setup.sh` | ~5 min |
| Run `verify-ready.sh` | ~1 min |
| Run `deploy-all.sh` | ~20 min |
| **Total First Deploy** | **~26 min** |
| Subsequent Deploys | ~5 min |

---

## **✅ Checklist Before Deployment**

- [ ] Run `bash scripts/setup.sh`
- [ ] Run `bash scripts/verify-ready.sh` (100% pass rate)
- [ ] Have Supabase credentials ready
- [ ] Have GitHub username ready
- [ ] Have Replicate token (optional)
- [ ] Run `bash scripts/deploy-all.sh`
- [ ] Test frontend URL in browser
- [ ] Test backend health endpoint
- [ ] Create test account
- [ ] Upload test image
- [ ] Test all features

---

## **📚 Documentation**

- **Detailed Guide:** `FREE_DEPLOYMENT_GUIDE.md`
- **Quick Start:** `QUICK_START_DEPLOYMENT.md`
- **This File:** `AUTOMATION_SCRIPTS.md`

---

## **🎯 What's Automated**

✅ System setup (prerequisites)  
✅ Dependency installation  
✅ Git initialization & push  
✅ Environment configuration  
✅ Backend deployment  
✅ Frontend deployment  
✅ URL generation  
✅ Health verification  
✅ CI/CD setup (optional)  

---

## **Next Step**

```bash
bash scripts/setup.sh
```

Then:

```bash
bash scripts/deploy-all.sh
```

Done! Your app is live. 🚀

---

**Created:** 2026-05-30  
**Status:** All 8 Phases Complete  
**Cost:** FREE  
**Automation Level:** 100%
