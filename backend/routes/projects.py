from fastapi import APIRouter, HTTPException, status, Header
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import re
import os
import jwt
from models import ProjectCreate, ProjectUpdate, ProjectResponse
from .deps import get_current_user
from database import supabase
router = APIRouter()
HEADLESS_SECRET = os.environ.get("HEADLESS_SECRET", "super-secret-headless-key")

@router.post("/{project_id}/export-pdf")
async def export_pdf(project_id: str, authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    
    # Verify ownership
    response = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Generate a short-lived token to bypass frontend auth for headless browser
    headless_token = jwt.encode(
        {"project_id": project_id, "user_id": current_user["user_id"], "exp": datetime.utcnow() + timedelta(minutes=5)},
        HEADLESS_SECRET,
        algorithm="HS256"
    )
    
    try:
        from services.pdf_generator import generate_portfolio_pdf
        pdf_bytes = await generate_portfolio_pdf(project_id, headless_token)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f'attachment; filename="portfolio-{project_id}.pdf"'
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== Routes ====================

@router.get("", response_model=List[ProjectResponse])
async def list_projects(authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    try:
        response = supabase.table("projects").select("*").eq("user_id", current_user["user_id"]).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("", response_model=ProjectResponse)
async def create_project(req: ProjectCreate, authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    try:
        project_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "title": req.title,
            "description": req.description,
            "project_type": req.project_type.value,
            "status": "draft",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        response = supabase.table("projects").insert(project_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, req: ProjectUpdate, authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    try:
        # Check ownership first
        existing = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing.data[0]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        update_data = req.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        if "project_type" in update_data and update_data["project_type"]:
            update_data["project_type"] = update_data["project_type"].value
        response = supabase.table("projects").update(update_data).eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        return response.data[0] if response.data else None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(project_id: str, authorization: str = Header(None)):
    current_user = get_current_user(authorization)
    try:
        # Check ownership first
        existing = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing.data[0]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        supabase.table("projects").delete().eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        return {"message": "Project deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{project_id}/analyze-assets")
async def analyze_project_assets(project_id: str, authorization: str = Header(None)):
    """Phase 4: auto-tag a project's assets (type / subtype / orientation /
    priority / best_usage) for the composition engine."""
    current_user = get_current_user(authorization)
    try:
        proj = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not proj.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
        assets = supabase.table("assets").select("*").eq("project_id", project_id).execute()
        from services.asset_intelligence import analyze_assets
        tags = analyze_assets(assets.data or [])
        return {"project_id": project_id, "count": len(tags), "assets": tags}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ==================== Publishing ====================

def generate_slug(title: str, project_id: str) -> str:
    """Generate URL-friendly slug from title"""
    # Convert to lowercase, replace spaces with hyphens, remove special chars
    slug = re.sub(r'[^a-z0-9\s-]', '', title.lower())
    slug = re.sub(r'\s+', '-', slug.strip())
    slug = re.sub(r'-+', '-', slug)  # collapse multiple hyphens
    # Add first 8 chars of project_id for uniqueness
    slug = f"{slug}-{project_id[:8]}" if slug else project_id[:8]
    return slug

@router.post("/{project_id}/publish")
async def publish_project(project_id: str, authorization: str = Header(None)):
    """Publish project and make it publicly viewable"""
    current_user = get_current_user(authorization)
    try:
        # Verify ownership
        response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        project = response.data[0]
        slug = generate_slug(project["title"], project_id)

        # Update project
        update_data = {
            "status": "published",
            "updated_at": datetime.utcnow().isoformat(),
        }
        updated = supabase.table("projects").update(update_data).eq("id", project_id).execute()

        return {
            "project_id": project_id,
            "slug": project_id,
            "share_url": f"/portfolio/{project_id}",
            "is_published": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{project_id}/unpublish")
async def unpublish_project(project_id: str, authorization: str = Header(None)):
    """Unpublish project (make private)"""
    current_user = get_current_user(authorization)
    try:
        # Verify ownership
        response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        # Update project
        update_data = {
            "status": "draft",
            "updated_at": datetime.utcnow().isoformat(),
        }
        supabase.table("projects").update(update_data).eq("id", project_id).execute()

        return {"message": "Project unpublished", "is_published": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/public/{slug}")
async def get_public_portfolio(slug: str):
    """Get published portfolio by slug (no auth required)"""
    try:
        response = supabase.table("projects").select("*").eq("id", slug).eq("status", "published").execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

        project = response.data[0]

        # Ignore view_count update as the column doesn't exist on projects

        # Load the document
        from services.storage import get_storage_client
        doc_path = f"documents/{project['id']}.json"
        storage_client = get_storage_client()
        document = await storage_client.download_json(doc_path)

        return {
            "project": {
                "id": project["id"],
                "title": project["title"],
                "description": project.get("description"),
                "slug": slug,
                "created_at": project["created_at"],
                "updated_at": project["updated_at"],
                "view_count": project.get("view_count", 0),
            },
            "document": document,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
