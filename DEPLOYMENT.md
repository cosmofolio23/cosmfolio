# Cloud Deployment Guide

Deploy ArchPortfolio Generator completely to the cloud - **FREE**.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Your Users                                              │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼─────┐                   ┌─────▼──────┐
    │ Frontend  │                   │  Backend   │
    │ (Vercel)  │────────────────►  │(HF Spaces) │
    └──────────┘                    └─────┬──────┘
         │                                │
         │                          ┌─────▼─────────┐
         │                          │   Supabase    │
         └──────────────────────────► (PostgreSQL)  │
                                    └───────────────┘
```

---

## Part 1: Deploy Backend to HuggingFace Spaces

### Prerequisites
- HuggingFace account (free at huggingface.co)
- Backend files ready with Dockerfile

### Steps

1. **Go to HuggingFace Spaces**
   - Visit: https://huggingface.co/spaces
   - Click: "Create new Space"

2. **Configure Space**
   - Space name: `archportfolio-generator`
   - License: `openrail`
   - Space SDK: `Docker`
   - Space hardware: `CPU basic` (free)
   - Visibility: `Public`
   - Click: "Create Space"

3. **Upload Backend Files**
   - Go to your new Space
   - Click: "Files" tab
   - Upload these files:
     - `Dockerfile`
     - `requirements.txt`
     - `main.py`
     - `config.py`
     - `models.py`
     - `database.py`
     - `.env` (your configured one)
     - `routes/` folder (all files)
     - `services/` folder (all files)

4. **Wait for Build**
   - HuggingFace will build Docker image
   - Should take 3-5 minutes
   - Status will show "Building..." then "Running"

5. **Get Your Backend URL**
   - Once running, copy the Space URL
   - Should look like: `https://username-archportfolio-generator.hf.space`
   - **Keep this URL - you'll need it for frontend!**

6. **Test Backend**
   - Visit: `https://your-space-url/docs`
   - Should see Swagger API documentation
   - Try: GET `/health` → should return `{"status": "healthy"}`

---

## Part 2: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub account with your repo (or push to GitHub)

### Option A: Using Git (Recommended)

1. **Push to GitHub**
   ```bash
   cd E:\Projects\My Product\BUILDING APP\ArchPortfolio_Generator
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/archportfolio.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to: https://vercel.com/new
   - Click: "Import Git Repository"
   - Paste your GitHub repo URL
   - Click: "Import"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to: Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-space-url.hf.space
     NEXT_PUBLIC_SUPABASE_URL=https://rjobifgysmovmcvhdlnd.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB
     ```
   - Click: "Save"

4. **Deploy**
   - Click: "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://your-app.vercel.app`

### Option B: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**
   - Link to Vercel account? → Yes
   - Set up and deploy? → Yes
   - Use existing project? → No
   - Project name? → `archportfolio-generator`
   - Directory? → `./` (current)

4. **Add Environment Variables**
   - In Vercel dashboard
   - Settings → Environment Variables
   - Add the 3 variables above

---

## Part 3: Test Everything

### 1. Test Backend
```bash
curl https://your-space-url/health
```
Should return: `{"status":"healthy","service":"ArchPortfolio API"}`

### 2. Test Frontend
- Visit: `https://your-app.vercel.app`
- Should see landing page with "Get Started Free" button

### 3. Test Sign Up Flow
1. Click "Sign Up"
2. Create account
3. Should redirect to dashboard
4. Should see "No projects yet"

### 4. Test Project Creation
1. Click "New Project"
2. Enter project name
3. Should appear in list

If all 4 work → **🎉 You're live!**

---

## Part 4: Update Environment URLs

After deployment, update these:

### Backend
File: `backend/.env`
```
ALLOWED_ORIGINS=["https://your-app.vercel.app"]
```

### Frontend
File: `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=https://your-space-url.hf.space
```

Redeploy both services.

---

## URLs Summary

After deployment, you'll have:

```
Frontend (Vercel):   https://archportfolio-generator.vercel.app
Backend (HF Spaces): https://username-archportfolio-generator.hf.space
Database (Supabase): https://rjobifgysmovmcvhdlnd.supabase.co
```

---

## Monitoring & Maintenance

### View Backend Logs
- HuggingFace Space → "Logs" tab
- Shows all API errors and requests

### View Frontend Logs
- Vercel Dashboard → "Deployments" → "Logs"
- Shows build and runtime errors

### Redeploy
- **Backend**: Push changes to Space's files
- **Frontend**: Push to GitHub (auto-deploys)

---

## Troubleshooting

### Backend shows "Building failed"
- Check Dockerfile syntax
- Check requirements.txt has all dependencies
- View logs in Space

### Frontend gives 404 errors
- Check `NEXT_PUBLIC_API_URL` is correct
- Backend must be running
- Check browser console for errors

### Database connection errors
- Verify Supabase credentials in .env
- Check Supabase tables exist (run SQL schema)
- Check internet connection

### CORS errors
- Backend `.env` → `ALLOWED_ORIGINS` includes your Vercel URL
- Frontend `.env` → Correct backend URL
- Redeploy both

---

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| HuggingFace Spaces | Free GPU (CPU) | $0 |
| Vercel | Free | $0 |
| Supabase | Free (500MB) | $0 |
| **Total** | | **$0/month** |

---

## Next Steps

Once deployed:
1. **Build Asset Uploader UI** (Task #3)
2. **Add PDF Export** (Task #4)
3. **Integrate Llama 2 AI** (Task #5)

---

## Support

**Common Issues:**
- See "Troubleshooting" section above
- Check logs in HuggingFace Space and Vercel
- Verify all environment variables are set

**Questions:**
- Check API docs: `https://your-backend-url/docs`
- Check database: Supabase dashboard

---

**You're all set for cloud deployment! 🚀**
