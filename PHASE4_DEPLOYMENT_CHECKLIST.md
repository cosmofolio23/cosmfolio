# ✅ Phase 4 Deployment Checklist

Use this checklist to deploy Phase 4 to your Supabase + Railway stack.

---

## PRE-DEPLOYMENT (15 minutes)

### Environment Setup
- [ ] Verify `SUPABASE_URL` is set in `.env`
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- [ ] Verify `SUPABASE_ANON_KEY` is set in `.env` (backup)
- [ ] Test Supabase connection: `python -c "from database import supabase; print('OK' if supabase else 'FAILED')"`

### Code Verification
- [ ] No syntax errors: `python -m py_compile backend/routes/templates.py`
- [ ] No syntax errors: `python -m py_compile backend/models.py`
- [ ] No import errors: `python -c "from routes import templates"`
- [ ] main.py includes template routes

### File Locations
- [ ] `backend/routes/templates.py` exists (317 lines)
- [ ] `backend/migrations/001_create_template_tables.sql` exists
- [ ] `backend/scripts/import_templates.py` exists
- [ ] `templates_library/templates.json` exists (73 templates)
- [ ] `sheets_library/sheets.json` exists (76 templates)

---

## STEP 1: Database Migration (10 minutes)

### Create Tables
- [ ] Open Supabase dashboard
- [ ] Go to "SQL Editor"
- [ ] Click "New Query"
- [ ] Copy contents of `backend/migrations/001_create_template_tables.sql`
- [ ] Paste into editor
- [ ] Click "Run"
- [ ] Verify: No errors shown

### Verify Tables Created
- [ ] Go to "Table Editor"
- [ ] See `portfolio_templates` table
- [ ] See `sheet_templates` table
- [ ] See `template_compatibility` table
- [ ] All tables have correct columns

### Verify Views Created (Optional)
- [ ] In SQL Editor, run: `SELECT * FROM portfolio_templates_summary LIMIT 1;`
- [ ] Should return results
- [ ] Run: `SELECT * FROM sheet_templates_summary LIMIT 1;`
- [ ] Should return results

### Verify Indexes Created (Optional)
- [ ] In Supabase Table Editor, click `portfolio_templates`
- [ ] Go to "Indexes" tab
- [ ] Should see indexes on: category, source
- [ ] Click `sheet_templates`
- [ ] Should see indexes on: sheet_type, category, format

---

## STEP 2: Import Templates (5 minutes)

### Run Import Script
```bash
cd backend
python scripts/import_templates.py
```

Expected output:
```
============================================================
IMPORTING PORTFOLIO TEMPLATES
============================================================
[OK] Found templates.json at: ...
[OK] Loaded 73 templates from JSON
[OK] tpl_001    Nordic Minimal                           - SUCCESS
[OK] tpl_002    Zen White                                - SUCCESS
...
[SUMMARY] Portfolio Templates
  Imported: 73
  Errors:   0
  Total:    73

============================================================
IMPORTING SHEET TEMPLATES
============================================================
[OK] Found sheets.json at: ...
[OK] Loaded 76 templates from JSON
[OK] sht_001    Concept Sheet                            - SUCCESS
...
[SUMMARY] Sheet Templates
  Imported: 76
  Errors:   0
  Total:    76

============================================================
IMPORT COMPLETE
============================================================
Portfolio Templates: ✅ OK
Sheet Templates:     ✅ OK
Finished: 2026-06-05T...
```

### Checklist for Import
- [ ] Script ran without errors
- [ ] 73 portfolio templates imported
- [ ] 76 sheet templates imported
- [ ] No "ERROR" messages in output
- [ ] "IMPORT COMPLETE" shows both OK

### Verify Import Success
```bash
# Count portfolio templates
curl http://localhost:8000/api/templates/stats | grep portfolio_templates

# Should show: "portfolio_templates": 73
```

- [ ] portfolio_templates count = 73
- [ ] sheet_templates count = 76

---

## STEP 3: Backend Deployment (5 minutes)

### Code Changes
- [ ] `backend/routes/templates.py` added
- [ ] `backend/models.py` updated (+14 models)
- [ ] `backend/main.py` updated (1 line: import templates)

### Deploy to Railway
```bash
git add backend/routes/templates.py
git add backend/models.py
git add backend/main.py
git commit -m "Phase 4: Add template API endpoints"
git push origin main
```

- [ ] Git commit created
- [ ] Changes pushed to GitHub
- [ ] Railway auto-deploy triggered
- [ ] Check Railway dashboard for deployment status
- [ ] Deployment shows "Success"

