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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Try to load environment variables
print("[STARTUP] Loading environment variables...")
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[STARTUP] Environment variables loaded")
except Exception as e:
    print(f"[WARNING] Failed to load .env: {e}")

# Try to load routes (but don't crash if they fail)
print("[STARTUP] Loading routes...")
try:
    from routes import auth, projects, assets, portfolios, publication, documents
    print("[OK] Core routes loaded")

    # Include routers - each prefix carefully chosen based on routes inside the file
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])  # routes: /signup, /me, etc.
    app.include_router(projects.router, prefix="/api/projects", tags=["projects"])  # routes: "", /{id}
    app.include_router(assets.router, prefix="/api/projects", tags=["assets"])  # routes: /{portfolio_id}/assets/...
    app.include_router(documents.router, prefix="/api/projects", tags=["documents"])  # routes: /{project_id}/document
    app.include_router(portfolios.router, prefix="/api/portfolios", tags=["portfolios"])  # routes: /{project_id}/generate
    app.include_router(publication.router, prefix="/api/portfolios", tags=["publication"])  # routes: /{portfolio_id}/publish

except Exception as e:
    print(f"[WARNING] Failed to load some routes: {type(e).__name__}: {e}")
    print("[INFO] App will run with basic endpoints only")

# Optional: Try to load more routes
print("[STARTUP] Loading additional routes...")
try:
    from routes import sheets, layouts, design_system, ai_generation, previews, style_pack, templates
    app.include_router(sheets.router, tags=["sheets"])  # routes already have /api/... prefix
    app.include_router(layouts.router, prefix="/api/layouts", tags=["layouts"])
    app.include_router(design_system.router, prefix="/api/design", tags=["design"])
    app.include_router(ai_generation.router, prefix="/api/ai", tags=["ai"])
    app.include_router(previews.router, prefix="/api/previews", tags=["previews"])
    app.include_router(style_pack.router, prefix="/api/portfolios", tags=["style-packs"])  # routes: /{portfolio_id}/style-packs
    app.include_router(templates.router, tags=["templates"])  # routes: /api/templates/... (Phase 4)
    print("[OK] Additional routes loaded")
except Exception as e:
    print(f"[WARNING] Some additional routes failed: {e}")

print("[STARTUP] Application ready!")
print("[STARTUP] Server will start listening on 0.0.0.0:8000")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
