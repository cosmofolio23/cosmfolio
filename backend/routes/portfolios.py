from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from models import GeneratePortfolioRequest, PortfolioResponse
from .deps import get_current_user
from database import supabase
import uuid
import json

router = APIRouter()

# ==================== Portfolio Generation ====================

def get_style_pack_tokens(style_id: str, style_pack_data: dict = None) -> dict:
    """
    Get style pack tokens for a given style ID.
    If style_pack_data is provided (e.g. AI-generated), uses it directly.
    Otherwise looks up from preset packs or returns defaults.
    """
    # If full pack data provided (custom/AI-generated), use it directly
    if style_pack_data and isinstance(style_pack_data, dict):
        # Ensure required fields exist
        if "colors" in style_pack_data and "typography" in style_pack_data:
            return style_pack_data

    # Look up preset by ID
    from services.style_pack import get_style_pack_service
    try:
        service = get_style_pack_service()
        presets = service.get_preset_packs()
        for pack in presets:
            if pack["id"] == style_id:
                return pack
            # Also check legacy ID (e.g. "minimal_white" → "preset-minimal-white")
            if pack["id"] == f"preset-{style_id.replace('_', '-')}":
                return pack
    except Exception:
        pass

    # Default fallback (minimal white)
    return {
        "id": "preset-minimal-white",
        "name": "Minimal White",
        "colors": {
            "primary": "#000000", "secondary": "#666666",
            "accent": "#0066cc", "background": "#ffffff", "text": "#333333"
        },
        "typography": {
            "heading_font": "sans-serif", "body_font": "sans-serif",
            "heading_size": 36, "body_size": 16,
            "heading_weight": 700, "body_weight": 400, "line_height": 1.6
        },
        "spacing": {"xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32}
    }


def generate_portfolio_structure(
    project_id: str,
    layout_id: str,
    style_id: str,
    assets: dict,
    style_pack_data: dict = None
) -> dict:
    """
    Generate portfolio structure (page layout and content assignment).
    In production, this would call Llama 2 via Replicate.
    For now, use heuristic rules.
    """

    # Get style pack tokens to embed in structure (supports custom/AI-generated)
    style_pack = get_style_pack_tokens(style_id, style_pack_data)

    # Simple heuristic page generation
    pages = []

    # Page 1: Cover
    pages.append({
        "page_num": 1,
        "title": "Cover",
        "components": [
            {
                "type": "title",
                "content": "Project Title"
            },
            {
                "type": "render",
                "asset_id": assets.get("renders", [None])[0],
                "position": "hero"
            }
        ]
    })

    # Page 2: Concept
    if assets.get("diagrams"):
        pages.append({
            "page_num": 2,
            "title": "Concept",
            "components": [
                {
                    "type": "text",
                    "content": "Concept & Approach"
                },
                {
                    "type": "diagram",
                    "asset_id": assets.get("diagrams", [None])[0],
                    "position": "main"
                }
            ]
        })

    # Page 3: Plans
    if assets.get("plans"):
        pages.append({
            "page_num": 3,
            "title": "Plans",
            "components": [
                {
                    "type": "text",
                    "content": "Floor Plans"
                },
                {
                    "type": "plan",
                    "asset_id": assets.get("plans", [None])[0],
                    "position": "main"
                }
            ]
        })

    # Page 4: Sections
    if assets.get("sections"):
        pages.append({
            "page_num": 4,
            "title": "Sections",
            "components": [
                {
                    "type": "text",
                    "content": "Building Sections"
                },
                {
                    "type": "section",
                    "asset_id": assets.get("sections", [None])[0],
                    "position": "main"
                }
            ]
        })

    # Pages 5+: Renders
    render_idx = 5
    for render_id in assets.get("renders", []):
        if render_idx == 1:
            continue  # Skip first render (used as cover)
        pages.append({
            "page_num": render_idx,
            "title": f"Render {render_idx - 4}",
            "components": [
                {
                    "type": "render",
                    "asset_id": render_id,
                    "position": "hero"
                }
            ]
        })
        render_idx += 1

    return {
        "pages": pages,
        "total_pages": len(pages),
        "style_pack": style_pack,
    }

# ==================== Routes ====================

@router.post("/{project_id}/generate")
async def generate_portfolio(
    project_id: str,
    req: GeneratePortfolioRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Generate one or more portfolio variants"""
    try:
        # Verify project ownership
        project_response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        # Get project assets
        assets_response = supabase.table("assets").select("*").eq("project_id", project_id).execute()

        assets_by_type = {
            "renders": [],
            "plans": [],
            "sections": [],
            "diagrams": []
        }

        for asset in assets_response.data:
            asset_type = asset.get("asset_type", "render")
            if asset_type == "render":
                assets_by_type["renders"].append(asset["id"])
            elif asset_type == "plan":
                assets_by_type["plans"].append(asset["id"])
            elif asset_type == "section":
                assets_by_type["sections"].append(asset["id"])
            elif asset_type == "diagram":
                assets_by_type["diagrams"].append(asset["id"])

        # Generate portfolio variants
        generated_portfolios = []

        variant_count = req.variant_count if req.variant_number is None else 1
        start_variant = req.variant_number if req.variant_number else 1

        for variant_num in range(variant_count):
            portfolio_data = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "layout_id": req.layout_id,
                "style_pack": req.style_pack,
                "status": "ready",
                "variant_number": start_variant + variant_num,
                "created_at": datetime.utcnow().isoformat()
            }

            # Generate page structure (Batch 2: pass full pack data for custom/AI packs)
            page_structure = generate_portfolio_structure(
                project_id,
                req.layout_id,
                req.style_pack,
                assets_by_type,
                style_pack_data=req.style_pack_data,
            )

            portfolio_data["page_structure"] = page_structure

            # Insert portfolio
            response = supabase.table("portfolios").insert(portfolio_data).execute()
            if response.data:
                portfolio = response.data[0]
                portfolio["status"] = "ready"
                generated_portfolios.append(portfolio)

                # Schedule async HTML/PDF generation
                # background_tasks.add_task(generate_portfolio_files, portfolio["id"])

        return {
            "message": f"Generated {len(generated_portfolios)} portfolio variants",
            "portfolios": generated_portfolios
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{project_id}/list")
async def list_portfolios(project_id: str, current_user: dict = Depends(get_current_user)):
    """List all portfolios for a project"""
    try:
        # Verify user owns the project
        project = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't own this project")

        response = supabase.table("portfolios").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/view/{portfolio_id}")
async def get_portfolio(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    """Get portfolio details"""
    try:
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if response.data:
            portfolio = response.data[0]
            # Verify user ownership through project
            project = supabase.table("projects").select("*").eq("id", portfolio["project_id"]).eq("user_id", current_user["user_id"]).execute()
            if project.data:
                return portfolio
            else:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't own this portfolio")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Portfolio {portfolio_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    """Delete portfolio"""
    try:
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if response.data:
            portfolio = response.data[0]
            # Verify user ownership
            project = supabase.table("projects").select("*").eq("id", portfolio["project_id"]).eq("user_id", current_user["user_id"]).execute()
            if project.data:
                supabase.table("portfolios").delete().eq("id", portfolio_id).execute()
                return

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{portfolio_id}/preview")
async def get_portfolio_preview(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    """Get portfolio HTML preview"""
    try:
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if response.data:
            portfolio = response.data[0]
            # Verify user ownership
            project = supabase.table("projects").select("*").eq("id", portfolio["project_id"]).eq("user_id", current_user["user_id"]).execute()
            if project.data:
                return {
                    "portfolio_id": portfolio_id,
                    "html": portfolio.get("generated_html") or "<p>Portfolio HTML will be generated here</p>"
                }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== BATCH 1: Wizard Config ====================

@router.post("/{project_id}/wizard-config")
async def save_wizard_config(
    project_id: str,
    config: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Save the portfolio wizard config (Batch 1).
    Stores: name, type (internship/academic/etc), total_pages, project_count, pages (toggles).
    This config is consumed by Batch 2 (DNA system) to generate the actual portfolio.
    """
    try:
        # Verify project ownership
        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
        if project.data[0]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Build config record
        config_id = str(uuid.uuid4())
        config_data = {
            "id": config_id,
            "project_id": project_id,
            "config": config,  # JSONB column with full wizard state
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Try to insert into portfolio_configs (Phase 2b table)
        try:
            # First check if config already exists for this project
            existing = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if existing.data:
                # Update existing
                supabase.table("portfolio_configs").update({
                    "config": config,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("project_id", project_id).execute()
                return {"id": existing.data[0]["id"], "project_id": project_id, "config": config}
            else:
                # Insert new
                supabase.table("portfolio_configs").insert(config_data).execute()
                return {"id": config_id, "project_id": project_id, "config": config}
        except Exception as db_err:
            # If table doesn't have expected schema, log and return success anyway
            # (frontend will work with local state)
            print(f"[WARNING] portfolio_configs save failed: {db_err}")
            return {"id": config_id, "project_id": project_id, "config": config}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}/wizard-config")
async def get_wizard_config(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the saved wizard config for a project (Batch 1)."""
    try:
        # Verify project ownership
        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
        if project.data[0]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        try:
            response = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if response.data:
                return response.data[0]
            return {"project_id": project_id, "config": None}
        except Exception as db_err:
            print(f"[WARNING] portfolio_configs read failed: {db_err}")
            return {"project_id": project_id, "config": None}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
