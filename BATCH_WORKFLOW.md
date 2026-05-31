# CosmoFolio Batch Workflow — Version-Locked Releases

## 🔒 The Rules

1. **Each batch = one stable version** (git tag like `v0.X-batchN`)
2. **Test thoroughly before locking** — once tagged, that version is "frozen"
3. **Never break a locked batch** when working on the next one
4. **If something breaks later** → we can rollback to last known good tag

## 🛠️ Per-Batch Workflow

For every batch we execute these steps:

### Step 1: Plan
- List exact features to build in this batch
- List existing code that will be touched
- List code that MUST NOT change (from previous batches)

### Step 2: Build
- Implement features
- Write code carefully without touching frozen areas

### Step 3: Deploy
- Push to GitHub
- Wait for Render (backend) + Netlify (frontend) auto-deploy

### Step 4: Test
User tests these specific things:
- [ ] New features work as expected
- [ ] Previous batch features still work
- [ ] No console errors
- [ ] No 4xx/5xx from backend

### Step 5: Lock
If tests pass:
```bash
git tag -a v0.X-batchN -m "Batch N: <description>"
git push origin v0.X-batchN
```

If tests fail:
- Fix issues, redeploy, retest
- Don't move to next batch until current is solid

### Step 6: Document
- Update ROADMAP.md with `✅` for completed batch
- Note what was tested

---

## 🆘 Emergency Rollback

If a future batch breaks something:

```bash
# See all versions
git tag -l

# Rollback frontend/backend to last good version
git checkout v0.X-batchN

# Or hard reset main (DESTRUCTIVE - only if needed)
git reset --hard v0.X-batchN
git push origin main --force  # Only if necessary
```

---

## 📊 Version History

| Tag | Batch | Description | Status |
|-----|-------|-------------|--------|
| v0.1-batch0 | 0 | Foundation (Auth, Project Creation, Asset Upload) | 🧪 Testing |
| v0.2-batch1 | 1 | Portfolio Creation Wizard | ⏳ Next |
| v0.3-batch2 | 2 | Portfolio DNA System | ⏳ Planned |
| v0.4-batch3 | 3 | Front Cover Designer | ⏳ Planned |
| ... | ... | ... | ... |

---

## ✅ Current Batch: 0 — Foundation

**What's in this batch:**
- User auth (Firebase)
- Project creation (POST /api/projects with 'portfolio' or 'sheet' type)
- Asset upload (POST /api/projects/{id}/assets/bulk)
- Asset list/delete
- Dashboard with project list
- Redirect to project after creation

**Test checklist:**
- [ ] Login works
- [ ] Sign up works
- [ ] Create portfolio → goes directly to project page
- [ ] Upload a file → shows in asset list
- [ ] Refresh page → assets persist
- [ ] Delete asset → removes from list
- [ ] Create sheet → goes directly to sheet page

**Once all checked → Lock as v0.1-batch0 (already tagged)**
