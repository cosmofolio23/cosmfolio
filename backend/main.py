"""
CosmoFolio Backend - FastAPI Server
Minimal startup version with error recovery
"""
import os
import sys
from pathlib import Path

# Set up paths
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Try to load environment variables FIRST
print("[STARTUP] Loading environment variables...")
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[STARTUP] Environment variables loaded")
except Exception as e:
    print(f"[WARNING] Failed to load .env: {e}")

print("[STARTUP] Python path setup complete")
print(f"[STARTUP] Backend directory: {backend_dir}")
print(f"[STARTUP] Files in backend: {len(list(backend_dir.glob('*.py')))}")

# Import FastAPI first (most critical)
print("[STARTUP] Importing FastAPI...")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create app immediately so we have something to serve
app = FastAPI(
    title="CosmoFolio Backend",
    description="Architecture Portfolio Generator API",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://thecosmofolio.com", "https://www.thecosmofolio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Security & Rate Limiting Middlewares (Phase 7: Complete Security Implementation)
try:
    from middleware.rate_limit import RateLimitMiddleware
    from middleware.security import SecurityHeadersMiddleware
    
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    print("[OK] Security and Rate Limiting middlewares registered")
except Exception as e:
    print(f"[WARNING] Failed to register security/rate limit middlewares: {e}")

# Register error handlers so custom exceptions (CosmoFolioException, etc.) return
# proper JSON responses *through* the CORS middleware. Without this, an unhandled
# exception (e.g. a failed asset upload) bubbles to Starlette's ServerErrorMiddleware
# which sits OUTSIDE CORS — the 500 response then lacks Access-Control-Allow-Origin
# and the browser reports a misleading "Failed to fetch" instead of the real error.
try:
    from error_handlers import setup_error_handlers
    setup_error_handlers(app)
    print("[OK] Error handlers registered")
except Exception as e:
    print(f"[WARNING] Failed to register error handlers: {e}")

# Health check endpoint (critical for Render)
@app.get("/health")
async def health():
    return {"status": "ok", "service": "cosmfolio-backend"}

@app.get("/")
async def root():
    return {"message": "CosmoFolio Backend API", "version": "1.0.0"}

@app.get("/docs")
async def docs():
    """Redirect to API documentation"""
    return {"docs": "/docs"}


# Try to load routes (but don't crash if they fail)
print("[STARTUP] Loading core routes...")
core_modules = [
    ("auth", "/api/auth", ["auth"]),
    ("ambassadors", "/api/ambassadors", ["ambassadors"]),
    ("coupons", "/api", ["coupons"]),
    ("payments", "/api/payments", ["payments"]),
    ("projects", "/api/projects", ["projects"]),
    ("assets", "/api/projects", ["assets"]),
    ("documents", "/api/projects", ["documents"]),
    ("publication", "", ["publication"]),  # prefix already defined in router
    ("portfolios", "/api/portfolios", ["portfolios"]),
    ("search", "/api/portfolios", ["search"]),
    ("versioning", "/api/portfolios", ["versioning"]),
    ("portfolio_pages", "/api/portfolios", ["portfolio-pages"]),
    ("layout_customization", "/api/portfolios", ["layout-customization"]),
    ("optimization", "/api/portfolios", ["optimization"]),
    ("preview_export", "/api/portfolios", ["preview-export"]),
    ("monitoring", "/api/monitoring", ["monitoring"])
]

import importlib
for mod_name, prefix, tags in core_modules:
    try:
        mod = importlib.import_module(f"routes.{mod_name}")
        
        # Special case for publication which has two routers
        if mod_name == "publication":
            app.include_router(mod.router, tags=tags)
            app.include_router(mod.public_router, prefix="/api/portfolios", tags=["public-portfolios"])
        else:
            app.include_router(mod.router, prefix=prefix, tags=tags)
            
        print(f"[OK] Loaded route: {mod_name}")
    except Exception as e:
        print(f"[WARNING] Failed to load route {mod_name}: {type(e).__name__}: {e}")

# Optional: Try to load more routes
print("[STARTUP] Loading additional routes...")
try:
    from routes import layouts, design_system, ai_generation, previews, style_pack, templates, debug
    app.include_router(layouts.router, prefix="/api/layouts", tags=["layouts"])
    app.include_router(design_system.router, prefix="/api/design", tags=["design"])
    app.include_router(ai_generation.router, prefix="/api/ai", tags=["ai"])
    app.include_router(previews.router, prefix="/api/previews", tags=["previews"])
    app.include_router(style_pack.router, prefix="/api/portfolios", tags=["style-packs"])  # routes: /{portfolio_id}/style-packs
    app.include_router(templates.router, tags=["templates"])  # routes: /api/templates/... (Phase 4)
    app.include_router(debug.router, prefix="/api/debug", tags=["debug"])
    print("[OK] Additional routes loaded")

    # Library (premium) — routes already carry their own /api/library prefix
    try:
        from routes import library
        app.include_router(library.router, tags=["library"])
        print("[OK] Library routes loaded")
    except Exception as e:
        print(f"[WARNING] Library routes failed to load: {e}")

    # Sheet Sets (COSMO SHEET persistence) — routes carry their own /api prefix
    try:
        from routes import sheet_sets
        app.include_router(sheet_sets.router, tags=["sheet-sets"])
        print("[OK] Sheet-set routes loaded")
    except Exception as e:
        print(f"[WARNING] Sheet-set routes failed to load: {e}")

    # Support / Contact route
    try:
        from routes import support
        app.include_router(support.router, prefix="/api/support", tags=["support"])
        print("[OK] Support routes loaded")
    except Exception as e:
        print(f"[WARNING] Support routes failed to load: {e}")

except Exception as e:
    print(f"[WARNING] Some additional routes failed: {e}")

print("[STARTUP] Application ready!")
print("[STARTUP] Server will start listening on 0.0.0.0:8000")

@app.on_event("startup")
async def startup_event():
    import asyncio
    try:
        from tasks import weekly_report_loop
        asyncio.create_task(weekly_report_loop())
        print("[OK] Background tasks started")
    except Exception as e:
        print(f"[WARNING] Failed to start background tasks: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
