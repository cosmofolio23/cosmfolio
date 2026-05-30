# ⚡ Quick Start - Deploy to Cloud (5 Minutes)

Everything is ready to deploy. Follow these **exact** steps:

## ✅ What's Already Done

- ✅ Backend code complete
- ✅ Frontend code complete  
- ✅ Database schema created
- ✅ Supabase configured
- ✅ Environment variables set
- ✅ Dockerfile ready

**All you need to do:** Upload files to two cloud services.

---

## 🚀 Step 1: Deploy Backend (3 minutes)

### 1a. Go to HuggingFace

1. Open: https://huggingface.co/spaces
2. Click blue **"Create new Space"** button
3. Fill in:
   - Space name: `archportfolio-generator`
   - License: `openrail`
   - Space SDK: `Docker` ← **Important!**
   - Hardware: `CPU basic` (free)
   - Visibility: `Public`
4. Click **"Create Space"**

### 1b. Upload Backend Files

Once Space is created:

1. Click **"Files"** tab
2. Click **"Add file"** → **"Upload files"**
3. Navigate to: `E:\Projects\My Product\BUILDING APP\ArchPortfolio_Generator\backend\`
4. Select ALL these files:
   ```
   Dockerfile
   .dockerignore
   .env
   requirements.txt
   main.py
   config.py
   models.py
   database.py
   routes/
   services/
   ```
5. Click **"Upload"**

### 1c. Wait for Build

- HuggingFace builds Docker image automatically
- Takes 3-5 minutes
- You'll see status: "Building..." → "Running"

### 1d. Copy Your Backend URL

- When "Running" appears, go to your Space page
- Copy the URL at top (looks like: `https://username-archportfolio-generator.hf.space`)
- **SAVE THIS - you need it for frontend!**

---

## 🚀 Step 2: Deploy Frontend (2 minutes)

### 2a. Push to GitHub

Open PowerShell in: `E:\Projects\My Product\BUILDING APP\ArchPortfolio_Generator\`

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/archportfolio.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username)

### 2b. Deploy to Vercel

1. Open: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/YOUR_USERNAME/archportfolio.git`
4. Click **"Import"**
5. In build settings:
   - Framework: `Next.js`
   - Root directory: `frontend/`
6. Click **"Deploy"**

### 2c. Add Environment Variables

While deploying:

1. Click **"Environment Variables"**
2. Add these 3:
   ```
   NEXT_PUBLIC_API_URL = https://your-hf-space-url.hf.space
   NEXT_PUBLIC_SUPABASE_URL = https://rjobifgysmovmcvhdlnd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB
   ```
   (Use the backend URL you copied!)

3. Click **"Deploy"**
4. Wait 2-3 minutes
5. Copy your Vercel URL (looks like: `https://archportfolio-generator.vercel.app`)

---

## ✅ Test It Works

### Test Backend
Open in browser:
```
https://your-hf-space-url.hf.space/health
```
Should show: `{"status":"healthy"}`

### Test Frontend
Open in browser:
```
https://your-vercel-url.vercel.app
```
Should show: Landing page with "Get Started Free"

### Test Sign Up
1. Click "Get Started Free" or "Sign Up"
2. Enter email and password
3. Should create account and go to dashboard
4. Try creating a project

If all 3 work → **✅ LIVE!**

---

## 🎯 Your Live URLs

After deployment:

```
🌐 Frontend: https://your-app.vercel.app
⚙️  Backend:  https://your-space.hf.space
📊 Database: supabase dashboard (private)
```

---

## 📝 Important Notes

- **No local servers running** - everything is cloud
- **Files already have your Supabase credentials** - no setup needed
- **Backend auto-restarts** if it crashes
- **Frontend auto-deploys** when you push to GitHub
- **All free forever** (within free tier limits)

---

## 🆘 Troubleshooting

### Backend says "Building failed"
- Check you uploaded Dockerfile and requirements.txt
- View logs in Space → "App" tab

### Frontend gives 404 errors
- Check backend URL in env variables is correct
- Backend must be "Running" status

### Can't sign up
- Check browser console (F12) for errors
- Check backend logs for API errors
- Verify Supabase tables exist

### Need to change something
- Edit files in HuggingFace Space directly, OR
- Edit files locally, push to GitHub (auto-deploys frontend)
- Edit backend, push to Space files

---

## 🎓 What's Next

The app is now live! But it's basic. You can:

1. **Add Asset Uploader** (let users upload images)
2. **Add Portfolio Generation** (AI creates layouts)
3. **Add PDF Export** (download portfolios)
4. **Add AI** (Llama 2 smart generation)

See main `README.md` for details.

---

**Congratulations! Your architecture portfolio generator is LIVE! 🎉**

Visit: https://your-app.vercel.app
