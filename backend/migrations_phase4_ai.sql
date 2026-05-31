-- Phase 4: AI Integration Database Schema
-- Task 4.4: Database schema for AI-generated content
-- Created: 2026-05-30

-- ==================== PROJECT TEXT TABLE ====================

CREATE TABLE IF NOT EXISTS project_texts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    portfolio_id TEXT REFERENCES portfolios(id) ON DELETE CASCADE,

    -- Content tracking
    content_type TEXT NOT NULL CHECK (content_type IN (
        'description',
        'brief',
        'strategy',
        'concept_statement',
        'caption',
        'bio',
        'title',
        'tagline'
    )),

    -- Generated content
    original_text TEXT,
    generated_text TEXT NOT NULL,

    -- AI configuration
    ai_model TEXT DEFAULT 'llama2',
    tone TEXT NOT NULL CHECK (tone IN (
        'academic',
        'professional',
        'creative',
        'technical',
        'marketing'
    )),

    -- Usage tracking
    token_count INTEGER,
    generation_time_ms INTEGER,
    cost_usd DECIMAL(10, 4),

    -- Quality metrics
    readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
    word_count INTEGER,

    -- Version control
    version INTEGER DEFAULT 1,
    is_approved BOOLEAN DEFAULT FALSE,
    is_used BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT project_portfolio_check CHECK (
        project_id IS NOT NULL OR portfolio_id IS NOT NULL
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_texts_project_id ON project_texts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_texts_portfolio_id ON project_texts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_project_texts_content_type ON project_texts(content_type);
CREATE INDEX IF NOT EXISTS idx_project_texts_created_at ON project_texts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_texts_is_used ON project_texts(is_used);


-- ==================== AI USAGE TABLE ====================

CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- API information
    api_endpoint TEXT NOT NULL,
    api_model TEXT DEFAULT 'llama2',
    request_date DATE DEFAULT CURRENT_DATE,

    -- Usage metrics
    total_requests INTEGER DEFAULT 1,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,

    -- Status
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    fallback_count INTEGER DEFAULT 0,

    -- Rate limiting info
    rate_limited BOOLEAN DEFAULT FALSE,
    last_request_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_date ON ai_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_last_request ON ai_usage(last_request_at DESC);


-- ==================== CONTENT VERSIONS TABLE ====================

CREATE TABLE IF NOT EXISTS project_text_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_text_id TEXT NOT NULL REFERENCES project_texts(id) ON DELETE CASCADE,

    -- Version info
    version_number INTEGER NOT NULL,
    content_text TEXT NOT NULL,

    -- Generation info
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generation_model TEXT DEFAULT 'llama2',
    tone TEXT,

    -- Comparison with previous
    is_better_than_previous BOOLEAN,
    feedback TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for version tracking
CREATE INDEX IF NOT EXISTS idx_project_text_versions_project_text_id ON project_text_versions(project_text_id);
CREATE INDEX IF NOT EXISTS idx_project_text_versions_version_number ON project_text_versions(project_text_id, version_number DESC);


-- ==================== CONTENT SUGGESTIONS TABLE ====================

CREATE TABLE IF NOT EXISTS content_suggestions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_text_id TEXT NOT NULL REFERENCES project_texts(id) ON DELETE CASCADE,

    -- Suggestion info
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
        'improve_clarity',
        'improve_brevity',
        'improve_engagement',
        'fix_tone',
        'reduce_length',
        'expand_content',
        'check_grammar'
    )),

    -- Suggestion details
    current_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    explanation TEXT,

    -- User feedback
    user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'pending')),
    user_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    actioned_at TIMESTAMPTZ
);

