from fastapi import APIRouter
import os

router = APIRouter(prefix="/api/debug", tags=["debug"])

@router.get("/env")
async def get_env_debug():
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return {
        "key_length": len(key),
        "starts_with": key[:15] if key else "EMPTY",
        "ends_with": key[-5:] if key else "EMPTY",
        "has_quotes": key.startswith('"') or key.startswith("'"),
        "has_spaces": key.startswith(' ') or key.endswith(' '),
        "is_sb_secret": key.startswith("sb_secret_"),
        "supabase_url": os.getenv("SUPABASE_URL", "NOT_SET")
    }
