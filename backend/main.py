import os
import sys
from pathlib import Path

# Set up Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables BEFORE importing anything else
from dotenv import load_dotenv
load_dotenv()

print("[STARTUP] Loading FastAPI...")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

print("[STARTUP] Loading settings...")
try:
    from config import settings
except Exception as e:
    print(f"[ERROR] Failed to load config: {e}")
    raise

print("[STARTUP] Loading routes...")
try:
    from routes import auth, projects, assets, portfolios, layouts, optimization, previews, search, versioning, caching, design_system, style_pack, layout_customization, ai_generation, preview_export
    from routes import publication
    from routes import sheets as sheets_router
except Exception as e:
    print(f"[WARNING] Some routes failed to load: {e}")
    # Continue anyway - at least the app will start
    auth = projects = assets = portfolios = None

print("[STARTUP] Loading middleware...")
try:
    from middleware.rate_limit import RateLimitMiddleware
    from middleware.security import SecurityHeadersMiddleware
    from middleware.cache_headers import CacheHeaderMiddleware
except Exception as e:
    print(f"[WARNING] Middleware failed to load: {e}")

def init_database():
    """Create all tables on startup if they don't exist"""
    from database import supabase
    if not supabase:
        print("[WARNING] Supabase not initialized, skipping table creation")
        return

    tables_sql = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            project_type TEXT DEFAULT 'residential',
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            asset_type TEXT,
            file_url TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            upload_order INTEGER DEFAULT 0,
            analysis JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS portfolios (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            layout_id TEXT,
            style_pack TEXT,
            page_structure JSONB,
            variant_number INTEGER DEFAULT 1,
            generated_html TEXT,
            pdf_url TEXT,
            status TEXT DEFAULT 'ready',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """
    ]

    for sql in tables_sql:
        try:
            supabase.rpc("exec_sql", {"sql": sql.strip()}).execute()
        except Exception as e:
            print(f"Table creation note: {e}")

    print("[OK] Database tables initialized")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting CosmoFolio API...")
    init_database()
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Architecture Portfolio Generator",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 7: Security & Performance Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CacheHeaderMiddleware)
app.add_middleware(RateLimitMiddleware)

# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ArchPortfolio API"}

# ==================== Routes ====================

# Auth routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Project routes
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])

# Asset routes
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])

# Portfolio routes
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["portfolios"])

# Layout routes
app.include_router(layouts.router, prefix="/api/layouts", tags=["layouts"])

# Preview routes
app.include_router(previews.router, prefix="/api/portfolios", tags=["previews"])

# Search routes
app.include_router(search.router, prefix="/api/portfolios", tags=["search"])

# Optimization routes
app.include_router(optimization.router, prefix="/api/portfolios", tags=["optimization"])

# Versioning routes
app.include_router(versioning.router, prefix="/api/portfolios", tags=["versioning"])

# Caching routes
app.include_router(caching.router, prefix="/api/portfolios", tags=["caching"])

# Design system routes
app.include_router(design_system.router, prefix="/api/portfolios", tags=["design-system"])

# Style pack routes
app.include_router(style_pack.router, prefix="/api/portfolios", tags=["style-packs"])

# Layout customization routes
app.include_router(layout_customization.router, prefix="/api/portfolios", tags=["layout"])

# AI generation routes
app.include_router(ai_generation.router, prefix="/api/portfolios", tags=["ai"])

# Preview & Export routes (Phase 5)
app.include_router(preview_export.router, prefix="/api/portfolios", tags=["export"])

# Phase 6: Publication & Sharing
app.include_router(publication.router)
app.include_router(publication.public_router)

# Phase 8: Presentation Sheet Creator
app.include_router(sheets_router.router)   # all /api/sheets/* and /api/projects/{id}/sheets

# ==================== Root ====================

@app.get("/")
async def root():
    return {
        "message": "Welcome to ArchPortfolio Generator API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
