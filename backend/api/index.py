"""
Vercel Serverless Entry Point
Routes FastAPI requests to main application
"""
import sys
from pathlib import Path

# Add parent directory to path to import main
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the main FastAPI app with all routes
from main import app

# Export for Vercel
__all__ = ["app"]
