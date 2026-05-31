"""
Design system API endpoints
Phase 3: Task 3.1 - Color management, tokens, validation
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Dict, Any, Optional, List

from routes.deps import get_current_user
from services.design_system import get_design_system_service, ColorUtils
from error_handlers import (
    ResourceNotFoundException,
    AuthorizationException,
    ValidationException,
)
from database import supabase
from models import (
    DesignSystemRequest,
    DesignSystemResponse,
    DesignTokenRequest,
    DesignTokenResponse,
    CSSVariableRequest,
    CSSVariableResponse,
)

router = APIRouter()

# ==================== DESIGN TOKENS ====================

@router.post("/{portfolio_id}/design-system/tokens")
async def create_design_token(
    portfolio_id: str,
    token: DesignTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a design token

    Tokens are reusable design values (colors, spacing, etc.)
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Store token
        design_system_service = get_design_system_service()
        token_dict = design_system_service.create_token(
            token.name,
            token.category,
            token.value,
            token.description
        )

        return {
            "portfolio_id": portfolio_id,
            "token": token_dict,
            "message": f"Token '{token.name}' created successfully",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{portfolio_id}/design-system/tokens")
async def list_design_tokens(
    portfolio_id: str,
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    List design tokens, optionally filtered by category

    Categories: color, spacing, typography, shadow, border, etc.
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()
        tokens = design_system_service.list_tokens(category=category)

        return {
            "portfolio_id": portfolio_id,
            "tokens": tokens,
            "total_count": len(tokens),
            "category_filter": category,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== COLOR MANAGEMENT ====================

@router.post("/{portfolio_id}/design-system/validate-palette")
async def validate_color_palette(
    portfolio_id: str,
    colors: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    Validate color palette for accessibility and harmony

    Returns: issues, warnings, recommendations
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()
        analysis = design_system_service.validate_color_palette(colors)

        return {
            "portfolio_id": portfolio_id,
            "analysis": analysis,
            "colors_analyzed": len(colors),
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{portfolio_id}/design-system/generate-palette")
async def generate_color_palette(
    portfolio_id: str,
    base_color: str = Query(..., regex="^#[0-9a-fA-F]{6}$"),
    include_variants: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a color palette from a base color

    Includes lighter and darker variants for comprehensive palette
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()
        palette = design_system_service.generate_color_palette(
            base_color,
            include_variants=include_variants
        )

        return {
            "portfolio_id": portfolio_id,
            "base_color": base_color,
            "palette": palette,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{portfolio_id}/design-system/suggest-accent")
async def suggest_accent_color(
    portfolio_id: str,
    primary: str = Query(..., regex="^#[0-9a-fA-F]{6}$"),
    secondary: str = Query(..., regex="^#[0-9a-fA-F]{6}$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Suggest an accent color that complements primary and secondary colors

    Uses color theory for complementary color selection
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()
        accent = design_system_service.suggest_accent_color(primary, secondary)

        return {
            "portfolio_id": portfolio_id,
            "primary": primary,
            "secondary": secondary,
            "suggested_accent": accent,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{portfolio_id}/design-system/check-contrast")
async def check_contrast_ratio(
    portfolio_id: str,
    text_color: str = Query(..., regex="^#[0-9a-fA-F]{6}$"),
    background_color: str = Query(..., regex="^#[0-9a-fA-F]{6}$"),
    level: str = Query("AA", regex="^(AA|AAA)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Check WCAG contrast compliance between text and background colors

    Returns: ratio, compliant (AA/AAA), recommendation
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        ratio = ColorUtils.get_contrast_ratio(text_color, background_color)
        compliant = ColorUtils.check_wcag_compliance(text_color, background_color, level)

        return {
            "portfolio_id": portfolio_id,
            "text_color": text_color,
            "background_color": background_color,
            "contrast_ratio": round(ratio, 2),
            "wcag_level": level,
            "compliant": compliant,
            "minimum_ratio": "4.5" if level == "AA" else "7.0",
            "recommendation": "Meets WCAG standards" if compliant else "Consider adjusting colors",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== DESIGN SYSTEM ANALYSIS ====================

@router.post("/{portfolio_id}/design-system/analyze")
async def analyze_design_system(
    portfolio_id: str,
    design_system: DesignSystemRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Comprehensive analysis of design system

    Analyzes colors, typography, spacing for consistency and accessibility
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()

        # Prepare data for analysis
        colors_dict = {
            "primary": design_system.primary_color,
            "secondary": design_system.secondary_color,
        }
        if design_system.neutral_colors:
            for i, color in enumerate(design_system.neutral_colors):
                colors_dict[f"neutral_{i}"] = color

        typography_dict = design_system.typography.dict()
        spacing_dict = design_system.spacing.dict()

        analysis = design_system_service.analyze_design_system(
            colors_dict,
            typography_dict,
            spacing_dict
        )

        return {
            "portfolio_id": portfolio_id,
            "system_name": design_system.name,
            "analysis": analysis,
            "grade": analysis["grade"],
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== EXPORT ====================

@router.post("/{portfolio_id}/design-system/export-css")
async def export_as_css(
    portfolio_id: str,
    design_system: DesignSystemRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Export design system as CSS variables

    Generates CSS with --variable-name format for use in stylesheets
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()

        colors_dict = {
            "primary": design_system.primary_color,
            "secondary": design_system.secondary_color,
        }
        if design_system.neutral_colors:
            for i, color in enumerate(design_system.neutral_colors):
                colors_dict[f"neutral_{i}"] = color

        css_content = design_system_service.export_as_css_variables(
            colors_dict,
            design_system.typography.dict(),
            design_system.spacing.dict()
        )

        return {
            "portfolio_id": portfolio_id,
            "format": "css",
            "content": css_content,
            "file_name": f"{design_system.name.lower().replace(' ', '-')}-variables.css",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{portfolio_id}/design-system/export-json")
async def export_as_json(
    portfolio_id: str,
    design_system: DesignSystemRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Export design system as JSON

    Useful for programmatic access and version control
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        design_system_service = get_design_system_service()

        colors_dict = {
            "primary": design_system.primary_color,
            "secondary": design_system.secondary_color,
        }
        if design_system.neutral_colors:
            for i, color in enumerate(design_system.neutral_colors):
                colors_dict[f"neutral_{i}"] = color

        json_content = design_system_service.export_as_json(
            colors_dict,
            design_system.typography.dict(),
            design_system.spacing.dict()
        )

        return {
            "portfolio_id": portfolio_id,
            "format": "json",
            "content": json_content,
            "file_name": f"{design_system.name.lower().replace(' ', '-')}-design-system.json",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
