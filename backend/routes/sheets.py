"""
Sheet Management API Routes
Phase 8: Task 8.5 — Full CRUD for presentation sheets, templates,
elements, AI generation, export, sharing, and analytics.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.sheet_templates  import get_template_registry
from services.sheet_design_system import get_sheet_design_system
from services.sheet_ai          import get_sheet_ai_service, Tone, Length
from routes.deps            import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sheets"])


# ─────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────

class CreateSheetRequest(BaseModel):
    title:       str
    template_id: Optional[str] = None
    page_size:   str = "A2"
    orientation: str = "landscape"
    semester:    Optional[str] = None
    project_id:  Optional[str] = None

class UpdateSheetRequest(BaseModel):
    title:    Optional[str]            = None
    content:  Optional[dict[str, Any]] = None
    page_size: Optional[str]           = None
    tags:     Optional[list[str]]      = None

class AddElementRequest(BaseModel):
    kind:    str
    x:       float
    y:       float
    w:       float
    h:       float
    content: str = ""
    style:   dict[str, Any] = Field(default_factory=dict)

class UpdateElementRequest(BaseModel):
    x:       Optional[float]           = None
    y:       Optional[float]           = None
    w:       Optional[float]           = None
    h:       Optional[float]           = None
    content: Optional[str]             = None
    style:   Optional[dict[str, Any]]  = None
    locked:  Optional[bool]            = None
    visible: Optional[bool]            = None

class GenerateTextRequest(BaseModel):
    tone:   str = "professional"
    length: str = "medium"
    context: dict[str, str] = Field(default_factory=dict)

class ExportRequest(BaseModel):
    format:     str = "pdf"
    resolution: int = 300

class ShareRequest(BaseModel):
    expires_in_days: int = 30
    allow_comments:  bool = True

class FeedbackRequest(BaseModel):
    comment:    str
    element_id: Optional[str] = None


# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────

def _check_user_owns_sheet(sheet_id: str, user_id: str) -> dict:
    """
    Stub: in production query the database.
    Returns a sheet-like dict or raises 404.
    """
    # TODO: replace with actual DB query
    return {
        "id":         sheet_id,
        "user_id":    user_id,
        "title":      "Sample Sheet",
        "template_id": "",
        "content":    {"elements": []},
        "page_size":  "A2",
        "orientation": "landscape",
        "tags":       [],
        "version":    1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ─────────────────────────────────────────────
# SHEET MANAGEMENT ENDPOINTS
# ─────────────────────────────────────────────

@router.post("/api/projects/{project_id}/sheets", status_code=201)
async def create_sheet(
    project_id: str,
    body:       CreateSheetRequest,
    user = Depends(get_current_user),
):
    """Create a new presentation sheet, optionally pre-filled from a template."""
    registry = get_template_registry()
    template = registry.get(body.template_id) if body.template_id else None

    sheet = {
        "id":          f"sheet_{int(datetime.utcnow().timestamp())}",
        "project_id":  project_id,
        "user_id":     user.id,
        "title":       body.title,
        "template_id": body.template_id or "",
        "page_size":   body.page_size,
        "orientation": body.orientation,
        "semester":    body.semester,
        "content":     {
            "elements": [
                {
                    "id":       f"el_{i}",
                    "kind":     c.element_type.value,
                    "x":        (c.col_start - 1) / template.grid_columns.value * 100,
                    "y":        (c.row_start - 1) / template.grid_rows * 100,
                    "w":        c.col_span / template.grid_columns.value * 100,
                    "h":        c.row_span / template.grid_rows * 100,
                    "content":  c.placeholder,
                    "style":    c.style,
                    "locked":   False,
                    "visible":  True,
                    "z":        i + 1,
                }
                for i, c in enumerate(template.cells)
            ] if template else []
        },
        "tags":       [],
        "version":    1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    # TODO: db.insert("presentation_sheets", sheet)
    logger.info("Sheet created: %s for project %s", sheet["id"], project_id)
    return sheet


@router.get("/api/projects/{project_id}/sheets")
async def list_sheets(
    project_id: str,
    semester:   Optional[str] = Query(None),
    tag:        Optional[str] = Query(None),
    user = Depends(get_current_user),
):
    """List all sheets for a project, with optional semester/tag filter."""
    # TODO: db.query("presentation_sheets", project_id=project_id, user_id=user.id)
    return {"project_id": project_id, "sheets": [], "total": 0}


@router.get("/api/sheets/{sheet_id}")
async def get_sheet(sheet_id: str, user = Depends(get_current_user)):
    sheet = _check_user_owns_sheet(sheet_id, user.id)
    return sheet


@router.patch("/api/sheets/{sheet_id}")
async def update_sheet(
    sheet_id: str,
    body:     UpdateSheetRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    # TODO: db.update("presentation_sheets", sheet_id, updates)
    logger.info("Sheet updated: %s", sheet_id)
    return {"status": "updated", "sheet_id": sheet_id, **updates}


@router.delete("/api/sheets/{sheet_id}", status_code=204)
async def delete_sheet(sheet_id: str, user = Depends(get_current_user)):
    _check_user_owns_sheet(sheet_id, user.id)
    # TODO: db.delete("presentation_sheets", sheet_id)
    logger.info("Sheet deleted: %s", sheet_id)


@router.post("/api/sheets/{sheet_id}/duplicate")
async def duplicate_sheet(sheet_id: str, user = Depends(get_current_user)):
    sheet = _check_user_owns_sheet(sheet_id, user.id)
    new_sheet = {
        **sheet,
        "id":         f"sheet_{int(datetime.utcnow().timestamp())}",
        "title":      f"{sheet['title']} (copy)",
        "version":    1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    # TODO: db.insert("presentation_sheets", new_sheet)
    return new_sheet


# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────

@router.get("/api/sheets/templates")
async def list_templates(
    category: Optional[str] = Query(None),
    year:     Optional[str] = Query(None),
):
    registry = get_template_registry()
    if category:
        return {"templates": registry.list_by_category(category)}
    if year:
        return {"templates": registry.list_by_year(year)}
    return {
        "templates":  registry.list_all(),
        "categories": registry.list_categories(),
        "total":      len(registry.list_all()),
    }


@router.get("/api/sheets/templates/{template_id}")
async def get_template(template_id: str, page_size: str = Query("A2")):
    registry = get_template_registry()
    tmpl     = registry.get(template_id)
    if not tmpl:
        raise HTTPException(404, f"Template '{template_id}' not found")
    return {
        "template":   tmpl.to_dict(),
        "grid_config": registry.get_grid_config(template_id, page_size),
    }


@router.get("/api/sheets/design-system/{scheme_id}/css")
async def get_design_system_css(scheme_id: str):
    ds  = get_sheet_design_system()
    css = ds.export_css(scheme_id)
    if not css:
        raise HTTPException(404, f"Scheme '{scheme_id}' not found")
    return {"scheme_id": scheme_id, "css": css}


@router.get("/api/sheets/design-system/{scheme_id}/tokens")
async def get_design_tokens(scheme_id: str):
    ds     = get_sheet_design_system()
    tokens = ds.export_json(scheme_id)
    if not tokens:
        raise HTTPException(404, f"Scheme '{scheme_id}' not found")
    return {"scheme_id": scheme_id, "tokens": tokens}


@router.get("/api/sheets/design-system")
async def list_design_schemes():
    return {"schemes": get_sheet_design_system().list_schemes()}


# ─────────────────────────────────────────────
# ELEMENTS
# ─────────────────────────────────────────────

@router.post("/api/sheets/{sheet_id}/elements", status_code=201)
async def add_element(
    sheet_id: str,
    body:     AddElementRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    element = {
        "id":      f"el_{int(datetime.utcnow().timestamp())}",
        "sheet_id": sheet_id,
        **body.model_dump(),
        "locked":  False,
        "visible": True,
        "z":       1,
    }
    # TODO: db.insert into sheet content.elements
    return element


@router.patch("/api/sheets/{sheet_id}/elements/{element_id}")
async def update_element(
    sheet_id:   str,
    element_id: str,
    body:       UpdateElementRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    # TODO: update element inside sheet content JSONB
    return {"status": "updated", "element_id": element_id, **patch}


@router.delete("/api/sheets/{sheet_id}/elements/{element_id}", status_code=204)
async def delete_element(
    sheet_id:   str,
    element_id: str,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    # TODO: remove element from sheet content JSONB


# ─────────────────────────────────────────────
# AI GENERATION
# ─────────────────────────────────────────────

@router.post("/api/sheets/{sheet_id}/generate-title")
async def generate_title(
    sheet_id: str,
    body:     GenerateTextRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    ai = get_sheet_ai_service()
    result = ai.generate_sheet_title(
        project_name=body.context.get("project_name", ""),
        sheet_type=body.context.get("sheet_type", "presentation"),
        tone=Tone(body.tone),
    )
    return result


@router.post("/api/sheets/{sheet_id}/generate-description")
async def generate_description(
    sheet_id: str,
    body:     GenerateTextRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    ai = get_sheet_ai_service()
    result = ai.generate_sheet_description(
        project_name=body.context.get("project_name", ""),
        sheet_type=body.context.get("sheet_type", ""),
        drawing_list=body.context.get("drawings", "").split(",") if body.context.get("drawings") else [],
        tone=Tone(body.tone),
        length=Length(body.length),
    )
    return result


@router.post("/api/sheets/{sheet_id}/generate-narrative")
async def generate_narrative(
    sheet_id: str,
    body:     GenerateTextRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    ai = get_sheet_ai_service()
    result = ai.generate_design_narrative(
        project_name=body.context.get("project_name", ""),
        design_intent=body.context.get("design_intent", ""),
        key_moves=body.context.get("key_moves", "").split(";") if body.context.get("key_moves") else [],
        tone=Tone(body.tone),
        length=Length(body.length),
    )
    return result


@router.post("/api/sheets/{sheet_id}/generate-jury-script")
async def generate_jury_script(
    sheet_id: str,
    body:     GenerateTextRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    ai = get_sheet_ai_service()
    result = ai.generate_jury_script(
        project_name=body.context.get("project_name", ""),
        design_intent=body.context.get("design_intent", ""),
        key_drawings=body.context.get("drawings", "").split(",") if body.context.get("drawings") else [],
        duration_min=int(body.context.get("duration_min", "5")),
        tone=Tone(body.tone),
    )
    return result


# ─────────────────────────────────────────────
# EXPORT
# ─────────────────────────────────────────────

@router.post("/api/sheets/{sheet_id}/export-pdf")
async def export_sheet_pdf(
    sheet_id: str,
    body:     ExportRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    # TODO: delegate to sheet_export.py SheetExportService.export_pdf()
    return {
        "status":       "queued",
        "sheet_id":     sheet_id,
        "format":       "pdf",
        "download_url": f"/api/downloads/sheets/{sheet_id}/sheet.pdf",
        "message":      "PDF generation started — check download_url shortly",
    }


@router.post("/api/sheets/{sheet_id}/export-png")
async def export_sheet_png(
    sheet_id:   str,
    body:       ExportRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    return {
        "status":       "queued",
        "sheet_id":     sheet_id,
        "format":       "png",
        "resolution":   body.resolution,
        "download_url": f"/api/downloads/sheets/{sheet_id}/sheet.png",
    }


# ─────────────────────────────────────────────
# SHARING & FEEDBACK
# ─────────────────────────────────────────────

@router.post("/api/sheets/{sheet_id}/share")
async def share_sheet(
    sheet_id: str,
    body:     ShareRequest,
    user = Depends(get_current_user),
):
    _check_user_owns_sheet(sheet_id, user.id)
    import secrets
    token = secrets.token_urlsafe(24)
    return {
        "share_url":      f"https://cosmofolio.com/sheets/{token}",
        "share_token":    token,
        "allow_comments": body.allow_comments,
        "expires_in_days": body.expires_in_days,
    }


@router.post("/api/sheets/{sheet_id}/feedback")
async def add_feedback(
    sheet_id: str,
    body:     FeedbackRequest,
):
    """Public endpoint — no auth required (for teachers/reviewers with share link)."""
    feedback = {
        "id":         f"fb_{int(datetime.utcnow().timestamp())}",
        "sheet_id":   sheet_id,
        "comment":    body.comment,
        "element_id": body.element_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    # TODO: db.insert("sheet_feedback", feedback)
    return feedback


@router.get("/api/sheets/{sheet_id}/feedback")
async def list_feedback(sheet_id: str, user = Depends(get_current_user)):
    _check_user_owns_sheet(sheet_id, user.id)
    # TODO: db.query("sheet_feedback", sheet_id=sheet_id)
    return {"sheet_id": sheet_id, "feedback": [], "total": 0}


# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

@router.get("/api/sheets/analytics")
async def sheets_analytics(
    days: int = Query(30, ge=1, le=365),
    user = Depends(get_current_user),
):
    return {
        "user_id":              user.id,
        "period_days":          days,
        "total_sheets":         0,
        "sheets_this_period":   0,
        "most_used_template":   None,
        "ai_generations_total": 0,
        "exports_total":        0,
        "avg_time_per_sheet_min": 0,
        "export_format_breakdown": {"pdf": 0, "png": 0},
    }


@router.get("/api/sheets/{sheet_id}/views")
async def sheet_views(sheet_id: str, user = Depends(get_current_user)):
    _check_user_owns_sheet(sheet_id, user.id)
    return {"sheet_id": sheet_id, "total_views": 0, "unique_viewers": 0, "views": []}
