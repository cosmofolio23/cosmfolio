-- ============================================================
-- Phase 8: Presentation Sheet Creator — Database Schema
-- Migration: phase8_sheets.sql
-- Run: psql $DATABASE_URL < migrations/phase8_sheets.sql
-- ============================================================

-- Enable UUID extension (already present in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── SHEET TEMPLATES ──────────────────────────────────────────
-- Built-in templates shipped with the app
CREATE TABLE IF NOT EXISTS sheet_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        TEXT UNIQUE NOT NULL,        -- e.g. "plan_section_render"
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    page_size   TEXT NOT NULL DEFAULT 'A2',
    orientation TEXT NOT NULL DEFAULT 'landscape',
    grid_columns INT  NOT NULL DEFAULT 12,
    grid_rows    INT  NOT NULL DEFAULT 8,
    layout      JSONB NOT NULL DEFAULT '{}', -- cell definitions
    tags        TEXT[] DEFAULT '{}',
    year_level  TEXT,
    thumbnail_url TEXT,
    is_built_in BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheet_templates_category ON sheet_templates(category);
CREATE INDEX IF NOT EXISTS idx_sheet_templates_year     ON sheet_templates(year_level);
CREATE INDEX IF NOT EXISTS idx_sheet_templates_slug     ON sheet_templates(slug);


-- ── PRESENTATION SHEETS ───────────────────────────────────────
-- One row per sheet a student creates
CREATE TABLE IF NOT EXISTS presentation_sheets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID,                        -- FK → projects.id (Phase 1)
    user_id     UUID NOT NULL,               -- FK → users.id
    title       TEXT NOT NULL,
    template_id UUID REFERENCES sheet_templates(id) ON DELETE SET NULL,
    page_size   TEXT NOT NULL DEFAULT 'A2',
    orientation TEXT NOT NULL DEFAULT 'landscape',
    semester    TEXT,                        -- e.g. "Year 3 Semester 2"
    content     JSONB NOT NULL DEFAULT '{"elements":[]}',
    design_scheme TEXT DEFAULT 'monochrome', -- references SheetDesignSystem
    tags        TEXT[] DEFAULT '{}',
    version     INT  NOT NULL DEFAULT 1,
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    share_token TEXT UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheets_user_id    ON presentation_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheets_project_id ON presentation_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_sheets_semester   ON presentation_sheets(semester);
CREATE INDEX IF NOT EXISTS idx_sheets_share_token ON presentation_sheets(share_token)
    WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sheets_updated_at ON presentation_sheets(updated_at DESC);

-- Full-text search on title
ALTER TABLE presentation_sheets
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_sheets_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sheets_search_vector_update
    BEFORE INSERT OR UPDATE ON presentation_sheets
    FOR EACH ROW EXECUTE FUNCTION update_sheets_search_vector();

CREATE INDEX IF NOT EXISTS idx_sheets_search ON presentation_sheets USING GIN(search_vector);


-- ── SHEET VERSION HISTORY ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_versions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id    UUID NOT NULL REFERENCES presentation_sheets(id) ON DELETE CASCADE,
    version_no  INT  NOT NULL,
    content     JSONB NOT NULL,              -- snapshot of elements at save
    label       TEXT,                        -- "After jury feedback" etc.
    saved_by    UUID,                        -- user who saved this version
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sheet_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_sheet_versions_sheet_id ON sheet_versions(sheet_id);


-- ── SHEET FEEDBACK / COMMENTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_feedback (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id     UUID NOT NULL REFERENCES presentation_sheets(id) ON DELETE CASCADE,
    commenter_id UUID,                       -- NULL = anonymous reviewer
    commenter_email TEXT,
    comment      TEXT NOT NULL,
    element_id   TEXT,                       -- references element within JSONB content
    position_x   FLOAT,                      -- % position on sheet
    position_y   FLOAT,
    status       TEXT NOT NULL DEFAULT 'open', -- open | resolved | wont_fix
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheet_feedback_sheet_id ON sheet_feedback(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_feedback_status   ON sheet_feedback(status);


-- ── REVISION MARKERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_revisions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id    UUID NOT NULL REFERENCES presentation_sheets(id) ON DELETE CASCADE,
    element_id  TEXT,
    note        TEXT NOT NULL,
    marked_by   UUID NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | done
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheet_revisions_sheet_id ON sheet_revisions(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_revisions_status   ON sheet_revisions(status);


-- ── SHEET SHARE TOKENS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_share_tokens (
    token           TEXT PRIMARY KEY,
    sheet_id        UUID NOT NULL REFERENCES presentation_sheets(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL,
    allow_comments  BOOLEAN NOT NULL DEFAULT TRUE,
    allow_download  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    view_count      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_tokens_sheet_id  ON sheet_share_tokens(sheet_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires   ON sheet_share_tokens(expires_at);


-- ── SHEET ANALYTICS EVENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_events (
    id          BIGSERIAL PRIMARY KEY,
    event       TEXT NOT NULL,
    user_id     UUID,
    sheet_id    UUID,
    template_id UUID,
    payload     JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

-- Monthly partitions
CREATE TABLE IF NOT EXISTS sheet_events_2026_05
    PARTITION OF sheet_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS sheet_events_2026_06
    PARTITION OF sheet_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX IF NOT EXISTS idx_sheet_events_user_id    ON sheet_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sheet_events_sheet_id   ON sheet_events(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_events_occurred   ON sheet_events(occurred_at DESC);


-- ── ROW LEVEL SECURITY (Supabase) ─────────────────────────────
ALTER TABLE presentation_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sheets"
    ON presentation_sheets FOR SELECT
    USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own sheets"
    ON presentation_sheets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheets"
    ON presentation_sheets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheets"
    ON presentation_sheets FOR DELETE
    USING (auth.uid() = user_id);


-- ── SEED BUILT-IN TEMPLATES ───────────────────────────────────
-- Populated programmatically from SheetTemplateRegistry on first boot.
-- The application calls:
--   INSERT INTO sheet_templates ... ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- End of Phase 8 migration
-- ============================================================