### Verify Deployment
- [ ] Backend URL: https://cosmofolio-production.up.railway.app (or your URL)
- [ ] Check health: `curl https://[your-api]/health`
- [ ] Should return: `{"status":"ok","service":"cosmfolio-backend"}`

---

## STEP 4: Test API Endpoints (10 minutes)

### Test Portfolio Templates
```bash
# Get all templates
curl -X GET "http://localhost:8000/api/templates/portfolios?limit=5"
```
- [ ] Returns 200 status
- [ ] Shows 5 portfolio templates
- [ ] Each template has: id, name, category, colors, fonts

```bash
# Get specific template
curl -X GET "http://localhost:8000/api/templates/portfolios/tpl_061"
```
- [ ] Returns 200 status
- [ ] Template name is "Museum"
- [ ] Has all fields: colors, fonts, layouts, placeholders

```bash
# Get categories
curl -X GET "http://localhost:8000/api/templates/portfolios/categories"
```
- [ ] Returns 200 status
- [ ] Returns list of 11 categories
- [ ] Includes: Minimalist, Contemporary, Brutalist, etc.

### Test Sheet Templates
```bash
# Get all sheet templates
curl -X GET "http://localhost:8000/api/templates/sheets?limit=5"
```
- [ ] Returns 200 status
- [ ] Shows 5 sheet templates

```bash
# Filter by type
curl -X GET "http://localhost:8000/api/templates/sheets?sheet_type=concept&limit=5"
```
- [ ] Returns 200 status
- [ ] All returned templates have sheet_type = "concept"

```bash
# Get sheet types
curl -X GET "http://localhost:8000/api/templates/sheets/types"
```
- [ ] Returns 200 status
- [ ] Returns list of types: concept, plan, section, elevation, etc.

### Test Statistics
```bash
# Get stats
curl -X GET "http://localhost:8000/api/templates/stats"
```
- [ ] Returns 200 status
- [ ] portfolio_templates = 73
- [ ] sheet_templates = 76
- [ ] total_templates = 149

### Test Health
```bash
# Check health
curl -X GET "http://localhost:8000/api/templates/health"
```
- [ ] Returns 200 status
- [ ] status = "ok"
- [ ] portfolio_templates = "accessible"
- [ ] sheet_templates = "accessible"

---

## STEP 5: Database Verification (5 minutes)

### Count Records
In Supabase SQL Editor:
```sql
SELECT COUNT(*) as portfolio_count FROM portfolio_templates;
SELECT COUNT(*) as sheet_count FROM sheet_templates;
```

- [ ] portfolio_templates = 73
- [ ] sheet_templates = 76

### Verify Data Quality
```sql
-- Check all templates have required fields
SELECT COUNT(*) as missing_colors 
FROM portfolio_templates 
WHERE colors IS NULL;

SELECT COUNT(*) as missing_fonts 
FROM portfolio_templates 
WHERE fonts IS NULL;
```

- [ ] No missing colors (should be 0)
- [ ] No missing fonts (should be 0)

### Check Sample Records
```sql
SELECT id, name, category FROM portfolio_templates LIMIT 5;
SELECT id, name, sheet_type FROM sheet_templates LIMIT 5;
```

- [ ] Portfolio templates show: tpl_001, tpl_002, etc.
- [ ] Sheet templates show: sht_001, sht_002, etc.
- [ ] Categories are present and non-null
- [ ] Sheet types are present and non-null

---

## STEP 6: Production Readiness (5 minutes)

### Code Quality
- [ ] No console.logs or debug statements
- [ ] Error handling is comprehensive
- [ ] All endpoints have docstrings
- [ ] No hardcoded values
- [ ] No development credentials in code

### API Quality
- [ ] All endpoints return proper HTTP status codes
- [ ] Error responses include detail messages
- [ ] Response models are typed (Pydantic)
- [ ] Pagination works correctly
- [ ] Filtering works correctly

### Documentation
- [ ] `PHASE4_IMPLEMENTATION.md` exists
- [ ] `PHASE4_API_DOCUMENTATION.md` exists
- [ ] `PHASE4_COMPLETE_SUMMARY.md` exists
- [ ] Code has docstrings
- [ ] README updated (if applicable)

### Monitoring
- [ ] Check Railway logs: `railway logs`
- [ ] No errors in logs
- [ ] API responds quickly (< 200ms)
- [ ] Database queries are fast

---

## STEP 7: Frontend Preparation (5 minutes)

### Update Frontend Routes
Add to your next.js app:

- [ ] Create page: `/dashboard/templates/portfolios`
- [ ] Create page: `/dashboard/templates/sheets`
- [ ] Create component: `TemplateGrid`
- [ ] Create component: `TemplateModal`

