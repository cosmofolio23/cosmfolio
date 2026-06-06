# CosmoFolio Persistence Testing Guide

**Status:** ✅ Deployed (2026-06-06)  
**Backend:** https://cosmfolio-backend.onrender.com  
**Frontend:** https://cosmfolio-tan.netlify.app

---

## What We Built

### Features (Just Added)
- **139 Parametric Layouts** — searchable gallery with categories + visual thumbnails
- **Real Image Uploads** → Supabase Storage (returns public URLs, not browser blobs)
- **Autosave** — 1.5s debounce, saves full document as JSON
- **Reopen Work** — dashboard Edit button or `?project=<id>` parameter
- **Error Handling** — autosave/upload failures shown in UI (not silent)
- **Unsaved Changes Warning** — beforeunload prevents accidental loss

### New Endpoints
```
PUT  /api/projects/{id}/document        — Save document
GET  /api/projects/{id}/document        — Load document
POST /api/projects/{id}/document/health — Test storage health
POST /api/projects/{id}/assets          — Upload image (now returns public URL)
```

---

## 🧪 Quick Test (5 minutes)

### Step 1: Open the Editor
Navigate to any template:
```
https://cosmfolio-tan.netlify.app/dashboard/templates/{TEMPLATE_ID}/editor
```

Replace `{TEMPLATE_ID}` with any template ID from the templates list.

### Step 2: Upload an Image
1. Click any empty image region (or "+ IMAGE" button)
2. Select a JPG or PNG from your computer (any size, 100KB-100MB)
3. **Watch for:**
   - ⏳ Spinner appears while uploading
   - ✓ Image loads (verifying public URL works)
   - ✓ "Saving..." appears in toolbar
   - ✓ "✓ Saved" shows after 1.5 seconds

### Step 3: Edit Text
1. Click the title block
2. Change it to something like "My Architecture"
3. **Watch for:**
   - ⏳ "Saving..." appears in toolbar
   - ✓ "✓ Saved" shows green after ~1.5 seconds

### Step 4: Reload (Hard Refresh)
1. Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
2. Wait for page to reload
3. **Verify:**
   - ✓ Your title text is still there
   - ✓ Your image is still there (with public URL)
   - ✓ The layout you chose is still active

### Step 5: Reopen from Dashboard
1. Close the editor (go back)
2. Navigate to **Dashboard** (`/dashboard`)
3. Find your portfolio in the project list
4. Click the **✏️ Edit** button
5. **Verify:**
   - ✓ Editor reopens
   - ✓ Title, image, layout all match what you saved

---

## 🔍 What to Check (DevTools)

### Network Tab
Open **DevTools** (F12) → **Network** tab:

**When you edit text:**
- Look for: `PUT /api/projects/...` requests
- Should see: `{"ok": true, "url": "..."}`
- Status: **200 OK**

**When you upload an image:**
- Look for: `POST /api/projects/.../assets`
- Should see: Response with `"url": "https://..."` (public URL from Supabase)
- Status: **200 OK**

**If errors appear:**
- Status `401` → Auth token expired (refresh page)
- Status `413` → File too large (>100MB)
- Status `400` → Invalid file format
- Status `503` → Storage bucket issue (report to dev)

### Console Tab
- Should be **clean** (no red errors)
- You may see `console.log` messages like `Autosave failed: ...`
- Those are normal; status indicator will show ✗ Error

---

## ⚠️ What Might Break

### Storage Bucket Not Configured
**Symptom:** "Saving..." never becomes "✓ Saved"

**Check:**
1. Open DevTools → Network tab
2. Edit some text
3. Look for PUT `/document` request
4. Check response: is it an error?

**If error:**
```
Supabase > Storage > Buckets > "assets"
Is it public? Does it allow application/json?
```

**Fix:** Tell dev to create a `documents` bucket or allow JSON on `assets`.

### Auth Token Expired
**Symptom:** Upload fails with 401 error

**Fix:** Refresh page (`Ctrl+R`), you'll be logged back in.

### File Too Large
**Symptom:** Upload shows error "File too large (XMB). Max 100MB."

**Fix:** Reduce image size using an image editor.

### Network Timeout
**Symptom:** "Saving..." spins forever

**Check:**
- Refresh the page (resets the autosave)
- Check your internet connection
- Try again

---

## 📋 Checklist

- [ ] Can upload an image
- [ ] Image persists after refresh
- [ ] Can edit title, see "Saving... / ✓ Saved"
- [ ] Can reopen work via dashboard Edit button
- [ ] Toolbar shows save status clearly
- [ ] No red errors in console
- [ ] No silent failures (status always visible)

---

## 📞 If Something Fails

Report:
1. **What did you do?** (e.g., "uploaded a 5MB PNG")
2. **What happened?** (e.g., "spinner appeared, then image broke")
3. **DevTools error:** Copy the PUT/POST response from Network tab
4. **Console error:** Copy any red text from Console tab
5. **Status:** Does toolbar show ✗ Error or did it fail silently?

---

## 🎯 Success = All This Works

✓ Upload image → image loads with public URL  
✓ Edit text → "Saving..." / "✓ Saved" appears  
✓ Refresh page → content persists  
✓ Reopen via Edit button → everything is there  
✓ Error state visible (not silent failures)  
✓ No broken images or 404s

**If all pass:** Persistence is production-ready! 🚀

---

## Next Steps After Testing

- [ ] **Block Reordering** — Add ↑↓ buttons to move blocks
- [ ] **PDF Export** — Wire Batch 11 PDF service to editor
- [ ] **Public Share Links** — Add share modal
- [ ] **Design Packs** — Let users customize colors/fonts
- [ ] **Undo/Redo** — Ctrl+Z support

