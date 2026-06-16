"""
AI generation API endpoints
Phase 4: Task 4.1 - AI-powered content generation
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from typing import Optional, List
from pydantic import BaseModel

from .deps import get_current_user
from services.ai_generation import get_ai_generation_service, AiTone
from error_handlers import ResourceNotFoundException, AuthorizationException
from database import supabase

router = APIRouter()

class PolishTextRequest(BaseModel):
    text: str
    tone: str = "academic"

# ==================== PROJECT DESCRIPTION ====================

@router.post("/{portfolio_id}/projects/{project_id}/generate-description")
async def generate_project_description(
    portfolio_id: str,
    project_id: str,
    tone: str = Query("professional", regex="^(academic|professional|creative|technical|marketing)$"),
    current_user: dict = Depends(get_current_user)
):
    """Generate AI project description"""
    try:
        # Verify access
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get project
        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise ResourceNotFoundException("Project", project_id)

        project_data = project.data[0]

        # Generate
        ai_service = get_ai_generation_service()
        result = await ai_service.generate_project_description(
            project_data.get("project_type", "residential"),
            project_data.get("location"),
            project_data.get("title"),
            tone
        )

        return {
            "portfolio_id": portfolio_id,
            "project_id": project_id,
            "generated_content": result,
            "tone": tone,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== CONCEPT STATEMENT ====================

@router.post("/{portfolio_id}/projects/{project_id}/generate-concept")
async def generate_concept_statement(
    portfolio_id: str,
    project_id: str,
    tone: str = Query("creative"),
    current_user: dict = Depends(get_current_user)
):
    """Generate concept statement"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise ResourceNotFoundException("Project", project_id)

        ai_service = get_ai_generation_service()
        statement = await ai_service.generate_concept_statement(
            project.data[0].get("project_type"),
            project.data[0].get("title"),
            project.data[0].get("description"),
            tone
        )

        return {
            "project_id": project_id,
            "concept_statement": statement,
            "tone": tone,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== IMAGE CAPTIONS ====================

@router.post("/{portfolio_id}/assets/{asset_id}/generate-caption")
async def generate_image_caption(
    portfolio_id: str,
    asset_id: str,
    image_context: str = Query(...),
    tone: str = Query("professional"),
    current_user: dict = Depends(get_current_user)
):
    """Generate AI caption for image"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        asset = supabase.table("assets").select("*").eq("id", asset_id).execute()
        if not asset.data:
            raise ResourceNotFoundException("Asset", asset_id)

        ai_service = get_ai_generation_service()
        caption = await ai_service.generate_image_caption(
            image_context,
            asset.data[0].get("asset_type", "image"),
            tone
        )

        return {
            "asset_id": asset_id,
            "caption": caption,
            "tone": tone,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ARCH-SPEAK COPYWRITER ====================

@router.post("/polish-text")
async def polish_text(
    request: PolishTextRequest,
    current_user: dict = Depends(get_current_user)
):
    """Polish and rewrite text using architectural terminology"""
    try:
        ai_service = get_ai_generation_service()
        polished = await ai_service.polish_text(
            text=request.text,
            tone=request.tone
        )
        return {
            "original_text": request.text,
            "polished_text": polished,
            "tone": request.tone
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== PORTFOLIO BIO ====================

@router.post("/{portfolio_id}/generate-bio")
async def generate_portfolio_bio(
    portfolio_id: str,
    architect_name: str = Query(...),
    specialties: List[str] = Query([]),
    experience_years: Optional[int] = Query(None),
    tone: str = Query("professional"),
    current_user: dict = Depends(get_current_user)
):
    """Generate architect biography"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        ai_service = get_ai_generation_service()
        bio = await ai_service.generate_portfolio_bio(
            architect_name,
            specialties,
            experience_years,
            tone
        )

        return {
            "portfolio_id": portfolio_id,
            "biography": bio,
            "tone": tone,
        }

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== TITLES & TAGLINES ====================

@router.post("/{portfolio_id}/projects/{project_id}/suggest-titles")
async def suggest_project_titles(
    portfolio_id: str,
    project_id: str,
    count: int = Query(5, ge=1, le=10),
    current_user: dict = Depends(get_current_user)
):
    """Suggest project titles"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise ResourceNotFoundException("Project", project_id)

        ai_service = get_ai_generation_service()
        titles = await ai_service.suggest_project_titles(
            project.data[0].get("project_type"),
            project.data[0].get("description"),
            count
        )

        return {
            "project_id": project_id,
            "suggested_titles": titles,
            "count": len(titles),
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{portfolio_id}/generate-taglines")
async def generate_portfolio_taglines(
    portfolio_id: str,
    firm_name: str = Query(...),
    specialties: List[str] = Query([]),
    tone: str = Query("creative"),
    current_user: dict = Depends(get_current_user)
):
    """Generate portfolio taglines"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        ai_service = get_ai_generation_service()
        taglines = await ai_service.generate_portfolio_tagline(
            firm_name,
            specialties,
            tone
        )

        return {
            "portfolio_id": portfolio_id,
            "suggested_taglines": taglines,
            "tone": tone,
        }

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== TONES & CONFIGURATION ====================

@router.get("/ai-tones")
async def get_available_tones(current_user: dict = Depends(get_current_user)):
    """Get available AI tones"""
    ai_service = get_ai_generation_service()
    tones = ai_service.get_available_tones()
    return {
        "tones": [
            {"name": name, "description": desc}
            for name, desc in tones.items()
        ]
    }

# ==================== CONTENT ANALYSIS ====================

@router.post("/{portfolio_id}/analyze-content")
async def analyze_content_quality(
    portfolio_id: str,
    text: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Analyze content quality"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        ai_service = get_ai_generation_service()
        analysis = await ai_service.analyze_content_quality(text)

        return {
            "portfolio_id": portfolio_id,
            "analysis": analysis,
        }

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== CONTENT IMPROVEMENT ====================

@router.post("/{portfolio_id}/improve-text")
async def improve_text(
    portfolio_id: str,
    text: str = Query(...),
    aspect: str = Query("clarity", regex="^(clarity|brevity|engagement|tone)$"),
    current_user: dict = Depends(get_current_user)
):
    """Improve existing text"""
    try:
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data or portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        ai_service = get_ai_generation_service()
        improved = await ai_service.improve_text(text, aspect)

        return {
            "portfolio_id": portfolio_id,
            "original_text": text,
            "improved_text": improved,
            "aspect": aspect,
        }

    except AuthorizationException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
