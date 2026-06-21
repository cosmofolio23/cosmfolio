"""
Preview & Export API Endpoints
Phase 5: Task 5.3 - PDF export, HTML preview, and rendering endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import FileResponse, HTMLResponse
from typing import Optional
import logging

from .deps import get_current_user
from services.pdf_export import get_pdf_export_service, PageSizeEnum, PageOrientationEnum
from services.html_preview import get_html_preview_service, ResponsiveBreakpoint
from error_handlers import ResourceNotFoundException, AuthorizationException
from database import supabase

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== PDF EXPORT ENDPOINTS ====================

@router.post("/{portfolio_id}/export-pdf")
async def export_portfolio_as_pdf(
    portfolio_id: str,
    page_size: str = Query("A4", pattern="^(A4|A3|Letter|Tabloid|Custom)$"),
    orientation: str = Query("portrait", pattern="^(portrait|landscape)$"),
    style_pack: str = Query("minimal_white"),
    include_margins: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """
    Export portfolio as PDF file

    Returns PDF file with applied styles and layout
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        # Check user limits
        user_res = supabase.table("users").select("*").eq("id", current_user["user_id"]).execute()
        user_data = user_res.data[0] if user_res.data else {}
        is_free = user_data.get("subscription_tier", "free") == "free"
        export_count = user_data.get("export_count", 0)
        
        is_admin = current_user.get("email", "").lower() in ['boseraj001@gmail.com', 'boseraj008@gmail.com']
        
        portfolio_data = portfolio.data[0]
        page_structure = portfolio_data.get("page_structure", {})
        pages = page_structure.get("pages", [])
        
        if not is_admin:
            # Enforce Page Limits
            if is_free and len(pages) > 5:
                raise HTTPException(status_code=403, detail="Free tier is limited to 5 pages per portfolio. Please upgrade to Pro.")
            elif not is_free and len(pages) > 30:
                raise HTTPException(status_code=403, detail="Pro tier is limited to 30 pages per portfolio.")
            
            # Enforce Download Limit for All Users (2 PDF exports)
            if export_count >= 2:
                raise HTTPException(status_code=403, detail="All tiers are limited to 2 PDF exports for this beta.")

        # Get projects and assets
        projects = supabase.table("projects").select("*").eq("user_id", current_user["user_id"]).execute()
        assets = supabase.table("assets").select("*").eq("project_id", projects.data[0]["id"]).execute() if projects.data else None

        # Extract embedded style pack from page_structure if present (Batch 2)
        style_pack_data = page_structure.get("style_pack") if isinstance(page_structure, dict) else None
        effective_style_pack = portfolio_data.get("style_pack") or style_pack

        # Generate HTML preview first
        html_service = get_html_preview_service()
        portfolio_html = await html_service.generate_html_preview(
            portfolio_id=portfolio_id,
            portfolio_data={
                "title": portfolio_data.get("title", "Portfolio"),
                "author": portfolio_data.get("author", ""),
                "description": portfolio_data.get("description", ""),
                "style_pack_data": style_pack_data,  # Full pack data (Batch 2)
                "assets": [
                    {
                        "title": asset.get("file_name", "Asset"),
                        "description": asset.get("analysis", {}).get("description", ""),
                        "url": asset.get("file_url", "")
                    }
                    for asset in (assets.data if assets else [])
                ]
            },
            style_pack=effective_style_pack,
            responsive=True,
            is_free=(is_free and not is_admin),
        )

        # Export to PDF
        pdf_service = get_pdf_export_service()
        pdf_bytes, metadata = await pdf_service.export_portfolio_pdf(
            portfolio_html=portfolio_html,
            page_size=page_size,
            orientation=orientation,
            style_pack=style_pack,
            include_margins=include_margins,
        )

        # Log export
        logger.info(f"PDF exported for portfolio {portfolio_id}: {len(pdf_bytes)} bytes")
        
        # Increment download count for Free users
        if is_free and not is_admin:
            supabase.table("users").update({"pdf_downloads": downloads + 1}).eq("id", current_user["user_id"]).execute()

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            "file_size_bytes": len(pdf_bytes),
            "page_size": page_size,
            "orientation": orientation,
            "style_pack": style_pack,
            "download_url": f"/api/portfolios/{portfolio_id}/download-pdf?token={current_user.get('token', '')}",
            "metadata": metadata,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{portfolio_id}/export-html")