### API Integration Setup
- [ ] Add API client method: `getPortfolioTemplates()`
- [ ] Add API client method: `getSheetTemplates()`
- [ ] Add API client method: `getTemplateStats()`
- [ ] Test API calls in browser console

### Environment Configuration
- [ ] Add to `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000` (dev)
- [ ] Add to production: `NEXT_PUBLIC_API_URL=https://[your-api]` (prod)
- [ ] Verify API calls work from frontend

---

## FINAL VERIFICATION (2 minutes)

### Health Check
```bash
# All systems go?
curl http://localhost:8000/api/templates/health
```

- [ ] Status: ok
- [ ] portfolio_templates: accessible
- [ ] sheet_templates: accessible

### Quick API Smoke Test
```bash
# Portfolio count
curl -s http://localhost:8000/api/templates/stats | grep portfolio_templates

# Sheet count  
curl -s http://localhost:8000/api/templates/stats | grep sheet_templates
```

- [ ] Portfolio templates = 73
- [ ] Sheet templates = 76

### Database Smoke Test
```bash
# Login to Supabase
# Check portfolio_templates table: 73 rows
# Check sheet_templates table: 76 rows
```

- [ ] 73 portfolio templates visible in Supabase
- [ ] 76 sheet templates visible in Supabase

---

## ROLLBACK PLAN (If Needed)

If something goes wrong:

### Option 1: Revert Code
```bash
git revert HEAD
git push origin main
# Railway will auto-deploy previous version
```

### Option 2: Reset Database
```bash
# In Supabase SQL Editor, drop tables:
DROP TABLE template_compatibility;
DROP TABLE sheet_templates;
DROP TABLE portfolio_templates;
DROP VIEW portfolio_templates_summary;
DROP VIEW sheet_templates_summary;

# Then re-run migration SQL
```

### Option 3: Check Logs
```bash
# Railway logs
railway logs -f

# Look for error messages
# Check database connection string
# Verify SUPABASE_KEY is correct
```

---

## TROUBLESHOOTING

### Database Connection Error
```
"Supabase not initialized" or "Connection refused"
```
**Solution**: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`

### Import Script Not Finding Files
```
"templates.json not found"
```
**Solution**: Check file paths in import script, move files if needed

### API Returns 404 on Endpoints
```
"404 not found" on /api/templates/...
```
**Solution**: Check main.py includes template routes, restart backend

### Templates Not Showing in Database
```
"0 rows" when querying templates
```
**Solution**: Re-run import script, check for error messages

### Slow Queries
```
GET requests taking > 1 second
```
**Solution**: Check if indexes created, verify database connection speed

---

## SUCCESS CRITERIA

- [ ] All 3 database tables created
- [ ] 73 portfolio templates imported
- [ ] 76 sheet templates imported
- [ ] All 12 API endpoints responding (200 status)
- [ ] No database errors in logs
- [ ] No API errors in responses
- [ ] All data properly stored and queryable
- [ ] Frontend can call API successfully

---

## POST-DEPLOYMENT

Once deployment is complete:

1. **Celebrate!** 🎉 Phase 4 is live
2. **Notify team** that templates are now available
3. **Start Phase 5** - Build template gallery frontend
4. **Monitor** API performance in first 24 hours
5. **Gather feedback** from early users

---

## ESTIMATED TIME

| Step | Time | Status |
|------|------|--------|
| Pre-deployment | 15 min | ⏳ |
| Database Migration | 10 min | ⏳ |
| Template Import | 5 min | ⏳ |
| Backend Deployment | 5 min | ⏳ |
| API Testing | 10 min | ⏳ |
| Database Verification | 5 min | ⏳ |
| Production Readiness | 5 min | ⏳ |
| Frontend Preparation | 5 min | ⏳ |
| Final Verification | 2 min | ⏳ |
| **TOTAL** | **~1 hour** | |

---

## NEXT STEPS

After Phase 4 is deployed:

1. **Phase 5**: Build template gallery UI
   - Portfolio template browse page
   - Sheet template browse page
   - Filtering and search
   - Integration with portfolio builder

2. **Phase 6**: Build sheet composer v2
   - Sheet type selector
   - Content zone editor
   - File upload
   - Style switching

3. **Phase 7**: Deploy to production
   - Full user launch
   - Marketing
   - User feedback loop

---

## CONTACT & SUPPORT

If you have questions:
- Check `PHASE4_IMPLEMENTATION.md` for setup help
- Check `PHASE4_API_DOCUMENTATION.md` for API details
- Check code comments for implementation details

---

**Status**: 🟢 Ready to deploy  
**Confidence**: Very High  
**Estimated Duration**: ~1 hour  

**Let's deploy Phase 4!** 🚀
