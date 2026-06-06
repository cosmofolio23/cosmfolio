# Render Backend Deployment Guide

## 🚀 Quick Deploy to Render

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Sign in (or create account - free)
3. Click "New +" → "Web Service"

### Step 2: Connect Your GitHub Repository
1. Select "GitHub" as the deployment option
2. Search for repository: `cosmfolio`
3. Click "Connect"
4. Select branch: `main`
5. Click "Create Web Service"

### Step 3: Configure the Service

**Name:** `cosmofolio-backend`

**Environment:** `Python 3.12`

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Root Directory:** `backend`

### Step 4: Add Environment Variables

Click "Add Environment Variable" and add these (copy from your Vercel backend settings):

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://rjobifgysmovmcvhdlnd.supabase.co` |
| `SUPABASE_ANON_KEY` | *(copy from Vercel)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(copy from Vercel)* |
| `REPLICATE_API_TOKEN` | *(copy from Vercel)* |

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. You'll see the live URL: `https://cosmofolio-backend-*.onrender.com`

---

## 📝 To Get Environment Variable Values from Vercel:

```bash
cd backend && vercel env ls
```

This will show all the encrypted variables. You can also get them from:
- Vercel Dashboard → Settings → Environment Variables

---

## ✅ Verify Deployment

Test the health endpoint:
```bash
curl https://your-render-url.onrender.com/health
```

Should return:
```json
{"status":"ok","service":"CosmoFolio Backend"}
```

Test templates endpoint:
```bash
curl https://your-render-url.onrender.com/api/templates/portfolios?limit=3
```

Should return template data (if Supabase connected properly)

---

## 🔄 Update Frontend with New Backend URL

Once you have the Render URL, send it to me and I will:
1. Update frontend environment variable
2. Redeploy frontend to Vercel
3. Test all 14 batches end-to-end

---

## 📊 Expected Timeline

- Render deployment: 2-3 minutes
- Frontend redeploy: 2-3 minutes
- Testing: 5 minutes
- **Total: ~10 minutes to full functionality**

---

## 🎯 After Deployment

Your architecture will be:
```
Frontend: Vercel (cosmofolio-frontend-*.vercel.app)
Backend:  Render (cosmofolio-backend-*.onrender.com)
Database: Supabase (managed PostgreSQL)
```

All 14 batches will be fully functional! ✨

---

## 🆘 Troubleshooting

**If deployment fails:**
- Check that `requirements.txt` exists in `/backend`
- Check that `main.py` exists in `/backend`
- Verify environment variables are set correctly
- Check Render logs for detailed error messages

**If health check passes but /api/templates returns 404:**
- Verify SUPABASE_* environment variables are correct
- Check that database tables exist (they should)
- Verify imports work locally: `cd backend && python -c "from main import app"`

---

**Ready to deploy?**
1. Follow the steps above
2. Get your Render URL: `https://cosmofolio-backend-*.onrender.com`
3. Send it to me
4. I'll update Vercel and test everything

Let's go! 🚀