async def export_portfolio_as_html(
    portfolio_id: str,
    style_pack: str = Query("minimal_white"),
    responsive: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """
    Export portfolio as standalone HTML file

    Returns complete HTML that can be opened in any browser
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        portfolio_data = portfolio.data[0]

        # Get related data
        projects = supabase.table("projects").select("*").eq("user_id", current_user["user_id"]).execute()
        assets = supabase.table("assets").select("*").eq("project_id", projects.data[0]["id"]).execute() if projects.data else None

        # Extract embedded style pack (Batch 2)
        page_structure = portfolio_data.get("page_structure", {})
        style_pack_data = page_structure.get("style_pack") if isinstance(page_structure, dict) else None
        effective_style_pack = portfolio_data.get("style_pack") or style_pack

        # Generate HTML
        html_service = get_html_preview_service()
        html_content = await html_service.generate_html_preview(
            portfolio_id=portfolio_id,
            portfolio_data={
                "title": portfolio_data.get("title", "Portfolio"),
                "author": portfolio_data.get("author", ""),
                "description": portfolio_data.get("description", ""),
                "style_pack_data": style_pack_data,
                "assets": [
                    {
                        "title": asset.get("file_name", "Asset"),
                        "description": asset.get("analysis", {}).get("description", ""),
                        "url": asset.get("file_url", "")
                    }
                    for asset in (assets.data if assets else [])
                ]
            },
            style_pack=effective_style_pack,
            responsive=responsive,
        )

        logger.info(f"HTML exported for portfolio {portfolio_id}: {len(html_content)} characters")

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            "file_size_bytes": len(html_content.encode()),
            "style_pack": effective_style_pack,
            "responsive": responsive,
            "preview_url": f"/api/portfolios/{portfolio_id}/preview",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        logger.error(f"Error exporting HTML: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== PREVIEW ENDPOINTS ====================

@router.get("/{portfolio_id}/preview", response_class=HTMLResponse)
async def preview_portfolio_html(
    portfolio_id: str,
    style_pack: str = Query("minimal_white"),
    layout: str = Query("default"),
    breakpoint: str = Query("desktop", pattern="^(mobile|tablet|desktop)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get real-time HTML preview of portfolio

    Returns rendered HTML that displays in browser
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        portfolio_data = portfolio.data[0]

        # Get assets
        projects = supabase.table("projects").select("*").eq("user_id", current_user["user_id"]).execute()
        assets = supabase.table("assets").select("*").eq("project_id", projects.data[0]["id"]).execute() if projects.data else None

        # Generate HTML
        html_service = get_html_preview_service()
        html_content = await html_service.generate_html_preview(
            portfolio_id=portfolio_id,
            portfolio_data={
                "title": portfolio_data.get("title", "Portfolio"),
                "author": portfolio_data.get("author", ""),
                "description": portfolio_data.get("description", ""),
                "assets": [
                    {
                        "title": asset.get("file_name", "Asset"),
                        "description": asset.get("analysis", {}).get("description", ""),
                        "url": asset.get("file_url", "")
                    }
                    for asset in (assets.data if assets else [])
                ]
            },
            style_pack=style_pack,
            responsive=True,
        )

        logger.info(f"Preview generated for portfolio {portfolio_id}")

        return html_content

    except AuthorizationException:
        raise
    except Exception as e:
        logger.error(f"Error generating preview: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{portfolio_id}/preview-pdf")
async def preview_pdf_metadata(
    portfolio_id: str,
    page_size: str = Query("A4", pattern="^(A4|A3|Letter|Tabloid|Custom)$"),
    style_pack: str = Query("minimal_white"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get PDF preview metadata and generation info

    Returns info about PDF without generating full file
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        pdf_service = get_pdf_export_service()

        # Generate metadata
        metadata = pdf_service.generate_pdf_metadata(
            portfolio_id=portfolio_id,
            title=portfolio.data[0].get("title", "Portfolio"),
            author=portfolio.data[0].get("author", ""),
            page_size=page_size,
        )

        return {
            "portfolio_id": portfolio_id,
            "page_size": page_size,
            "style_pack": style_pack,
            "weasyprint_available": pdf_service.weasyprint_available,
            "metadata": metadata,
            "export_url": f"/api/portfolios/{portfolio_id}/export-pdf?page_size={page_size}&style_pack={style_pack}",
        }

    except AuthorizationException:
        raise
    except Exception as e:
        logger.error(f"Error getting PDF preview: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== EXPORT VARIANTS ====================

@router.post("/{portfolio_id}/export-variants")
async def export_multiple_variants(
    portfolio_id: str,
    formats: list = Query(["pdf", "html"]),
    style_packs: list = Query(["minimal_white"]),
    current_user: dict = Depends(get_current_user)
):
    """
    Export portfolio in multiple formats and styles

    Generates PDFs/HTMLs for each combination of format and style
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        variants = []

        for format_type in formats:
            for style in style_packs:
                if format_type == "pdf":
                    variants.append({
                        "format": "pdf",
                        "style": style,
                        "url": f"/api/portfolios/{portfolio_id}/export-pdf?style_pack={style}",
                        "filename": f"{portfolio_id}_{style}.pdf"
                    })
                elif format_type == "html":
                    variants.append({
                        "format": "html",
                        "style": style,
                        "url": f"/api/portfolios/{portfolio_id}/export-html?style_pack={style}",
                        "filename": f"{portfolio_id}_{style}.html"
                    })

        logger.info(f"Generated {len(variants)} export variants for portfolio {portfolio_id}")

        return {
            "portfolio_id": portfolio_id,
            "total_variants": len(variants),
            "variants": variants,
        }

    except AuthorizationException:
        raise
    except Exception as e:
        logger.error(f"Error generating export variants: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== IMAGE OPTIMIZATION ====================

@router.post("/{portfolio_id}/optimize-images")
async def optimize_portfolio_images(
    portfolio_id: str,
    quality: int = Query(85, ge=1, le=100),
    max_width: int = Query(1200, ge=400, le=4000),
    current_user: dict = Depends(get_current_user)
):
    """
    Optimize images in portfolio for export

    Compresses and resizes images for better PDF/web performance
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        # Get assets
        projects = supabase.table("projects").select("*").eq("user_id", current_user["user_id"]).execute()
        assets = supabase.table("assets").select("*").eq("project_id", projects.data[0]["id"]).execute() if projects.data else None

        if not assets:
            return {
                "portfolio_id": portfolio_id,
                "status": "no_images",
                "message": "No images found in portfolio"
            }

        # Optimize images
        pdf_service = get_pdf_export_service()
        image_paths = [asset.get("file_url", "") for asset in assets.data]
        optimization_results = pdf_service.optimize_images_for_pdf(
            image_paths=image_paths,
            quality=quality,
            max_width=max_width,
        )

        logger.info(f"Optimized {optimization_results['optimized_count']} images for portfolio {portfolio_id}")

        return {
            "portfolio_id": portfolio_id,
            "optimization_results": optimization_results,
            "compression_percent": round(
                100 * (1 - optimization_results["total_size_after"] / optimization_results["total_size_before"])
                if optimization_results["total_size_before"] > 0 else 0,
                1
            ),
        }

    except AuthorizationException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing images: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== EXPORT SETTINGS ====================

@router.get("/{portfolio_id}/export-settings")
async def get_export_settings(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get available export settings for portfolio

    Returns supported page sizes, styles, formats, etc.
    """
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0].get("user_id") != current_user["user_id"]:
            raise AuthorizationException()

        pdf_service = get_pdf_export_service()
        html_service = get_html_preview_service()

        return {
            "portfolio_id": portfolio_id,
            "supported_formats": ["pdf", "html", "jpg"],
            "page_sizes": list(pdf_service.page_sizes.keys()),
            "orientations": ["portrait", "landscape"],
            "style_packs": list(pdf_service.style_configurations.keys()),
            "breakpoints": ["mobile", "tablet", "desktop"],
            "features": {
                "pdf_export": pdf_service.weasyprint_available,
                "image_optimization": True,
                "responsive_html": True,
                "variant_generation": True,
            },
        }

    except AuthorizationException:
        raise
    except Exception as e:
        logger.error(f"Error getting export settings: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
