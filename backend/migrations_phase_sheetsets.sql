-- CosmoFolio Database Migrations — Phase: SHEET SETS (COSMO SHEET persistence)
-- ============================================================================
-- The COSMO SHEET frontend (/dashboard/project/[id]/sheet-set/...) talks to
-- /api/projects/{id}/sheet-sets endpoints that never had a backing table. This
-- adds a simple JSON store for sheet sets: the rich SheetSet model lives in the
-- frontend (TypeScript); the backend just persists it as JSONB.
--
-- Firebase auth → user_id is TEXT (see library migration). library_project_id
-- links a sheet set back to a Library project when generated "from library".
-- ============================================================================

CREATE TABLE IF NOT EXISTS sheet_sets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         TEXT NOT NULL,                 -- backing project (route param)
  user_id            TEXT NOT NULL,                 -- Firebase uid
  library_project_id UUID,                          -- set when generated from a Library project
  name               VARCHAR(255) NOT NULL DEFAULT 'Sheet Set',
  submission_type    VARCHAR(40),
  sheet_count        INT DEFAULT 0,
  data               JSONB NOT NULL DEFAULT '{}'::jsonb,  -- the full SheetSet object
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheet_sets_project ON sheet_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_sheet_sets_user ON sheet_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheet_sets_library ON sheet_sets(library_project_id);

-- Firebase auth: no Supabase auth.uid() session; backend uses the service role
-- key (bypasses RLS) and enforces ownership in code. Enable RLS to deny anon.
ALTER TABLE sheet_sets ENABLE ROW LEVEL SECURITY;

-- Now that sheet_sets exists, ensure the Library output-association column is present
-- (the library migration's guarded ALTER was a no-op when this table didn't exist yet).
ALTER TABLE sheet_sets ADD COLUMN IF NOT EXISTS library_project_id UUID REFERENCES library_projects(id) ON DELETE SET NULL;

-- ==================== MIGRATION COMPLETE ====================
