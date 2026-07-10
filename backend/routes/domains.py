import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel

from database import supabase
from .deps import get_current_user

router = APIRouter()

VERCEL_API_TOKEN = os.getenv("VERCEL_API_TOKEN")
VERCEL_PROJECT_ID = os.getenv("VERCEL_PROJECT_ID")
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID") # Optional

class DomainRequest(BaseModel):
    domain: str

def get_vercel_headers():
    if not VERCEL_API_TOKEN:
        raise HTTPException(status_code=500, detail="Vercel API token not configured")
    return {
        "Authorization": f"Bearer {VERCEL_API_TOKEN}",
        "Content-Type": "application/json"
    }

def get_vercel_params():
    params = {}
    if VERCEL_TEAM_ID:
        params["teamId"] = VERCEL_TEAM_ID
    return params

@router.post("/api/projects/{project_id}/domain")
async def add_custom_domain(
    project_id: str,
    payload: DomainRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Add a custom domain to a project and register it with Vercel"""
    # 1. Verify project ownership
    res = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")

    domain = payload.domain.lower().strip()
    
    # 2. Register domain with Vercel
    if VERCEL_API_TOKEN and VERCEL_PROJECT_ID:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.vercel.com/v10/projects/{VERCEL_PROJECT_ID}/domains",
                headers=get_vercel_headers(),
                params=get_vercel_params(),
                json={"name": domain}
            )
            
            if resp.status_code not in (200, 201):
                # Vercel might return 400 if domain is already in use by another project etc.
                raise HTTPException(status_code=400, detail=f"Vercel error: {resp.text}")

    # 3. Save to Supabase
    try:
        supabase.table("projects").update({"custom_domain": domain}).eq("id", project_id).execute()
    except Exception as e:
        # If UNIQUE constraint fails
        raise HTTPException(status_code=400, detail="Domain is already in use by another project")
        
    return {"status": "success", "domain": domain}


@router.delete("/api/projects/{project_id}/domain")
async def remove_custom_domain(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove custom domain from a project and Vercel"""
    res = supabase.table("projects").select("custom_domain").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    domain = res.data[0].get("custom_domain")
    if not domain:
        return {"status": "success", "message": "No domain to remove"}
        
    # 1. Remove from Vercel
    if VERCEL_API_TOKEN and VERCEL_PROJECT_ID:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"https://api.vercel.com/v9/projects/{VERCEL_PROJECT_ID}/domains/{domain}",
                headers=get_vercel_headers(),
                params=get_vercel_params()
            )
            # Ignore 404s if it was already deleted on Vercel
            if resp.status_code not in (200, 404):
                raise HTTPException(status_code=400, detail=f"Vercel error: {resp.text}")

    # 2. Remove from Supabase
    supabase.table("projects").update({"custom_domain": None}).eq("id", project_id).execute()
    
    return {"status": "success"}


@router.get("/api/projects/{project_id}/domain/status")
async def check_domain_status(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check DNS verification status on Vercel"""
    res = supabase.table("projects").select("custom_domain").eq("id", project_id).eq("user_id", current_user["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    domain = res.data[0].get("custom_domain")
    if not domain:
        return {"status": "none", "verified": False}
        
    if not VERCEL_API_TOKEN or not VERCEL_PROJECT_ID:
        return {"status": "unknown", "verified": True, "domain": domain, "message": "Vercel integration not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.vercel.com/v9/projects/{VERCEL_PROJECT_ID}/domains/{domain}",
            headers=get_vercel_headers(),
            params=get_vercel_params()
        )
        
        if resp.status_code == 404:
            return {"status": "not_found", "verified": False, "domain": domain}
        elif resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Vercel error: {resp.text}")
            
        data = resp.json()
        verified = data.get("verified", False)
        
        return {
            "status": "verified" if verified else "pending",
            "verified": verified,
            "domain": domain,
            "verification": data.get("verification") # Info on what records to set
        }

@router.get("/api/public/domain/{domain}")
async def get_portfolio_by_domain(domain: str):
    """Fetch public portfolio details by its custom domain"""
    # Find the project with this domain
    res = supabase.table("projects").select("id").eq("custom_domain", domain.lower()).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Domain not mapped to any portfolio")
        
    project_id = res.data[0]["id"]
    return {"project_id": project_id}