-- Create indexes for suggestions
CREATE INDEX IF NOT EXISTS idx_content_suggestions_project_text_id ON content_suggestions(project_text_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_user_action ON content_suggestions(user_action);


-- ==================== AI CONFIGURATION TABLE ====================

CREATE TABLE IF NOT EXISTS ai_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Default settings
    default_tone TEXT DEFAULT 'professional' CHECK (default_tone IN (
        'academic',
        'professional',
        'creative',
        'technical',
        'marketing'
    )),

    -- Rate limiting
    monthly_token_limit INTEGER DEFAULT 100000,
    daily_request_limit INTEGER DEFAULT 100,

    -- Preferences
    auto_approve_content BOOLEAN DEFAULT FALSE,
    enable_suggestions BOOLEAN DEFAULT TRUE,
    preferred_model TEXT DEFAULT 'llama2',

    -- Opt-in/out
    enable_ai_features BOOLEAN DEFAULT TRUE,
    track_usage BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user config
CREATE INDEX IF NOT EXISTS idx_ai_config_user_id ON ai_config(user_id);


-- ==================== STORED PROCEDURES ====================

-- Function to update project_texts updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_texts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS project_texts_updated_at_trigger ON project_texts;
CREATE TRIGGER project_texts_updated_at_trigger
BEFORE UPDATE ON project_texts
FOR EACH ROW
EXECUTE FUNCTION update_project_texts_timestamp();


-- Function to log AI usage
CREATE OR REPLACE FUNCTION log_ai_usage(
    p_user_id TEXT,
    p_endpoint TEXT,
    p_model TEXT,
    p_success BOOLEAN,
    p_tokens INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO ai_usage (
        user_id,
        api_endpoint,
        api_model,
        total_requests,
        total_tokens,
        success_count,
        last_request_at
    )
    VALUES (
        p_user_id,
        p_endpoint,
        p_model,
        1,
        p_tokens,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_requests = ai_usage.total_requests + 1,
        total_tokens = ai_usage.total_tokens + p_tokens,
        success_count = CASE
            WHEN p_success THEN ai_usage.success_count + 1
            ELSE ai_usage.success_count
        END,
        last_request_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- Function to create new version for content
CREATE OR REPLACE FUNCTION create_content_version(
    p_project_text_id TEXT,
    p_content_text TEXT,
    p_tone TEXT
)
RETURNS void AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
    FROM project_text_versions
    WHERE project_text_id = p_project_text_id;

    -- Insert new version
    INSERT INTO project_text_versions (
        project_text_id,
        version_number,
        content_text,
        generation_model,
        tone
    )
    VALUES (
        p_project_text_id,
        v_next_version,
        p_content_text,
        'llama2',
        p_tone
    );

    -- Update parent record
    UPDATE project_texts
    SET version = v_next_version
    WHERE id = p_project_text_id;
END;
$$ LANGUAGE plpgsql;


-- ==================== VIEWS ====================

-- View for user AI statistics
CREATE OR REPLACE VIEW user_ai_stats AS
SELECT
    u.id as user_id,
    u.email,
    COALESCE(SUM(au.total_requests), 0) as total_ai_requests,
    COALESCE(SUM(au.total_tokens), 0) as total_tokens_used,
    COALESCE(SUM(au.total_cost_usd), 0) as total_cost,
    COALESCE(SUM(au.success_count), 0) as successful_requests,
    COUNT(DISTINCT pt.id) as total_texts_generated,
    COUNT(DISTINCT CASE WHEN pt.is_used THEN pt.id END) as texts_used_in_portfolio
FROM users u
LEFT JOIN ai_usage au ON u.id = au.user_id
LEFT JOIN project_texts pt ON u.id = pt.created_by
GROUP BY u.id, u.email;

-- View for content quality metrics
CREATE OR REPLACE VIEW content_quality_metrics AS
SELECT
    content_type,
    tone,
    COUNT(*) as total_generated,
    AVG(readability_score) as avg_readability,
    AVG(word_count) as avg_word_count,
    COUNT(CASE WHEN is_approved THEN 1 END) as approved_count,
    COUNT(CASE WHEN is_used THEN 1 END) as used_count,
    ROUND(100.0 * COUNT(CASE WHEN is_used THEN 1 END) /
        NULLIF(COUNT(*), 0), 2) as usage_rate_percent
FROM project_texts
GROUP BY content_type, tone;


-- ==================== GRANTS (if using RLS) ====================

-- These would be configured based on your RLS policies
-- ALTER TABLE project_texts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_text_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;


-- ==================== DATA VALIDATION ====================

-- Add constraint to ensure tokens are non-negative
ALTER TABLE project_texts
ADD CONSTRAINT check_non_negative_tokens CHECK (token_count IS NULL OR token_count >= 0);

-- Add constraint to ensure word count is non-negative
ALTER TABLE project_texts
ADD CONSTRAINT check_non_negative_words CHECK (word_count IS NULL OR word_count >= 0);

-- Add constraint to ensure cost is non-negative
ALTER TABLE project_texts
ADD CONSTRAINT check_non_negative_cost CHECK (cost_usd IS NULL OR cost_usd >= 0);


-- ==================== MIGRATION COMPLETE ====================

-- This migration adds support for:
-- 1. Storing AI-generated content with version control
-- 2. Tracking AI usage and costs
-- 3. Managing content suggestions and improvements
-- 4. Per-user AI configuration and rate limiting
-- 5. Quality metrics and analytics for generated content

-- Total new tables: 5
-- Total new views: 2
-- Total new functions: 3
