"""
Template API Routes
Endpoints for portfolio and sheet templates
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from models import (
    PortfolioTemplateResponse,
    PortfolioTemplateList,
    SheetTemplateResponse,
    SheetTemplateList,
    TemplateFilterQuery,
)
from database import supabase

router = APIRouter(prefix="/api/templates", tags=["templates"])

# ============================================================
# Portfolio Templates
# ============================================================

@router.get("/portfolios", response_model=PortfolioTemplateList)
async def get_portfolio_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(None, description="Filter by source (ai-generated, archifolio)"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    limit: int = Query(50, ge=1, le=500, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get all portfolio templates with optional filtering
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Build query
        query = supabase.table("portfolio_templates").select("*")

        # Apply filters
        if category:
            query = query.eq("category", category)
        if source:
            query = query.eq("source", source)

        # Execute query
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        templates = [PortfolioTemplateResponse(**item) for item in response.data]

        # Get total count
        count_response = supabase.table("portfolio_templates").select("id", count="exact").execute()
        total = len(count_response.data) if count_response.data else 0

        return PortfolioTemplateList(total=total, templates=templates)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/portfolios/{template_id}", response_model=PortfolioTemplateResponse)
async def get_portfolio_template(template_id: str):
    """
    Get a specific portfolio template by ID
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        response = supabase.table("portfolio_templates").select("*").eq("id", template_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Template not found")

        return PortfolioTemplateResponse(**response.data[0])

    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Template not found")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/portfolios/categories", response_model=List[str])
async def get_portfolio_categories():
    """
    Get all available portfolio template categories
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        response = supabase.table("portfolio_templates").select("category").execute()
        categories = list(set([item["category"] for item in response.data if item.get("category")]))
        return sorted(categories)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# Sheet Templates
# ============================================================

@router.get("/sheets", response_model=SheetTemplateList)
async def get_sheet_templates(
    sheet_type: Optional[str] = Query(None, description="Filter by sheet type (concept, plan, section, etc)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    format: Optional[str] = Query(None, description="Filter by format (A0, A1, A2, etc)"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    limit: int = Query(50, ge=1, le=500, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get all sheet templates with optional filtering
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Build query
        query = supabase.table("sheet_templates").select("*")

        # Apply filters
        if sheet_type:
            query = query.eq("sheet_type", sheet_type)
        if category:
            query = query.eq("category", category)
        if format:
            query = query.eq("format", format)

        # Execute query
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        templates = [SheetTemplateResponse(**item) for item in response.data]

        # Get total count
        count_response = supabase.table("sheet_templates").select("id", count="exact").execute()
        total = len(count_response.data) if count_response.data else 0

        return SheetTemplateList(total=total, templates=templates)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sheets/{template_id}", response_model=SheetTemplateResponse)
async def get_sheet_template(template_id: str):
    """
    Get a specific sheet template by ID
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        response = supabase.table("sheet_templates").select("*").eq("id", template_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Template not found")

        return SheetTemplateResponse(**response.data[0])

    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Template not found")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sheets/types", response_model=List[str])
async def get_sheet_types():
    """
    Get all available sheet template types
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        response = supabase.table("sheet_templates").select("sheet_type").execute()
        sheet_types = list(set([item["sheet_type"] for item in response.data if item.get("sheet_type")]))
        return sorted(sheet_types)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sheets/formats", response_model=List[str])
async def get_sheet_formats():
    """
    Get all available sheet formats
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        response = supabase.table("sheet_templates").select("format").execute()
        formats = list(set([item["format"] for item in response.data if item.get("format")]))
        return sorted(formats)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# Template Compatibility
# ============================================================

