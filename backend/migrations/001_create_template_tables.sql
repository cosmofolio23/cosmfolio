-- Migration: Create template tables for portfolio and sheet templates

-- Portfolio Templates Table
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

-- Sheet Templates Table
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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS portfolio_templates_category_idx ON public.portfolio_templates(category);
CREATE INDEX IF NOT EXISTS portfolio_templates_source_idx ON public.portfolio_templates(source);
CREATE INDEX IF NOT EXISTS sheet_templates_type_idx ON public.sheet_templates(sheet_type);
CREATE INDEX IF NOT EXISTS sheet_templates_category_idx ON public.sheet_templates(category);
CREATE INDEX IF NOT EXISTS sheet_templates_format_idx ON public.sheet_templates(format);

-- Enable Row Level Security
ALTER TABLE public.portfolio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_templates ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "portfolio_templates_read_public" ON public.portfolio_templates
  FOR SELECT USING (true);

CREATE POLICY "sheet_templates_read_public" ON public.sheet_templates
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON public.portfolio_templates TO anon, authenticated;
GRANT SELECT ON public.sheet_templates TO anon, authenticated;
