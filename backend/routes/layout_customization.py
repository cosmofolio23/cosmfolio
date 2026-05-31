"""
Layout customization API endpoints
Phase 3: Task 3.3 - Templates, variations, customization
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from routes.deps import get_current_user
from services.layout_customization import get_layout_customization_service
from error_handlers import ResourceNotFoundException, AuthorizationException
from database import supabase

router = APIRouter()

# ==================== LAYOUT CONFIGURATION ====================

@router.post("/{portfolio_id}/pages/{page_id}/layout")
async def create_layout_config(
    portfolio_id: str,
    page_id: str,
    template: str,
    columns: int = Query(1, ge=1, le=4),
    gap: int = Query(20, ge=0, le=100),
    padding: int = Query(20, ge=0, le=100),
    background_color: Optional[str] = Query(None, regex="^#[0-9a-fA-F]{6}$"),
    current_user: dict = Depends(get_current_user)
):
    """Create layout configuration for page"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        config = await layout_service.create_layout_config(
            page_id, portfolio_id, template, columns, gap, padding, background_color
        )

        return {"portfolio_id": portfolio_id, "page_id": page_id, "layout": config}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{portfolio_id}/pages/{page_id}/layout")
async def get_layout_config(
    portfolio_id: str,
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get page layout configuration"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        config = await layout_service.get_layout_config(page_id)

        return {"portfolio_id": portfolio_id, "page_id": page_id, "layout": config}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== LAYOUT VARIANTS ====================

@router.post("/{portfolio_id}/layout-variants")
async def create_layout_variant(
    portfolio_id: str,
    name: str = Query(...),
    description: Optional[str] = Query(None),
    template: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Create layout variant/preset"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        variant = await layout_service.create_layout_variant(
            portfolio_id, name, description, template, {}
        )

        return {"portfolio_id": portfolio_id, "variant": variant}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{portfolio_id}/layout-variants")
async def list_layout_variants(
    portfolio_id: str,
    featured_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """List layout variants for portfolio"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        variants = await layout_service.list_layout_variants(portfolio_id, featured_only)

        return {"portfolio_id": portfolio_id, "variants": variants, "total": len(variants)}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== RECOMMENDATIONS ====================

@router.post("/{portfolio_id}/recommend-layout")
async def recommend_layout(
    portfolio_id: str,
    asset_count: int = Query(..., ge=1),
    asset_types: List[str] = Query([]),
    preferred_style: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get layout recommendations based on assets"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        recommendations = layout_service.recommend_layout(
            asset_count, asset_types, preferred_style
        )

        return {"portfolio_id": portfolio_id, "recommendations": recommendations}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== TEMPLATES ====================

@router.get("/layout-templates")
async def list_layout_templates(
    current_user: dict = Depends(get_current_user)
):
    """List all available layout templates"""
    layout_service = get_layout_customization_service()
    templates = layout_service.list_all_templates()
    return {"templates": templates, "total": len(templates)}

@router.get("/layout-templates/{template}")
async def get_template(
    template: str,
    current_user: dict = Depends(get_current_user)
):
    """Get template details"""
    layout_service = get_layout_customization_service()
    details = layout_service.get_template_details(template)
    if not details:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"template": details}

@router.get("/{portfolio_id}/layout-presets")
async def get_layout_presets(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get layout presets grouped by template"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        presets = layout_service.get_layout_presets()

        return {"portfolio_id": portfolio_id, "presets": presets}

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== EXPORT ====================

@router.post("/{portfolio_id}/pages/{page_id}/export-layout")
async def export_layout(
    portfolio_id: str,
    page_id: str,
    format: str = Query("html", regex="^(html|json|css)$"),
    current_user: dict = Depends(get_current_user)
):
    """Export layout configuration"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        layout_service = get_layout_customization_service()
        config = await layout_service.get_layout_config(page_id)
        if not config:
            raise ResourceNotFoundException("Layout", page_id)

        if format == "html":
            content = layout_service.generate_layout_html(
                config["template"], config["columns"], config["gap"], config["padding"]
            )
        else:  # json or css
            content = layout_service.generate_layout_json(
                config["template"], config["columns"], config["gap"], config["padding"]
            )

        return {
            "portfolio_id": portfolio_id,
            "page_id": page_id,
            "format": format,
            "content": content
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
