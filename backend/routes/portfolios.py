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
            # Truncate style_pack to 50 chars (DB column limit)
            safe_style_pack = (req.style_pack or "minimal_white")[:50]

            portfolio_data = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "layout_id": req.layout_id,
                "style_pack": safe_style_pack,
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
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Portfolio generation failed for project {project_id}:")
        print(error_trace)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{type(e).__name__}: {str(e)}"
        )

@router.get("")
async def list_all_portfolios(
    current_user: dict = Depends(get_current_user),
    library_project_id: str = None
):
    """List portfolios owned by the current user, optionally filtered by library_project_id.

    Used by the template gallery's "Apply to Existing" picker, or by the Library
    project page to show outputs generated from a specific library project.
    Returns an empty list rather than 404 when the user has no portfolios yet.
    """
    try:
        projects = supabase.table("projects").select("id").eq("user_id", current_user["user_id"]).execute()
        project_ids = [p["id"] for p in (projects.data or [])]
        if not project_ids:
            return {"portfolios": []}

        query = supabase.table("portfolios").select("*").in_("project_id", project_ids)
        if library_project_id:
            query = query.eq("library_project_id", library_project_id)
        response = query.order("created_at", desc=True).execute()
        return {"portfolios": response.data or []}
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

def _get_composer_doc(portfolio: dict):
    """Extract a saved parametric composer_doc from a portfolio's page_structure."""
    ps = portfolio.get("page_structure") or {}
    if isinstance(ps, str):
        import json as _json
        try:
            ps = _json.loads(ps)
        except Exception:
            ps = {}
    doc = ps.get("composer_doc") if isinstance(ps, dict) else None
    if doc and isinstance(doc, dict) and doc.get("pages"):
        return doc
    return None


