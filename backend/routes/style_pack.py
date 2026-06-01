"""
Style pack management API endpoints
Phase 3: Task 3.2 - Theme creation, presets, management
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from routes.deps import get_current_user
from services.style_pack import get_style_pack_service
from error_handlers import (
    ResourceNotFoundException,
    AuthorizationException,
)
from database import supabase
from models import StylePackCreateRequest

router = APIRouter()

# ==================== STYLE PACK CRUD ====================

@router.post("/{portfolio_id}/style-packs")
async def create_style_pack(
    portfolio_id: str,
    pack: StylePackCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new custom style pack

    Includes colors, typography, spacing, and optional custom CSS
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Create pack
        style_pack_service = get_style_pack_service()
        new_pack = await style_pack_service.create_style_pack(
            portfolio_id=portfolio_id,
            user_id=current_user["user_id"],
            name=pack.name,
            description=pack.description,
            colors={
                "primary": pack.primary_color,
                "secondary": pack.secondary_color,
                "accent": pack.accent_color,
                "background": pack.background_color,
                "text": pack.text_color,
            },
            typography={
                "font_family": pack.font_family.value,
                "font_size_base": pack.font_size_base,
                "line_height": pack.line_height,
                "border_radius": pack.border_radius,
            },
            custom_css=pack.custom_css,
        )

        return {
            "portfolio_id": portfolio_id,
            "style_pack": new_pack,
            "message": f"Style pack '{pack.name}' created successfully",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{portfolio_id}/style-packs")
async def list_style_packs(
    portfolio_id: str,
    include_defaults: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """
    List all style packs for portfolio

    Returns custom packs and optionally built-in presets
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get packs
        style_pack_service = get_style_pack_service()
        packs = await style_pack_service.list_style_packs(portfolio_id, include_defaults)

        # Add presets if requested
        if include_defaults:
            presets = style_pack_service.get_preset_packs()
            return {
                "portfolio_id": portfolio_id,
                "custom_packs": [p for p in packs["packs"] if p.get("is_custom")],
                "preset_packs": presets,
                "total_count": packs["total_count"] + len(presets),
                "custom_count": packs["custom_count"],
                "preset_count": len(presets),
            }

        return {
            "portfolio_id": portfolio_id,
            "style_packs": packs["packs"],
            "total_count": packs["total_count"],
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{portfolio_id}/style-packs/{pack_id}")
async def get_style_pack(
    portfolio_id: str,
    pack_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get style pack details including all configuration
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get pack
        style_pack_service = get_style_pack_service()
        pack = await style_pack_service.get_style_pack(portfolio_id, pack_id)

        return {
            "portfolio_id": portfolio_id,
            "style_pack": pack,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{portfolio_id}/style-packs/{pack_id}")
async def update_style_pack(
    portfolio_id: str,
    pack_id: str,
    name: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    custom_css: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Update style pack properties
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Build update data
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if custom_css is not None:
            update_data["custom_css"] = custom_css

        if not update_data:
            raise ValueError("No update fields provided")

        # Update pack
        style_pack_service = get_style_pack_service()
        updated_pack = await style_pack_service.update_style_pack(
            portfolio_id, pack_id, **update_data
        )

        return {
            "portfolio_id": portfolio_id,
            "style_pack": updated_pack,
            "message": "Style pack updated successfully",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{portfolio_id}/style-packs/{pack_id}")
async def delete_style_pack(
    portfolio_id: str,
    pack_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a custom style pack
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Delete pack
        style_pack_service = get_style_pack_service()
        await style_pack_service.delete_style_pack(portfolio_id, pack_id)

        return {
            "portfolio_id": portfolio_id,
            "pack_id": pack_id,
            "message": "Style pack deleted successfully",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== DEFAULT PACK ====================

@router.post("/{portfolio_id}/style-packs/{pack_id}/set-default")
async def set_default_pack(
    portfolio_id: str,
    pack_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Set a style pack as the default for the portfolio
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Set default
        style_pack_service = get_style_pack_service()
        default_pack = await style_pack_service.set_default_pack(portfolio_id, pack_id)

        return {
            "portfolio_id": portfolio_id,
            "default_pack": default_pack,
            "message": f"Style pack set as default",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{portfolio_id}/style-packs/default")
async def get_default_pack(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get the default style pack for the portfolio
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get default
        style_pack_service = get_style_pack_service()
        default_pack = await style_pack_service.get_default_pack(portfolio_id)

        return {
            "portfolio_id": portfolio_id,
            "default_pack": default_pack,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== PRESETS ====================

@router.get("/{portfolio_id}/style-packs/presets")
async def list_preset_packs(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of built-in preset style packs
    """
    try:
        # Verify portfolio access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        style_pack_service = get_style_pack_service()
        presets = style_pack_service.get_preset_packs()

        return {
            "portfolio_id": portfolio_id,
            "presets": presets,
            "total_count": len(presets),
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== AI GENERATION ====================

@router.post("/{portfolio_id}/style-packs/generate")
async def generate_style_pack(
    portfolio_id: str,
    mode: str = Query(..., description="mood | color | assets"),
    value: str = Query(..., description="mood name, hex color, or asset description"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a style pack using AI from mood, color, or asset description

    Args:
        mode: "mood" (e.g., "bold", "minimal", "luxury") | "color" (hex code) | "assets" (description)
        value: The input value based on mode
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Validate mode
        if mode not in ["mood", "color", "assets"]:
            raise ValueError("Mode must be 'mood', 'color', or 'assets'")

        # Generate pack using AI
        from services.ai_generation import get_ai_generation_service
        ai_service = get_ai_generation_service()

        generated_pack = await ai_service.generate_style_pack_from_prompt(
            mode=mode,
            value=value
        )

        return {
            "portfolio_id": portfolio_id,
            "mode": mode,
            "input_value": value,
            "generated_pack": generated_pack,
            "message": f"Style pack generated from {mode}: {value}",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== DUPLICATION ====================

@router.post("/{portfolio_id}/style-packs/{pack_id}/duplicate")
async def duplicate_style_pack(
    portfolio_id: str,
    pack_id: str,
    new_name: str = Query(..., min_length=1, max_length=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Duplicate an existing style pack with a new name
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Duplicate
        style_pack_service = get_style_pack_service()
        new_pack = await style_pack_service.duplicate_style_pack(
            portfolio_id, pack_id, new_name
        )

        return {
            "portfolio_id": portfolio_id,
            "original_pack_id": pack_id,
            "new_pack": new_pack,
            "message": f"Style pack duplicated as '{new_name}'",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== COMPARISON ====================

@router.get("/{portfolio_id}/style-packs/{pack_id_1}/compare/{pack_id_2}")
async def compare_style_packs(
    portfolio_id: str,
    pack_id_1: str,
    pack_id_2: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Compare two style packs to show differences
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Compare
        style_pack_service = get_style_pack_service()
        comparison = await style_pack_service.compare_style_packs(pack_id_1, pack_id_2)

        return {
            "portfolio_id": portfolio_id,
            "comparison": comparison,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== EXPORT ====================

@router.get("/{portfolio_id}/style-packs/{pack_id}/export-css")
async def export_pack_as_css(
    portfolio_id: str,
    pack_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Export style pack as CSS variables
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get pack and export
        style_pack_service = get_style_pack_service()
        pack = await style_pack_service.get_style_pack(portfolio_id, pack_id)
        css_content = style_pack_service.generate_css_from_pack(pack)

        return {
            "portfolio_id": portfolio_id,
            "pack_id": pack_id,
            "format": "css",
            "content": css_content,
            "file_name": f"{pack.get('name', 'style').lower().replace(' ', '-')}.css",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
