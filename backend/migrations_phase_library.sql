-- CosmoFolio Database Migrations — Phase: LIBRARY (premium tier)
-- ============================================================================
-- The Library is a SEPARATE premium product. It introduces a project-centric
-- store (upload once → feeds Portfolio + Sheet) on its OWN clean tables, so the
-- existing per-product `assets`/`projects` flow for standalone Portfolio and
-- standalone Sheet stays untouched.
--
-- Tables:
--   user_entitlements    — who owns what (portfolio / sheet / library)
--   library_projects     — the top-level container a Library user owns
--   library_assets       — canonical-taxonomy assets (the unified store)
--   library_project_text — the Text branch (concept/description/sustainability)
--   + nullable library_project_id on portfolios & sheet_sets (output association)
-- ============================================================================

-- ==================== ENTITLEMENTS ====================
-- No billing exists yet. This table is the gate; payments plug in later by
-- writing rows here. Absence of a row = default-granted (see entitlements.py),
-- so nothing breaks pre-paywall.
CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_portfolio  BOOLEAN NOT NULL DEFAULT FALSE,
  has_sheet      BOOLEAN NOT NULL DEFAULT FALSE,
  has_library    BOOLEAN NOT NULL DEFAULT FALSE,   -- superset: implies portfolio + sheet
  source         VARCHAR(30) NOT NULL DEFAULT 'manual',  -- manual | stripe | promo | dev
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_entitlement_source CHECK (source IN ('manual','stripe','promo','dev'))
);

-- ==================== LIBRARY PROJECTS ====================
CREATE TABLE IF NOT EXISTS library_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- identity
  name          VARCHAR(255) NOT NULL,
  typology      VARCHAR(80),     -- residential, cultural, commercial, ...
  year          INT,
  semester      VARCHAR(40),     -- "Year 3 · Sem 1", "Thesis", ...
  studio_brief  TEXT,
  status        VARCHAR(40) NOT NULL DEFAULT 'active',  -- active | archived | completed

  -- curation
  cover_asset_id UUID,           -- soft ref to library_assets (the project thumbnail)
  sort_order     INT NOT NULL DEFAULT 0,

  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_project_status CHECK (status IN ('active','archived','completed'))
);

CREATE INDEX IF NOT EXISTS idx_library_projects_user ON library_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_library_projects_status ON library_projects(status);

-- ==================== LIBRARY ASSETS (the unified store) ====================
CREATE TABLE IF NOT EXISTS library_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES library_projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- canonical taxonomy (see frontend/src/lib/assetTaxonomy.ts)
  category      VARCHAR(20) NOT NULL DEFAULT 'info',   -- drawing|visual|process|analysis|text|info
  asset_type    VARCHAR(40) NOT NULL DEFAULT 'other',  -- plan|section|exterior-render|...
  title         VARCHAR(255),
  caption       TEXT,

  -- storage
  storage_path  TEXT NOT NULL,
  url           TEXT,
  thumb_url     TEXT,

  -- architecture metadata (nullable — progressive: only filled when needed)
  scale         VARCHAR(12),   -- 1:1 .. 1:1000 (drawings only)
  orientation   VARCHAR(12),   -- portrait | landscape
  has_north     BOOLEAN DEFAULT FALSE,
  is_vector     BOOLEAN DEFAULT FALSE,

  -- quality signals (computed on upload)
  width_px      INT,
  height_px     INT,
  dpi           INT,
  file_size     INT,
  mime_type     VARCHAR(60),

  -- intelligence (vision tags — populated later)
  ai_tags       JSONB DEFAULT '{}'::jsonb,

  -- curation
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,  -- student's "best" picks
  sort_order    INT NOT NULL DEFAULT 0,

  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_assets_project ON library_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_library_assets_user ON library_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_library_assets_category ON library_assets(category);
CREATE INDEX IF NOT EXISTS idx_library_assets_type ON library_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_library_assets_featured ON library_assets(is_featured) WHERE is_featured = TRUE;

-- ==================== LIBRARY PROJECT TEXT (the Text branch) ====================
-- One row per (project, kind). Stores the smart-length variants up front.
CREATE TABLE IF NOT EXISTS library_project_text (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES library_projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          VARCHAR(30) NOT NULL,   -- concept | description | sustainability | abstract
  short         TEXT,
  medium        TEXT,
  long          TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_text_per_kind UNIQUE(project_id, kind),
  CONSTRAINT valid_text_kind CHECK (kind IN ('concept','description','sustainability','abstract'))
);

CREATE INDEX IF NOT EXISTS idx_library_text_project ON library_project_text(project_id);

-- ==================== OUTPUT ASSOCIATION ====================
-- Library users: portfolios & sheet sets they create belong to a library project,
-- so the Library can show "all outputs for this project" in one place.
-- Nullable → standalone (non-Library) outputs simply leave it NULL.
ALTER TABLE portfolios  ADD COLUMN IF NOT EXISTS library_project_id UUID REFERENCES library_projects(id) ON DELETE SET NULL;
-- sheet_sets may not exist yet in all environments; guard with a DO block.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sheet_sets') THEN
    ALTER TABLE sheet_sets ADD COLUMN IF NOT EXISTS library_project_id UUID REFERENCES library_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE user_entitlements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_project_text ENABLE ROW LEVEL SECURITY;

-- entitlements: a user may read their own row (writes happen server-side via service role)
DROP POLICY IF EXISTS "read own entitlements" ON user_entitlements;
CREATE POLICY "read own entitlements" ON user_entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- library projects: full ownership
DROP POLICY IF EXISTS "own library projects" ON library_projects;
CREATE POLICY "own library projects" ON library_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- library assets: ownership
DROP POLICY IF EXISTS "own library assets" ON library_assets;
CREATE POLICY "own library assets" ON library_assets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- library text: ownership
DROP POLICY IF EXISTS "own library text" ON library_project_text;
CREATE POLICY "own library text" ON library_project_text
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==================== MIGRATION COMPLETE ====================
