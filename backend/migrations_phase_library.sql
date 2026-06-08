-- CosmoFolio Database Migrations — Phase: LIBRARY (premium tier)  [v2]
-- ============================================================================
-- v2 fix: this app authenticates with FIREBASE, so user ids are Firebase
-- strings (e.g. "eH6322JZD5XOrkq4dcIRk0LYzmG3"), NOT Supabase auth.users UUIDs.
-- v1 declared user_id as UUID REFERENCES auth.users(id), which made every
-- insert fail ("invalid input syntax for type uuid"). v2 uses user_id TEXT with
-- no auth.users FK, and RLS that simply denies anon (the service-role backend
-- enforces ownership in code, same as the existing /assets routes).
--
-- The v1 tables were created empty, so this safely drops & recreates them.
-- Re-runnable.
-- ============================================================================

-- Drop the output-association columns first (removes their FK to library_projects),
-- so the tables below can be dropped cleanly. They are re-added at the end.
ALTER TABLE portfolios DROP COLUMN IF EXISTS library_project_id;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sheet_sets') THEN
    ALTER TABLE sheet_sets DROP COLUMN IF EXISTS library_project_id;
  END IF;
END $$;

DROP TABLE IF EXISTS library_assets CASCADE;
DROP TABLE IF EXISTS library_project_text CASCADE;
DROP TABLE IF EXISTS library_projects CASCADE;
DROP TABLE IF EXISTS user_entitlements CASCADE;

-- ==================== ENTITLEMENTS ====================
-- No billing yet. Absence of a row = default-granted (see entitlements.py).
CREATE TABLE user_entitlements (
  user_id        TEXT PRIMARY KEY,                 -- Firebase uid
  has_portfolio  BOOLEAN NOT NULL DEFAULT FALSE,
  has_sheet      BOOLEAN NOT NULL DEFAULT FALSE,
  has_library    BOOLEAN NOT NULL DEFAULT FALSE,   -- superset: implies portfolio + sheet
  source         VARCHAR(30) NOT NULL DEFAULT 'manual',
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_entitlement_source CHECK (source IN ('manual','stripe','promo','dev'))
);

-- ==================== LIBRARY PROJECTS ====================
CREATE TABLE library_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,                     -- Firebase uid
  name          VARCHAR(255) NOT NULL,
  typology      VARCHAR(80),
  year          INT,
  semester      VARCHAR(40),
  studio_brief  TEXT,
  status        VARCHAR(40) NOT NULL DEFAULT 'active',
  cover_asset_id UUID,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_project_status CHECK (status IN ('active','archived','completed'))
);
CREATE INDEX idx_library_projects_user ON library_projects(user_id);
CREATE INDEX idx_library_projects_status ON library_projects(status);

-- ==================== LIBRARY ASSETS (the unified store) ====================
CREATE TABLE library_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES library_projects(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,                     -- Firebase uid
  category      VARCHAR(20) NOT NULL DEFAULT 'info',   -- drawing|visual|process|analysis|text|info
  asset_type    VARCHAR(40) NOT NULL DEFAULT 'other',
  title         VARCHAR(255),
  caption       TEXT,
  storage_path  TEXT NOT NULL,
  url           TEXT,
  thumb_url     TEXT,
  scale         VARCHAR(12),
  orientation   VARCHAR(12),
  has_north     BOOLEAN DEFAULT FALSE,
  is_vector     BOOLEAN DEFAULT FALSE,
  width_px      INT,
  height_px     INT,
  dpi           INT,
  file_size     INT,
  mime_type     VARCHAR(60),
  ai_tags       JSONB DEFAULT '{}'::jsonb,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_library_assets_project ON library_assets(project_id);
CREATE INDEX idx_library_assets_user ON library_assets(user_id);
CREATE INDEX idx_library_assets_category ON library_assets(category);
CREATE INDEX idx_library_assets_type ON library_assets(asset_type);
CREATE INDEX idx_library_assets_featured ON library_assets(is_featured) WHERE is_featured = TRUE;

-- ==================== LIBRARY PROJECT TEXT (the Text branch) ====================
CREATE TABLE library_project_text (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES library_projects(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,                     -- Firebase uid
  kind          VARCHAR(30) NOT NULL,
  short         TEXT,
  medium        TEXT,
  long          TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_text_per_kind UNIQUE(project_id, kind),
  CONSTRAINT valid_text_kind CHECK (kind IN ('concept','description','sustainability','abstract'))
);
CREATE INDEX idx_library_text_project ON library_project_text(project_id);

-- ==================== OUTPUT ASSOCIATION ====================
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS library_project_id UUID REFERENCES library_projects(id) ON DELETE SET NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sheet_sets') THEN
    ALTER TABLE sheet_sets ADD COLUMN IF NOT EXISTS library_project_id UUID REFERENCES library_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==================== ROW LEVEL SECURITY ====================
-- Firebase auth means there is no Supabase auth.uid() session; the backend
-- accesses these tables with the SERVICE ROLE key (which bypasses RLS) and
-- enforces ownership in code. Enabling RLS with no policies denies all direct
-- anon/public access — exactly what we want.
ALTER TABLE user_entitlements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_project_text ENABLE ROW LEVEL SECURITY;

-- ==================== MIGRATION COMPLETE ====================