@router.get("/compatibility/{portfolio_id}")
async def get_compatible_sheets(portfolio_id: str, limit: int = Query(10, ge=1, le=50)):
    """
    Get recommended sheet templates for a portfolio template
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Get compatibility mappings
        response = supabase.table("template_compatibility")\
            .select("sheet_template_id, compatibility_score")\
            .eq("portfolio_template_id", portfolio_id)\
            .order("compatibility_score", desc=True)\
            .limit(limit)\
            .execute()

        sheet_ids = [item["sheet_template_id"] for item in response.data]

        if not sheet_ids:
            # Return top popular sheets if no mappings exist
            sheets_response = supabase.table("sheet_templates")\
                .select("*")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            templates = [SheetTemplateResponse(**item) for item in sheets_response.data]
        else:
            # Get detailed sheet info
            sheets_response = supabase.table("sheet_templates")\
                .select("*")\
                .in_("id", sheet_ids)\
                .execute()
            templates = [SheetTemplateResponse(**item) for item in sheets_response.data]

        return {"portfolio_template_id": portfolio_id, "compatible_sheets": templates}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# Apply Template
# ============================================================

@router.post("/portfolios/{template_id}/apply/{portfolio_id}")
async def apply_portfolio_template(template_id: str, portfolio_id: str):
    """
    Apply a portfolio template to an existing portfolio
    Copies template design (colors, fonts, layouts) to the portfolio
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Get the template
        template_response = supabase.table("portfolio_templates")\
            .select("*")\
            .eq("id", template_id)\
            .execute()

        if not template_response.data:
            raise HTTPException(status_code=404, detail="Template not found")

        template = template_response.data[0]

        # Get the portfolio
        portfolio_response = supabase.table("portfolios")\
            .select("*")\
            .eq("id", portfolio_id)\
            .execute()

        if not portfolio_response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        portfolio = portfolio_response.data[0]

        # Apply template design to portfolio
        updated_portfolio = {
            "id": portfolio_id,
            "user_id": portfolio["user_id"],
            "project_id": portfolio["project_id"],
            "variant_num": portfolio.get("variant_num", 1),
            "style_pack_data": {
                "id": f"template-{template_id}",
                "name": template.get("name", "Template Design"),
                "colors": template.get("colors", {}),
                "typography": {
                    "heading_font": template.get("fonts", {}).get("heading", "Montserrat"),
                    "body_font": template.get("fonts", {}).get("body", "Inter"),
                },
                "spacing": {},
                "grid": {},
                "borders": {},
                "effects": {},
            },
            "page_structure": portfolio.get("page_structure", {}),
            "page_layouts": portfolio.get("page_layouts", {}),
            "is_public": portfolio.get("is_public", False),
            "share_slug": portfolio.get("share_slug", None),
            "updated_at": "now()",
        }

        # Update portfolio in database
        update_response = supabase.table("portfolios")\
            .update(updated_portfolio)\
            .eq("id", portfolio_id)\
            .execute()

        if not update_response.data:
            raise HTTPException(status_code=400, detail="Failed to apply template")

        return {
            "status": "success",
            "message": f"Template '{template.get('name')}' applied to portfolio",
            "portfolio_id": portfolio_id,
            "template_id": template_id,
            "applied_design": updated_portfolio["style_pack_data"],
        }

    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Template or portfolio not found")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# Statistics & Analytics
# ============================================================

@router.get("/stats")
async def get_template_stats():
    """
    Get statistics about available templates
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Portfolio stats
        portfolio_response = supabase.table("portfolio_templates").select("id", count="exact").execute()
        portfolio_count = len(portfolio_response.data) if portfolio_response.data else 0

        # Sheet stats
        sheet_response = supabase.table("sheet_templates").select("id", count="exact").execute()
        sheet_count = len(sheet_response.data) if sheet_response.data else 0

        # Category distribution
        category_response = supabase.table("portfolio_templates").select("category").execute()
        categories = {}
        for item in category_response.data:
            cat = item.get("category", "uncategorized")
            categories[cat] = categories.get(cat, 0) + 1

        # Source distribution
        source_response = supabase.table("portfolio_templates").select("source").execute()
        sources = {}
        for item in source_response.data:
            src = item.get("source", "unknown")
            sources[src] = sources.get(src, 0) + 1

        return {
            "portfolio_templates": portfolio_count,
            "sheet_templates": sheet_count,
            "total_templates": portfolio_count + sheet_count,
            "portfolio_categories": categories,
            "template_sources": sources,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def templates_health():
    """
    Check if templates database is accessible
    """
    try:
        if not supabase:
            return {"status": "error", "message": "Database not initialized"}

        # Try to query both tables
        portfolio_response = supabase.table("portfolio_templates").select("id").limit(1).execute()
        sheet_response = supabase.table("sheet_templates").select("id").limit(1).execute()

        return {
            "status": "ok",
            "portfolio_templates": "accessible",
            "sheet_templates": "accessible",
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }
