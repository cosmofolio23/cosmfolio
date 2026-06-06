# Template Setup Instructions

## Overview
You have 149 templates ready to import:
- **73 Portfolio Templates** (in `templates_library/templates.json`)
- **76 Sheet Templates** (in `sheets_library/sheets.json`)

## Step 1: Create Database Tables

Go to **Supabase Console** → **SQL Editor** and run this SQL:

```sql
-- Create portfolio_templates table
CREATE TABLE IF NOT EXISTS public.portfolio_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  colors JSONB,
  fonts JSONB,
  layouts JSONB,
  placeholders JSONB,
  preview_image TEXT,
  style_notes TEXT,
  page_count_range TEXT,
  orientation TEXT DEFAULT 'portrait_A4',
  source TEXT DEFAULT 'ai-generated',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create sheet_templates table
CREATE TABLE IF NOT EXISTS public.sheet_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sheet_type TEXT,
  category TEXT,
  format TEXT,
  description TEXT,
  colors JSONB,
  typography JSONB,
  key_placeholders TEXT,
  style_notes TEXT,
  source TEXT DEFAULT 'ai-generated',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS portfolio_templates_category_idx ON public.portfolio_templates(category);
CREATE INDEX IF NOT EXISTS portfolio_templates_source_idx ON public.portfolio_templates(source);
CREATE INDEX IF NOT EXISTS sheet_templates_type_idx ON public.sheet_templates(sheet_type);
CREATE INDEX IF NOT EXISTS sheet_templates_category_idx ON public.sheet_templates(category);
CREATE INDEX IF NOT EXISTS sheet_templates_format_idx ON public.sheet_templates(format);

-- Enable RLS
ALTER TABLE public.portfolio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_templates ENABLE ROW LEVEL SECURITY;

-- Create read policies
CREATE POLICY "portfolio_templates_read_public" ON public.portfolio_templates
  FOR SELECT USING (true);

CREATE POLICY "sheet_templates_read_public" ON public.sheet_templates
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON public.portfolio_templates TO anon, authenticated;
GRANT SELECT ON public.sheet_templates TO anon, authenticated;
```

## Step 2: Import Templates

Once tables are created, run:

```bash
cd /e/Projects/My\ Product/BUILDING\ APP/ArchPortfolio_Generator
export SUPABASE_URL="https://rjobifgysmovmcvhdlnd.supabase.co"
export SUPABASE_ANON_KEY="sb_publishable_IsZjamlpYF9KrkJ07-Cikg_Lgl_UFoB"
node scripts/import-templates.js
```

## Templates Included

### Portfolio Templates (73)
Categories: Minimalist, Brutalist, Parametric, Editorial, Sustainable, Modern, Heritage, Dark Premium, Soft Modern, Industrial, Landscape, Bold Modern, Academic, Photographic, Diagrammatic, Residential, Conceptual, Futuristic, Technical, Narrative, Vintage, Visualization, Interior, Civic, Adaptive Reuse, Materials, Boutique, Mid-Century, Commercial, Urban, Hospitality, Healthcare, Modular, Educational, Religious, Cultural, Retail, Sports, Research, Contemporary, Organic, Bauhaus, Classical

### Sheet Templates (76)
Types: concept, site_analysis, mood_board, floor_plan, section, elevation, axonometric, detail, presentation_board, diagram, materials, render, process

Formats: A0, A1, A2 (landscape & portrait variants)

## Verification

After import, check Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM public.portfolio_templates;
SELECT COUNT(*) FROM public.sheet_templates;
```

Should return:
- portfolio_templates: 73
- sheet_templates: 76
- **Total: 149 templates**

## API Endpoints Available

Once imported, these endpoints become live:

```
GET /api/templates/portfolios          - List all portfolio templates
GET /api/templates/portfolios/{id}     - Get specific portfolio template
GET /api/templates/sheets              - List all sheet templates
GET /api/templates/sheets/{id}         - Get specific sheet template
POST /api/templates/portfolios/{id}/apply/{portfolioId} - Apply template
```

## Frontend Access

Once live, users can:
1. Go to **Dashboard → Templates**
2. Browse/search 73 portfolio + 76 sheet templates
3. Filter by category, page count, source
4. Save favorites with ❤️
5. Preview templates with full details
6. Apply templates to portfolios with color/font customization
7. Save customizations as variants
