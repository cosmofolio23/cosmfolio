# 🚀 CosmoFolio Antigravity Setup Guide

## Quick Start for Antigravity Integration

### Step 1: Prepare Data in Supabase

#### Option A: Use Existing PostgreSQL Setup
1. Run SQL migration: `backend/migrations/001_create_template_tables.sql`
2. Run import script: `python backend/scripts/import_templates.py`
3. Verify: 73 portfolio templates + 76 sheet templates imported

#### Option B: Export as JSON (If not using Supabase)
Templates are already in JSON format:
- `templates_library/templates.json` - 73 portfolio templates
- `sheets_library/sheets.json` - 76 sheet templates

### Step 2: Connect to Antigravity

**Database Connection String** (Supabase):
```
Type: PostgreSQL
Host: [your-supabase-host].supabase.co
Database: postgres
User: postgres
Password: [your-supabase-password]
Port: 5432
```

**Tables Available**:
- `portfolio_templates` - 73 templates
- `sheet_templates` - 76 templates
- `template_compatibility` - Recommendations mapping

### Step 3: Antigravity Components to Build

```
Gallery Views:
├─ Portfolio Template Grid
│  ├─ 73 templates in grid
│  ├─ Filter by category
│  ├─ Search by name
│  └─ Click to view details
│
├─ Sheet Template Grid
│  ├─ 76 templates in grid
│  ├─ Filter by type
│  ├─ Filter by format
│  └─ Click to view details
│
└─ Template Detail Modal
   ├─ Show colors (5 swatches)
   ├─ Show fonts
   ├─ Show layouts
   └─ "Use Template" button

Composer:
├─ Template Selector
├─ Content Zone Editor
├─ File Upload Handler
└─ Style Switcher
```

### Data Structure Reference

#### Portfolio Template Record
```json
{
  "id": "tpl_061",
  "name": "Museum",
  "category": "Contemporary",
  "description": "Sophisticated...",
  "colors": {
    "primary": "#FFFFFF",
    "accent": "#1A1A1A",
    "background": "#FFFFFF",
    "text": "#1A1A1A",
    "muted": "#999999"
  },
  "fonts": {
    "heading": "Serif",
    "body": "Sans-serif",
    "accent": "Sans-serif"
  },
  "layouts": {
    "cover": {...},
    "project": {...},
    "about": {...}
  },
  "placeholders": {
    "renders": 3,
    "plans": 1,
    "sections": 1,
    "diagrams": 1,
    "text_description": true,
    "project_title": true
  },
  "style_notes": "Professional practices",
  "page_count_range": "16-24",
  "orientation": "portrait_A4"
}
```

#### Sheet Template Record
```json
{
  "id": "sht_001",
  "name": "Concept Sheet",
  "sheet_type": "concept",
  "category": "Conceptual Ideas",
  "description": "...",
  "colors": {...},
  "fonts": {...},
  "layout_zones": [
    {
      "type": "title",
      "position": "top",
      "size": {"width": 100, "height": 10},
      "content_type": "text"
    },
    {
      "type": "image",
      "position": "center",
      "size": {"width": 100, "height": 60},
      "content_type": "render"
    }
  ],
  "format": "A2",
  "aspect_ratio": "1:1.41"
}
```

### API Endpoints Available

**If keeping the FastAPI backend running:**

```
GET /api/templates/portfolios?category=Minimalist&limit=20
GET /api/templates/sheets?sheet_type=concept&limit=20
GET /api/templates/portfolios/{id}
GET /api/templates/sheets/{id}
GET /api/templates/compatibility/{portfolio_id}
GET /api/templates/stats
```

But with Antigravity, you likely won't need the API - direct database connection is better.

### Templates Summary

**Portfolio Templates: 73 Total**
- Minimalist: 16
- Contemporary: 12
- Brutalist: 8
- Editorial: 7
- Dark Premium: 6
- Industrial: 4
- Bauhaus: 4
- Organic: 4
- Classical: 3
- Modern: 3
- Parametric: 2
- Other: 4

**Sheet Templates: 76 Total**
- Types: concept, plan, section, elevation, mood board, floor plan, section, detail, presentation board, diagram, materials, render, process
- Formats: A0, A1, A2, A3, square, panoramic
- Styles: minimal, rendered, dark, sketch, traditional, modern

### Files to Keep

```
📁 CosmoFolio-Antigravity/
├─ templates_library/
│  ├─ templates.json (73 templates - reference)
│  ├─ templates.csv (metadata)
│  └─ template_analysis.md
├─ sheets_library/
│  ├─ sheets.json (76 templates - reference)
│  ├─ sheets.csv (metadata)
│  └─ sheet_analysis.md
├─ backend/
│  ├─ migrations/001_create_template_tables.sql (DB schema)
│  ├─ scripts/import_templates.py (Import script)
│  └─ routes/templates.py (API endpoints if needed)
└─ ANTIGRAVITY_SETUP.md (this file)
```

### Next Steps

1. **Prepare Supabase**
   - [ ] Create tables (run SQL migration)
   - [ ] Import templates (run Python script)
   - [ ] Verify in Supabase dashboard

2. **Set Up Antigravity**
   - [ ] Connect to Supabase database
   - [ ] Create data sources for each table
   - [ ] Build portfolio template gallery component
   - [ ] Build sheet template gallery component

3. **Build Components**
   - [ ] Template grid with filtering
   - [ ] Template detail modal
   - [ ] Template selection flow
   - [ ] Sheet composer UI

4. **Integration**
   - [ ] Connect to user authentication
   - [ ] Save selected templates to user projects
   - [ ] Track template usage

### Supabase SQL to Run

```sql
-- Create portfolio_templates
CREATE TABLE portfolio_templates (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  source VARCHAR(50),
  colors JSONB,
  fonts JSONB,
  layouts JSONB,
  placeholders JSONB,
  preview_image TEXT,
  style_notes TEXT,
  page_count_range VARCHAR(20),
  orientation VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create sheet_templates
CREATE TABLE sheet_templates (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100),
  sheet_type VARCHAR(50),
  category VARCHAR(50),
  description TEXT,
  source VARCHAR(50),
  colors JSONB,
  fonts JSONB,
  layout_zones JSONB,
  format VARCHAR(20),
  aspect_ratio VARCHAR(20),
  preview_image TEXT,
  style_notes TEXT,
  content_requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_portfolio_templates_category ON portfolio_templates(category);
CREATE INDEX idx_sheet_templates_type ON sheet_templates(sheet_type);
CREATE INDEX idx_sheet_templates_format ON sheet_templates(format);
```

### Python Import Script to Run

```bash
cd backend
python scripts/import_templates.py
```

This will load all 149 templates into Supabase.

---

Ready to build the UI in Antigravity! 🚀