@router.get("/{portfolio_id}/preview")
async def get_portfolio_preview(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    """Get portfolio HTML preview (Batch 3: renders with selected layouts + design pack)"""
    try:
        from services.portfolio_renderer import render_full_portfolio_safe

        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        portfolio = response.data[0]
        project_id = portfolio["project_id"]

        # Verify user ownership
        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your portfolio")
        project = project_resp.data[0]

        # If the parametric editor saved a composer_doc, render THAT so the
        # output matches the editor (what you edit is what you ship).
        _cdoc = _get_composer_doc(portfolio)
        if _cdoc:
            from services.composer_renderer import render_composer_doc
            _chtml = render_composer_doc(_cdoc)
            if _chtml:
                return {"portfolio_id": portfolio_id, "html": _chtml}

        # Get all assets for this project
        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        # Get wizard config (saved as portfolio_configs row)
        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                # The wizard config is stored in the row - may be in a config_data field or directly
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception as cfg_e:
            print(f"[INFO] No wizard config found: {cfg_e}")

        # Render the portfolio
        html = render_full_portfolio_safe(
            portfolio=portfolio,
            project=project,
            assets=assets,
            wizard_config=wizard_config,
        )

        return {
            "portfolio_id": portfolio_id,
            "html": html,
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{type(e).__name__}: {str(e)}")


@router.patch("/{project_id}/wizard-config/project/{project_index}")
async def patch_project_content(
    project_id: str,
    project_index: int,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a single project's content within the wizard config.
    Body: {name?, location?, year?, typology?, description?, ...}
    """
    try:
        # Verify project ownership
        project = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project.data:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Load current config
        existing = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Wizard config not found - run wizard first")

        cfg_row = existing.data[0]
        config = cfg_row.get("config") or cfg_row.get("config_data") or {}
        if isinstance(config, str):
            import json as _json
            try: config = _json.loads(config)
            except: config = {}

        design_projects = config.get("design_projects") or []
        if project_index < 0 or project_index >= len(design_projects):
            raise HTTPException(status_code=400, detail=f"Project index {project_index} out of range")

        # Update fields
        allowed_fields = ["name", "location", "year", "typology", "description", "pageCount", "coverImageUrl"]
        current_project = design_projects[project_index]
        for field in allowed_fields:
            if field in body:
                current_project[field] = body[field]

        # Allow updating assets dict (renders, plans, sections, etc.)
        if "assets" in body and isinstance(body["assets"], dict):
            current_assets = current_project.get("assets") or {}
            for category, urls in body["assets"].items():
                if isinstance(urls, list):
                    current_assets[category] = urls
            current_project["assets"] = current_assets

        design_projects[project_index] = current_project
        config["design_projects"] = design_projects

        # Save back
        supabase.table("portfolio_configs").update({
            "config": config,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("project_id", project_id).execute()

        return {"ok": True, "project_index": project_index, "project": current_project}

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"{type(e).__name__}: {str(e)}")


@router.post("/{project_id}/ai/generate-description")
async def ai_generate_description(
    project_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate or improve a project description using AI.
    Body: {
      mode: "generate" | "improve" | "shorten" | "expand",
      project_name: "...",
      typology: "...",
      location: "...",
      current_description: "..." (optional, for improve mode)
    }
    """
    try:
        # Verify ownership
        project = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project.data:
            raise HTTPException(status_code=403, detail="Not authorized")

        mode = body.get("mode", "generate")
        proj_name = body.get("project_name", "Untitled Project")
        typology = body.get("typology", "")
        location = body.get("location", "")
        year = body.get("year", "")
        current = body.get("current_description", "")

        # Try AI generation via Replicate
        try:
            from services.ai_generation import get_ai_generation_service
            ai = get_ai_generation_service()

            if mode == "improve" and current:
                prompt = f"Improve this architecture project description. Keep it concise (2-3 sentences), professional, and evocative. Project: {proj_name} ({typology}, {location}). Current: {current}\n\nImproved version:"
            elif mode == "shorten":
                prompt = f"Shorten this architecture project description to one strong sentence (max 25 words). Keep the essence. Original: {current}\n\nShortened:"
            elif mode == "expand":
                prompt = f"Expand this architecture project description into a more detailed paragraph (4-5 sentences). Project: {proj_name} ({typology}, {location}). Current: {current}\n\nExpanded:"
            else:
                prompt = f"Write a concise (2-3 sentences) professional architecture portfolio description for a project called '{proj_name}' ({typology} typology, located in {location}, completed {year}). Focus on concept, materials, and design intent. Sound confident and articulate but not boastful.\n\nDescription:"

            # Call AI
            result = await ai.call_replicate_text(prompt) if hasattr(ai, 'call_replicate_text') else None
            if result and isinstance(result, str) and result.strip():
                return {"description": result.strip(), "mode": mode}
        except Exception as ai_err:
            print(f"[AI] generation failed: {ai_err}")

        # Fallback templates if AI unavailable
        fallbacks = {
            "generate": f"A {typology.lower() if typology else 'contemporary'} project in {location or 'an urban context'}, exploring the dialogue between built form and site condition. The design synthesizes program, materiality, and spatial sequence through a clear architectural language.",
            "improve": current + " The intervention seeks to balance tectonic clarity with experiential richness.",
            "shorten": current.split('.')[0] + '.' if current else "A study in spatial composition and material expression.",
            "expand": current + " Structural strategies emphasize honesty of material and tectonic detail. Spatial sequences are choreographed to create moments of compression and release. Natural light is used as both functional and atmospheric medium. The project responds to its site context through carefully calibrated openings and a thoughtful relationship to scale.",
        }
        return {"description": fallbacks.get(mode, fallbacks["generate"]), "mode": mode, "fallback": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{portfolio_id}/share")
async def toggle_public_share(
    portfolio_id: str,
    body: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Enable or disable public sharing. Generates a share slug.
    Body: {enabled: true|false}
    Returns: {share_slug, share_url, is_public}
    """
    try:
        import secrets, string

        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        portfolio = response.data[0]
        project_id = portfolio["project_id"]

        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        body = body or {}
        enabled = body.get("enabled", True)

        # Read current page_structure to store share info
        ps = portfolio.get("page_structure") or {}
        if isinstance(ps, str):
            import json as _json
            try: ps = _json.loads(ps)
            except: ps = {}

        share_info = ps.get("share") or {}
        if enabled:
            # Generate slug if not exists
            if not share_info.get("slug"):
                alphabet = string.ascii_lowercase + string.digits
                share_info["slug"] = ''.join(secrets.choice(alphabet) for _ in range(10))
            share_info["enabled"] = True
            share_info["enabled_at"] = datetime.utcnow().isoformat()
        else:
            share_info["enabled"] = False

        ps["share"] = share_info
        supabase.table("portfolios").update({"page_structure": ps}).eq("id", portfolio_id).execute()

        return {
            "is_public": share_info.get("enabled", False),
            "share_slug": share_info.get("slug") if share_info.get("enabled") else None,
            "share_url": f"/p/{share_info['slug']}" if share_info.get("enabled") and share_info.get("slug") else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{portfolio_id}/export/pdf")
async def export_portfolio_pdf(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Export portfolio as PDF file.
    Returns file download with appropriate headers.
    """
    try:
        import asyncio
        from services.pdf_export import generate_pdf_from_html, create_pdf_filename

        # Get portfolio metadata
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        portfolio = dict(response.data[0])
        project_id = portfolio["project_id"]

        # Verify ownership
        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=403, detail="Not authorized")
        project = project_resp.data[0]

        # Get portfolio pages (full HTML)
        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception:
            pass

        # Render full portfolio HTML — prefer the parametric composer_doc so the
        # exported PDF matches the editor.
        html = None
        _cdoc = _get_composer_doc(portfolio)
        if _cdoc:
            from services.composer_renderer import render_composer_doc
            html = render_composer_doc(_cdoc)
        if not html:
            from services.portfolio_renderer import render_full_portfolio_safe
            html = render_full_portfolio_safe(
                portfolio=portfolio,
                project=project,
                assets=assets,
                wizard_config=wizard_config,
            )

        # Generate PDF
        pdf_bytes = await generate_pdf_from_html(
            html_content=html,
            title=project.get("title", "Portfolio"),
            options={
                'format': 'A4',
                'printBackground': True,
                'preferCSSPageSize': True,
            }
        )

        # Create filename
        filename = create_pdf_filename(
            project.get("title", "Portfolio"),
            portfolio.get("variant_number", 1)
        )

        # Track export usage for the user
        try:
            user_resp = supabase.table("users").select("export_count").eq("id", current_user["user_id"]).execute()
            if user_resp.data:
                export_count = user_resp.data[0].get("export_count") or 0
                supabase.table("users").update({"export_count": export_count + 1}).eq("id", current_user["user_id"]).execute()
            else:
                supabase.table("users").insert({
                    "id": current_user["user_id"],
                    "email": current_user.get("email", ""),
                    "export_count": 1,
                    "is_pro": False
                }).execute()
        except Exception as e:
            print(f"Failed to track export in backend: {e}")

        return {
            "pdf": pdf_bytes,
            "filename": filename,
            "content_type": "application/pdf",
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/{portfolio_id}/analytics/view")
async def log_view(portfolio_id: str, request: dict = None):
    """
    Log a portfolio view (called publicly, no auth needed).
    Tracks views for analytics without identifying users.
    """
    try:
        from services.analytics import log_portfolio_view
        # Extract IP from request (proxy-safe)
        ip = "0.0.0.0"  # Fallback
        log_portfolio_view(portfolio_id, ip)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Analytics log failed: {e}")
        return {"ok": False}


@router.post("/{portfolio_id}/analytics/share")
async def log_share(portfolio_id: str, body: dict = None):
    """
    Log a portfolio share event.
    Body: {platform: "link" | "email" | "twitter" | "linkedin"}
    """
    try:
        from services.analytics import log_portfolio_share
        body = body or {}
        platform = body.get("platform", "link")
        log_portfolio_share(portfolio_id, platform)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Share log failed: {e}")
        return {"ok": False}


@router.post("/{portfolio_id}/analytics/download")
async def log_download(portfolio_id: str, body: dict = None):
    """
    Log a portfolio download event.
    Body: {format: "pdf" | "html"}
    """
    try:
        from services.analytics import log_portfolio_download
        body = body or {}
        fmt = body.get("format", "pdf")
        log_portfolio_download(portfolio_id, fmt)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Download log failed: {e}")
        return {"ok": False}


@router.get("/{portfolio_id}/analytics")
async def get_analytics(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get analytics for a portfolio (auth required - owner only).
    Returns: views, shares, downloads, conversion rates, time series.
    """
    try:
        from services.analytics import get_portfolio_analytics

        # Verify ownership
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        portfolio = response.data[0]
        project_id = portfolio["project_id"]

        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get analytics
        analytics = get_portfolio_analytics(portfolio_id)
        return analytics

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/analytics/summary")
async def get_user_analytics_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregate analytics across all user's portfolios.
    Returns: total views/shares/downloads, top performing portfolio.
    """
    try:
        from services.analytics import get_user_portfolio_summary
        summary = get_user_portfolio_summary(current_user["user_id"])
        return summary
    except Exception as e:
        logger.error(f"User analytics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/public/p/{slug}/pages", include_in_schema=False)
@router.post("/public/p/{slug}/pages")
async def public_portfolio_pages(slug: str):
    """
    Public endpoint - no auth required.
    Returns pages for a publicly-shared portfolio by its slug.
    """
    try:
        from services.portfolio_renderer import render_portfolio_pages_safe

        # Find portfolio by share slug (search in page_structure JSONB)
        # Simple approach: scan all portfolios (small scale; for production use indexed lookup)
        all_portfolios = supabase.table("portfolios").select("*").execute()
        target = None
        for p in (all_portfolios.data or []):
            ps = p.get("page_structure") or {}
            if isinstance(ps, str):
                import json as _json
                try: ps = _json.loads(ps)
                except: continue
            share = ps.get("share") or {}
            if share.get("slug") == slug and share.get("enabled"):
                target = p
                break

        if not target:
            raise HTTPException(status_code=404, detail="Portfolio not found or sharing disabled")

        portfolio = target
        project_id = portfolio["project_id"]

        # Get project (without user check — public access)
        project_resp = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_resp.data:
            raise HTTPException(status_code=404, detail="Source project not found")
        project = project_resp.data[0]

        # Get assets
        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        # Get wizard config
        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception:
            pass

        # Prefer the parametric composer_doc so the public view matches the editor.
        result = None
        _cdoc = _get_composer_doc(portfolio)
        if _cdoc:
            from services.composer_renderer import render_composer_pages
            result = render_composer_pages(_cdoc)
        if not result:
            result = render_portfolio_pages_safe(
                portfolio=portfolio,
                project=project,
                assets=assets,
                wizard_config=wizard_config,
            )
        # Add minimal metadata for display
        result["meta"] = {
            "title": (wizard_config or {}).get("front_cover", {}).get("title") or project.get("title", "Portfolio"),
            "author": (wizard_config or {}).get("front_cover", {}).get("authorName", ""),
        }
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{portfolio_id}/customization")
async def save_customization(
    portfolio_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user's editor customizations: design pack + per-page layouts.
    Body: {style_pack_data: {...}, page_layouts: {...}}
    Stored in portfolio.page_structure for persistence.
    """
    try:
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        portfolio = response.data[0]
        project_id = portfolio["project_id"]

        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        # Read current page_structure
        ps = portfolio.get("page_structure") or {}
        if isinstance(ps, str):
            import json as _json
            try: ps = _json.loads(ps)
            except: ps = {}

        # Update with customizations
        if body.get("style_pack_data"):
            ps["style_pack"] = body["style_pack_data"]
        if body.get("page_layouts") is not None:
            ps["page_layouts"] = body["page_layouts"]
        # Full parametric composer document (pages + tokens) from the editor
        if body.get("composer_doc") is not None:
            pages = body["composer_doc"].get("pages", [])
            
            # Check user limits
            user_res = supabase.table("users").select("*").eq("id", current_user["user_id"]).execute()
            user_data = user_res.data[0] if user_res.data else {}
            is_free = user_data.get("subscription_tier", "free") == "free"
            is_admin = current_user.get("email", "").lower() == 'boseraj001@gmail.com'
            
            if not is_admin:
                if is_free and len(pages) > 6:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Free tier is limited to 6 pages per portfolio. Please upgrade to Pro.")
                elif not is_free and len(pages) > 30:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pro tier is limited to 30 pages per portfolio.")

            ps["composer_doc"] = body["composer_doc"]

        # Save back
        update_data = {"page_structure": ps}
        # Also update style_pack column if pack id provided
        if body.get("style_pack_data", {}).get("id"):
            update_data["style_pack"] = body["style_pack_data"]["id"][:50]

        supabase.table("portfolios").update(update_data).eq("id", portfolio_id).execute()

        return {"ok": True, "portfolio_id": portfolio_id, "saved_at": datetime.utcnow().isoformat()}

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{type(e).__name__}: {str(e)}")


@router.post("/{portfolio_id}/pages")
async def get_portfolio_pages(
    portfolio_id: str,
    body: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Return portfolio as array of individual pages (for flipbook editor).
    Body (optional): {style_pack_data: {...}, layout_id: "..."} to override
    """
    try:
        from services.portfolio_renderer import render_portfolio_pages_safe

        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        portfolio = dict(response.data[0])
        project_id = portfolio["project_id"]

        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        project = project_resp.data[0]

        # Apply overrides from body
        body = body or {}
        custom_pack = body.get("style_pack_data")
        custom_layout = body.get("layout_id")
        page_layouts = body.get("page_layouts") or {}  # NEW: per-page layout overrides

        ps = portfolio.get("page_structure") or {}
        if isinstance(ps, str):
            import json as _json
            try: ps = _json.loads(ps)
            except: ps = {}
        if custom_pack:
            ps["style_pack"] = custom_pack
        portfolio["page_structure"] = ps
        if custom_layout:
            portfolio["layout_id"] = custom_layout

        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception:
            pass

        result = render_portfolio_pages_safe(
            portfolio=portfolio,
            project=project,
            assets=assets,
            wizard_config=wizard_config,
            page_layouts=page_layouts,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{type(e).__name__}: {str(e)}")


@router.post("/{portfolio_id}/render-with-pack")
async def render_with_custom_pack(
    portfolio_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Re-render portfolio with a different style_pack_data and/or layout.
    Body: {style_pack_data: {...}, layout_id: "..."}
    Does NOT save to DB — just returns the HTML for live preview.
    """
    try:
        from services.portfolio_renderer import render_full_portfolio_safe

        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        portfolio = dict(response.data[0])  # Copy so we can modify
        project_id = portfolio["project_id"]

        # Verify ownership
        project_resp = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not project_resp.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        project = project_resp.data[0]

        # Override style_pack in page_structure
        custom_pack = body.get("style_pack_data")
        custom_layout = body.get("layout_id")
        ps = portfolio.get("page_structure") or {}
        if isinstance(ps, str):
            import json as _json
            try:
                ps = _json.loads(ps)
            except Exception:
                ps = {}
        if custom_pack:
            ps["style_pack"] = custom_pack
        portfolio["page_structure"] = ps
        if custom_layout:
            portfolio["layout_id"] = custom_layout

        # Get assets + wizard config
        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception:
            pass

        html = render_full_portfolio_safe(
            portfolio=portfolio,
            project=project,
            assets=assets,
            wizard_config=wizard_config,
        )

        return {"portfolio_id": portfolio_id, "html": html}

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{type(e).__name__}: {str(e)}")


@router.get("/{portfolio_id}/preview-html", response_class=None)
async def get_portfolio_preview_html(portfolio_id: str):
    """Return raw HTML for iframe preview (public, no auth — designed for iframe rendering)"""
    from fastapi.responses import HTMLResponse
    from services.portfolio_renderer import render_full_portfolio_safe

    try:
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            return HTMLResponse(content="<h1>Portfolio not found</h1>", status_code=404)

        portfolio = response.data[0]
        project_id = portfolio["project_id"]

        project_resp = supabase.table("projects").select("*").eq("id", project_id).execute()
        project = project_resp.data[0] if project_resp.data else {}

        assets_resp = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        assets = assets_resp.data or []

        wizard_config = None
        try:
            cfg_resp = supabase.table("portfolio_configs").select("*").eq("project_id", project_id).execute()
            if cfg_resp.data:
                cfg = cfg_resp.data[0]
                wizard_config = cfg.get("config") or cfg.get("config_data") or cfg
        except Exception:
            pass

        html = render_full_portfolio_safe(
            portfolio=portfolio,
            project=project,
            assets=assets,
            wizard_config=wizard_config,
        )
        return HTMLResponse(content=html)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Error</h1><pre>{type(e).__name__}: {str(e)}</pre>", status_code=500)


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
