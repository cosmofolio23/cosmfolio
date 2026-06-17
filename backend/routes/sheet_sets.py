"""
Sheet Sets API — persistence for COSMO SHEET.

The rich SheetSet model lives in the frontend (TypeScript); this is a generic
JSON store. A sheet set belongs to a project (route param) and optionally links
back to a Library project (library_project_id) when generated "from library".
"""

from fastapi import APIRouter, HTTPException, Depends, Response
from typing import Optional
from datetime import datetime
from uuid import uuid4

from .deps import get_current_user
from database import supabase
from services.sheet_export import get_sheet_export_service

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

@router.post("/api/projects/{project_id}/sheet-sets/{set_id}/export")
async def export_sheet_set(project_id: str, set_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Export a sheet layout as a PDF."""
    html = payload.get("html", "")
    page_size = payload.get("page_size", "A2")
    orientation = payload.get("orientation", "landscape")
    
    export_svc = get_sheet_export_service()
    result = export_svc.export_pdf(
        sheet_id=set_id,
        sheet_html=html,
        page_size=page_size,
        orientation=orientation
    )
    
    return Response(
        content=result["binary"],
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={result['filename']}"}
    )

@router.post("/api/projects/{project_id}/sheet-sets/{set_id}/ai-compose")
async def ai_compose_sheet(project_id: str, set_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Apply architectural layout heuristic rules to a sheet."""
    command = payload.get("command")
    sheet = payload.get("sheet", {})
    
    elements = sheet.get("elements", [])
    
    if command == "fix-alignment":
        for el in elements:
            el["x"] = round(float(el.get("x", 0)) / 5) * 5
            el["y"] = round(float(el.get("y", 0)) / 5) * 5
    elif command == "make-jury-style":
        for el in elements:
            if el.get("kind") == "text":
                text_obj = el.get("text", {})
                text_obj["fontFamily"] = "Times New Roman"
                if text_obj.get("role") in ["title", "heading"]:
                    text_obj["content"] = str(text_obj.get("content", "")).upper()
                el["text"] = text_obj
    elif command == "improve-white-space":
        for el in elements:
            w = float(el.get("w", 0))
            h = float(el.get("h", 0))
            if w > 0 and h > 0:
                el["w"] = w * 0.9
                el["h"] = h * 0.9
                el["x"] = float(el.get("x", 0)) + (w * 0.05)
                el["y"] = float(el.get("y", 0)) + (h * 0.05)
                
    sheet["elements"] = elements
    return sheet

@router.post("/api/projects/{project_id}/sheet-sets/{set_id}/auto-fill")
async def auto_fill_sheet_set(project_id: str, set_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """AI Auto-fill: Matches project assets to sheet template slots."""
    sheet_set = payload.get("sheetSet", {})
    
    # 1. Fetch available assets for this project
    assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
    assets = assets_resp.data or []
    
    used_asset_ids = set()
    sheets = sheet_set.get("sheets", [])
    
    for sheet in sheets:
        layout = sheet.get("layout", {})
        slots = layout.get("slotDefinitions", [])
        
        grid_cols = layout.get("columnCount", 2)
        grid_rows = layout.get("rowCount", 2)
        cell_w = 100 / max(1, grid_cols)
        cell_h = 100 / max(1, grid_rows)
        
        for idx, slot in enumerate(slots):
            needs_type = slot.get("needsDrawingType")
            if not needs_type:
                continue
                
            matched_asset = None
            for asset in assets:
                if asset.get("id") not in used_asset_ids and asset.get("asset_type") == needs_type:
                    matched_asset = asset
                    used_asset_ids.add(asset.get("id"))
                    break
            
            if matched_asset:
                frame = slot.get("frame")
                if frame:
                    x, y, w, h = frame.get("x", 0), frame.get("y", 0), frame.get("w", 40), frame.get("h", 40)
                else:
                    col = idx % grid_cols
                    row = (idx // grid_cols) % grid_rows
                    x, y = col * cell_w + 5, row * cell_h + 5
                    w, h = cell_w - 10, cell_h - 10
                
                new_element = {
                    "id": f"elem-{uuid4()}",
                    "kind": "drawing",
                    "x": x,
                    "y": y,
                    "w": w,
                    "h": h,
                    "z": 10,
                    "locked": False,
                    "visible": True,
                    "drawing": {
                        "drawingName": matched_asset.get("title") or "Auto-placed Drawing",
                        "drawingType": needs_type,
                        "originalScale": slot.get("recommendedScale", "1:100"),
                        "sheetScale": slot.get("recommendedScale", "1:100"),
                        "url": matched_asset.get("file_url", ""),
                        "vector": False
                    }
                }
                sheet.setdefault("elements", []).append(new_element)
                
    sheet_set["sheets"] = sheets
    return sheet_set
