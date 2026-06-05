-- ============================================================
-- Phase 4: Database Integration
-- Create template tables for portfolio and sheet templates
-- ============================================================

-- ============================================================
-- Portfolio Templates Table
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_templates (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'ai-generated', -- 'ai-generated' or 'archifolio'
    colors JSONB NOT NULL, -- {primary, accent, background, text, muted}
    fonts JSONB NOT NULL, -- {heading, body, accent}
    layouts JSONB NOT NULL, -- {cover: {...}, project: {...}, about: {...}}
    placeholders JSONB NOT NULL, -- {renders, plans, sections, diagrams, text_description, etc}
    preview_image TEXT,
    style_notes TEXT,
    page_count_range VARCHAR(20), -- e.g., "16-24"
    orientation VARCHAR(20) DEFAULT 'portrait_A4',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_templates_category ON portfolio_templates(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_templates_source ON portfolio_templates(source);

-- ============================================================
-- Sheet Templates Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sheet_templates (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sheet_type VARCHAR(50) NOT NULL, -- concept, plan, section, elevation, mood_board, etc
    category VARCHAR(50),
    description TEXT,
    source VARCHAR(50) DEFAULT 'ai-generated',
    colors JSONB NOT NULL,
    fonts JSONB NOT NULL,
    layout_zones JSONB NOT NULL, -- Zones: {type, position, size, content_type}
    format VARCHAR(20), -- A0, A1, A2, A3, square, etc
    aspect_ratio VARCHAR(20), -- "16:9", "1:1", etc
    preview_image TEXT,
    style_notes TEXT,
    content_requirements JSONB, -- {renders, plans, diagrams, text, etc}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sheet_templates_type ON sheet_templates(sheet_type);
CREATE INDEX IF NOT EXISTS idx_sheet_templates_category ON sheet_templates(category);
CREATE INDEX IF NOT EXISTS idx_sheet_templates_format ON sheet_templates(format);

-- ============================================================
-- Template Compatibility Mapping Table
-- ============================================================
CREATE TABLE IF NOT EXISTS template_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_template_id VARCHAR(20) NOT NULL REFERENCES portfolio_templates(id),
    sheet_template_id VARCHAR(20) NOT NULL REFERENCES sheet_templates(id),
    compatibility_score FLOAT DEFAULT 1.0, -- 0.0 to 1.0 (1.0 = perfect match)
    recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_template_compatibility_portfolio ON template_compatibility(portfolio_template_id);
CREATE INDEX IF NOT EXISTS idx_template_compatibility_sheet ON template_compatibility(sheet_template_id);

-- ============================================================
-- Template Search/Filter View (for optimization)
-- ============================================================
CREATE VIEW IF NOT EXISTS portfolio_templates_summary AS
SELECT
    id,
    name,
    category,
    source,
    page_count_range,
    orientation,
    (colors->>'primary') as primary_color,
    (colors->>'accent') as accent_color,
    style_notes,
    created_at
FROM portfolio_templates;

CREATE VIEW IF NOT EXISTS sheet_templates_summary AS
SELECT
    id,
    name,
    sheet_type,
    category,
    source,
    format,
    aspect_ratio,
    style_notes,
    created_at
FROM sheet_templates;

-- ============================================================
-- Row Level Security (optional, depending on requirements)
-- ============================================================
-- Templates are public read, admin write
ALTER TABLE portfolio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_compatibility ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "portfolio_templates_read" ON portfolio_templates
    FOR SELECT
    USING (true);

CREATE POLICY "sheet_templates_read" ON sheet_templates
    FOR SELECT
    USING (true);

CREATE POLICY "template_compatibility_read" ON template_compatibility
    FOR SELECT
    USING (true);

-- Admin-only write (for import script)
-- This would require auth setup - skip for now since import runs as service role
