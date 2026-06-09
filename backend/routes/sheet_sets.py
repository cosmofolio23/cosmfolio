"""
Sheet Sets API — persistence for COSMO SHEET.

The rich SheetSet model lives in the frontend (TypeScript); this is a generic
JSON store. A sheet set belongs to a project (route param) and optionally links
back to a Library project (library_project_id) when generated "from library".
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from uuid import uuid4

from .deps import get_current_user
from database import supabase

router = APIRouter()


def _summary(row: dict) -> dict:
    """Return the stored SheetSet object (merged with its row id) for the frontend."""
    data = row.get("data") or {}
    if isinstance(data, dict):
        return {**data, "id": row["id"], "library_project_id": row.get("library_project_id")}
    return {"id": row["id"]}


@router.get("/api/sheet-sets")
async def list_all_sheet_sets(current_user: dict = Depends(get_current_user), library_project_id: str = None):
    """List all sheet sets owned by the user, optionally filtered by library_project_id.

    Used by the Library project page to show outputs generated from a specific library project.
    """
    query = supabase.table("sheet_sets").select("*").eq("user_id", current_user["user_id"])
    if library_project_id:
        query = query.eq("library_project_id", library_project_id)
    rows = query.order("updated_at", desc=True).execute().data or []
    return [_summary(r) for r in rows]


@router.get("/api/projects/{project_id}/sheet-sets")
async def list_sheet_sets(project_id: str, current_user: dict = Depends(get_current_user)):
    rows = (
        supabase.table("sheet_sets").select("*")
        .eq("project_id", project_id).eq("user_id", current_user["user_id"])
        .order("updated_at", desc=True).execute()
    ).data or []
    return [_summary(r) for r in rows]


@router.get("/api/projects/{project_id}/sheet-sets/{set_id}")
async def get_sheet_set(project_id: str, set_id: str, current_user: dict = Depends(get_current_user)):
    rows = (
        supabase.table("sheet_sets").select("*")
        .eq("id", set_id).eq("user_id", current_user["user_id"]).execute()
    ).data
    if not rows:
        raise HTTPException(status_code=404, detail="Sheet set not found")
    return _summary(rows[0])


@router.post("/api/projects/{project_id}/sheet-sets", status_code=201)
async def create_sheet_set(project_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Body: { name?, data (full SheetSet), library_project_id?, submission_type? }."""
    now = datetime.utcnow().isoformat()
    data = payload.get("data") or payload  # tolerate the whole body being the SheetSet
    sheets = data.get("sheets") if isinstance(data, dict) else None
    row = {
        "id": str(uuid4()),
        "project_id": project_id,
        "user_id": current_user["user_id"],
        "library_project_id": payload.get("library_project_id"),
        "name": payload.get("name") or (data.get("projectName") if isinstance(data, dict) else None) or "Sheet Set",
        "submission_type": payload.get("submission_type") or (data.get("submissionType") if isinstance(data, dict) else None),
        "sheet_count": len(sheets) if isinstance(sheets, list) else 0,
        "data": data,
        "created_at": now,
        "updated_at": now,
    }
    resp = supabase.table("sheet_sets").insert(row).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create sheet set")
    return _summary(resp.data[0])


@router.put("/api/projects/{project_id}/sheet-sets/{set_id}")
async def update_sheet_set(project_id: str, set_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Body is the full SheetSet object (the editor PUTs the whole thing)."""
    existing = (
        supabase.table("sheet_sets").select("id")
        .eq("id", set_id).eq("user_id", current_user["user_id"]).execute()
    ).data
    if not existing:
        raise HTTPException(status_code=404, detail="Sheet set not found")

    data = payload.get("data") or payload
    sheets = data.get("sheets") if isinstance(data, dict) else None
    update = {
        "data": data,
        "name": (data.get("projectName") if isinstance(data, dict) else None) or "Sheet Set",
        "sheet_count": len(sheets) if isinstance(sheets, list) else 0,
        "updated_at": datetime.utcnow().isoformat(),
    }
    resp = supabase.table("sheet_sets").update(update).eq("id", set_id).execute()
    return _summary(resp.data[0]) if resp.data else {}


@router.delete("/api/projects/{project_id}/sheet-sets/{set_id}", status_code=204)
async def delete_sheet_set(project_id: str, set_id: str, current_user: dict = Depends(get_current_user)):
    existing = (
        supabase.table("sheet_sets").select("id")
        .eq("id", set_id).eq("user_id", current_user["user_id"]).execute()
    ).data
    if not existing:
        raise HTTPException(status_code=404, detail="Sheet set not found")
    supabase.table("sheet_sets").delete().eq("id", set_id).execute()
