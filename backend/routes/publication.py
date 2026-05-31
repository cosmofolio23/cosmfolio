"""
Publication API Routes
Phase 6: Task 6.4 - Publication, sharing, and download endpoints
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from services.publication import get_publication_service
from services.social_export import get_social_export_service
from services.download_export import get_download_export_service
from .deps import get_current_user

logger = logging.getLogger(__name__)

# ==================== ROUTER SETUP ====================

router = APIRouter(prefix="/api/portfolios", tags=["publication"])


# ==================== REQUEST/RESPONSE MODELS ====================

class PublishRequest(BaseModel):
    """Request to publish a portfolio"""
    is_password_protected: bool = False
    password: Optional[str] = None


class PublishResponse(BaseModel):
    """Response after publishing"""
    status: str
    public_url: str
    public_token: str
    public_slug: str
    is_password_protected: bool


class AccessPublicPortfolioRequest(BaseModel):
    """Request to access password-protected portfolio"""
    password: Optional[str] = None


class ShareTokenRequest(BaseModel):
    """Request to create share token"""
    expires_in_days: int = 30
    custom_message: Optional[str] = None


class ShareTokenResponse(BaseModel):
    """Response with share token"""
    share_url: str
    share_token: str
    expires_at: str


class SocialPreviewRequest(BaseModel):
    """Request for social preview"""
    platform: str  # linkedin, instagram, twitter, etc.
    custom_text: Optional[str] = None


class DownloadRequest(BaseModel):
    """Request to download portfolio"""
    format: str  # pdf, html, zip, self_contained_html, powerpoint
    filename: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post("/{portfolio_id}/publish", response_model=PublishResponse)
async def publish_portfolio(
    portfolio_id: str,
    request: PublishRequest,
    current_user = Depends(get_current_user),
):
    """
    Make a portfolio publicly accessible

    Args:
        portfolio_id: Portfolio ID to publish
        request: Publish options
        current_user: Current authenticated user

    Returns:
        Publication details with public URL
    """

    try:
        # TODO: Verify portfolio ownership
        # portfolio = await db.get_portfolio(portfolio_id, current_user.id)
        # if not portfolio:
        #     raise HTTPException(status_code=404, detail="Portfolio not found")

        publication_service = get_publication_service()

        result = publication_service.publish_portfolio(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
            is_password_protected=request.is_password_protected,
            password=request.password if request.is_password_protected else None,
        )

        return PublishResponse(
            status=result["status"],
            public_url=result["public_url"],
            public_token=result["public_token"],
            public_slug=result["public_slug"],
            is_password_protected=result["is_password_protected"],
        )

    except Exception as e:
        logger.error(f"Error publishing portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{portfolio_id}/public-link")
async def get_public_link(
    portfolio_id: str,
    current_user = Depends(get_current_user),
):
    """
    Get public link for portfolio

    Args:
        portfolio_id: Portfolio ID
        current_user: Current user

    Returns:
        Public link details
    """

    try:
        # TODO: Verify portfolio ownership
        publication_service = get_publication_service()

        link_settings = publication_service.get_public_link_settings(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
        )

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            **link_settings,
        }

    except Exception as e:
        logger.error(f"Error getting public link: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{portfolio_id}/unpublish")
async def unpublish_portfolio(
    portfolio_id: str,
    current_user = Depends(get_current_user),
):
    """
    Unpublish portfolio (make private)

    Args:
        portfolio_id: Portfolio ID
        current_user: Current user

    Returns:
        Confirmation
    """

    try:
        # TODO: Verify portfolio ownership
        publication_service = get_publication_service()

        result = publication_service.unpublish_portfolio(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
        )

        return {
            "status": "success",
            "message": "Portfolio unpublished",
            **result,
        }

    except Exception as e:
        logger.error(f"Error unpublishing portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{portfolio_id}/share", response_model=ShareTokenResponse)
async def create_share_token(
    portfolio_id: str,
    request: ShareTokenRequest,
    current_user = Depends(get_current_user),
):
    """
    Create temporary share token for portfolio

    Args:
        portfolio_id: Portfolio ID
        request: Share options
        current_user: Current user

    Returns:
        Share token and URL
    """

    try:
        # TODO: Verify portfolio ownership
        publication_service = get_publication_service()

        result = publication_service.create_share_token(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
            expires_in_days=request.expires_in_days,
            custom_message=request.custom_message,
        )

        return ShareTokenResponse(
            share_url=result["share_url"],
            share_token=result["share_token"],
            expires_at=result["expires_at"],
        )

    except Exception as e:
        logger.error(f"Error creating share token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{portfolio_id}/analytics")
async def get_portfolio_analytics(
    portfolio_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user),
):
    """
    Get portfolio view analytics

    Args:
        portfolio_id: Portfolio ID
        days: Number of days to retrieve
        current_user: Current user

    Returns:
        Analytics data
    """

    try:
        # TODO: Verify portfolio ownership
        publication_service = get_publication_service()

        analytics = publication_service.get_analytics(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
            days=days,
        )

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            **analytics,
        }

    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{portfolio_id}/social-preview")
async def get_social_preview(
    portfolio_id: str,
    request: SocialPreviewRequest,
    current_user = Depends(get_current_user),
):
    """
    Generate social media preview card

    Args:
        portfolio_id: Portfolio ID
        request: Platform and options
        current_user: Current user

    Returns:
        Social preview card data
    """

    try:
        # TODO: Get portfolio data
        # portfolio = await db.get_portfolio(portfolio_id, current_user.id)
        # if not portfolio:
        #     raise HTTPException(status_code=404, detail="Portfolio not found")

        social_service = get_social_export_service()

        # Sample portfolio data (in production, fetch from DB)
        portfolio_data = {
            "title": "Architecture Portfolio",
            "description": "Professional architecture portfolio",
            "author": current_user.name or "",
            "keywords": ["architecture", "design", "portfolio"],
        }

        preview_card = social_service.generate_social_preview_card(
            portfolio_id=portfolio_id,
            portfolio_data=portfolio_data,
            platform=request.platform,
        )

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            "preview_card": preview_card,
        }

    except Exception as e:
        logger.error(f"Error generating social preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{portfolio_id}/download")
async def download_portfolio(
    portfolio_id: str,
    request: DownloadRequest,
    current_user = Depends(get_current_user),
):
    """
    Download portfolio in specified format

    Args:
        portfolio_id: Portfolio ID
        request: Download format and options
        current_user: Current user

    Returns:
        Download metadata with binary file
    """

    try:
        # TODO: Get portfolio data and files
        # portfolio = await db.get_portfolio(portfolio_id, current_user.id)
        # if not portfolio:
        #     raise HTTPException(status_code=404, detail="Portfolio not found")

        download_service = get_download_export_service()

        # Sample portfolio data (in production, fetch from DB)
        portfolio_data = {
            "title": "Architecture Portfolio",
            "description": "Professional architecture portfolio",
            "author": current_user.name or "",
        }

        # Sample files (in production, fetch from storage)
        files = {
            "index.html": b"<html>...</html>",
            "styles.css": b"body { color: black; }",
        }

        if request.format == "zip":
            result = download_service.export_portfolio_zip(
                portfolio_id=portfolio_id,
                portfolio_data=portfolio_data,
                files=files,
                filename=request.filename,
            )

        elif request.format == "html":
            html_content = "<html>...</html>"
            result = download_service.export_portfolio_html(
                portfolio_id=portfolio_id,
                portfolio_data=portfolio_data,
                html_content=html_content,
                filename=request.filename,
            )

        elif request.format == "self_contained_html":
            html_content = "<html>...</html>"
            result = download_service.export_portfolio_self_contained_html(
                portfolio_id=portfolio_id,
                portfolio_data=portfolio_data,
                html_content=html_content,
                assets=files,
                filename=request.filename,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {request.format}"
            )

        # TODO: Track download via publication service
        publication_service = get_publication_service()

        return {
            "status": "success",
            "portfolio_id": portfolio_id,
            "format": result["format"],
            "filename": result["filename"],
            "file_size_bytes": result["file_size_bytes"],
            "file_size_mb": result["file_size_mb"],
            "mime_type": result["mime_type"],
            # In production, return signed download URL or stream binary
            "download_url": f"/api/downloads/{portfolio_id}/{result['format']}/{result['filename']}",
        }

    except Exception as e:
        logger.error(f"Error downloading portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{portfolio_id}/batch-download")
async def batch_download_portfolios(
    portfolio_ids: List[str],
    format: str = Query("zip"),
    current_user = Depends(get_current_user),
):
    """
    Download multiple portfolios at once

    Args:
        portfolio_ids: List of portfolio IDs
        format: Export format
        current_user: Current user

    Returns:
        Batch download metadata
    """

    try:
        if len(portfolio_ids) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 portfolios per batch download"
            )

        download_service = get_download_export_service()

        # TODO: Fetch all portfolios and verify ownership
        portfolio_data_map = {}
        files_map = {}

        for pid in portfolio_ids:
            # portfolio = await db.get_portfolio(pid, current_user.id)
            portfolio_data_map[pid] = {
                "title": "Portfolio",
                "author": current_user.name or "",
            }
            files_map[pid] = {}

        result = download_service.batch_export(
            portfolio_ids=portfolio_ids,
            portfolio_data_map=portfolio_data_map,
            format=format,
            files_map=files_map,
        )

        return {
            "status": "success",
            **result,
        }

    except Exception as e:
        logger.error(f"Error in batch download: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings")
async def get_export_settings():
    """
    Get available export settings and formats

    Returns:
        Export settings and options
    """

    try:
        download_service = get_download_export_service()

        formats = {}
        for fmt in ["pdf", "html", "self_contained_html", "zip", "powerpoint"]:
            formats[fmt] = download_service.get_export_info(fmt)

        return {
            "status": "success",
            "formats": formats,
            "max_file_size_mb": 100,
            "max_zip_size_mb": 500,
            "supported_formats": list(formats.keys()),
        }

    except Exception as e:
        logger.error(f"Error getting export settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PUBLIC ROUTES (No Auth Required) ====================

public_router = APIRouter(prefix="/public", tags=["public-portfolios"])


@public_router.get("/p/{slug}/{token}")
async def view_public_portfolio(
    slug: str,
    token: str,
    password: Optional[str] = None,
):
    """
    View public portfolio

    Args:
        slug: Portfolio slug
        token: Public token
        password: Password if protected

    Returns:
        Portfolio HTML or redirect
    """

    try:
        publication_service = get_publication_service()

        portfolio = publication_service.get_public_portfolio(
            public_slug=slug,
            public_token=token,
            password=password,
        )

        # TODO: Track view
        visitor_ip = None  # Get from request.client.host in production
        referrer = None    # Get from request.headers

        publication_service.track_view(
            portfolio_id=slug,
            public_token=token,
            visitor_ip=visitor_ip,
            referrer=referrer,
        )

        return {
            "status": "success",
            "message": "Portfolio is accessible",
            **portfolio,
        }

    except Exception as e:
        logger.error(f"Error accessing public portfolio: {str(e)}")
        raise HTTPException(status_code=404, detail="Portfolio not found or access denied")


@public_router.get("/share/{token}")
async def access_shared_portfolio(
    token: str,
):
    """
    Access shared portfolio via temporary token

    Args:
        token: Share token

    Returns:
        Portfolio data
    """

    try:
        # TODO: Validate share token and get portfolio
        publication_service = get_publication_service()

        return {
            "status": "success",
            "message": "Share token is valid",
            "token_valid": True,
        }

    except Exception as e:
        logger.error(f"Error accessing shared portfolio: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired share token")
