"""
Portfolio document persistence.

Stores the full composer document (pages, blocks, design tokens) as a JSON
file in Supabase Storage, keyed by project id. No schema migration required.
"""
from fastapi import APIRouter, HTTPException, status, Header, Body
from datetime import datetime

from .deps import get_current_user
from database import supabase
from services.storage import get_storage_client

router = APIRouter()


def _verify_owner(project_id: str, user_id: str):
    proj = supabase.table("projects").select("user_id").eq("id", project_id).execute()
    if not proj.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if proj.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


def _doc_path(project_id: str) -> str:
    return f"documents/{project_id}.json"


@router.put("/{project_id}/document")
async def save_document(
    project_id: str,
    document: dict = Body(...),
    authorization: str = Header(None),
):
    """Persist the composer document for a project."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        storage = get_storage_client()
        url = await storage.upload_json(_doc_path(project_id), document)
        supabase.table("projects").update(
            {"updated_at": datetime.utcnow().isoformat()}
        ).eq("id", project_id).execute()
        return {"ok": True, "url": url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to save document: {e}")


@router.get("/{project_id}/document")
async def get_document(project_id: str, authorization: str = Header(None)):
    """Load the composer document for a project (or exists=false)."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        doc = await get_storage_client().download_json(_doc_path(project_id))
        return {"exists": doc is not None, "document": doc}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to load document: {e}")


@router.post("/{project_id}/document/health")
async def check_storage_health(project_id: str, authorization: str = Header(None)):
    """Check if storage is healthy (can write JSON documents). Used by frontend to validate config."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        storage = get_storage_client()
        # Try to write a tiny health-check document
        test_doc = {"health": "ok", "timestamp": datetime.utcnow().isoformat()}
        test_path = f"_health/{project_id}.json"
        await storage.upload_json(test_path, test_doc)
        return {"ok": True, "message": "Storage is healthy"}
    except Exception as e:
        error_msg = str(e).lower()
        if "permission" in error_msg or "denied" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Storage access denied. Check bucket configuration.")
        if "bucket" in error_msg or "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage bucket not found.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Storage error: {str(e)[:100]}")
