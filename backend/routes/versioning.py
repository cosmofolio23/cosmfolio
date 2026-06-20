"""
Asset versioning API endpoints
Phase 2: Task 2.7 - Version history and restoration
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from routes.deps import get_current_user
from services.versioning import get_versioning_service
from error_handlers import (
    ResourceNotFoundException,
    AuthorizationException,
)
from database import supabase

router = APIRouter()


# ==================== HELPERS ====================

def _verify_portfolio_owner(portfolio_id: str, user_id: str) -> str:
    """Verify ownership of project/portfolio and return owner user_id"""
    owner_id = None
    try:
        # Check projects table first (since portfolio_id is project_id from the frontend)
        project = supabase.table("projects").select("user_id").eq("id", portfolio_id).execute()
        if project.data:
            owner_id = project.data[0]["user_id"]
        else:
            # If not in projects, try portfolios table
            portfolio = supabase.table("portfolios").select("project_id").eq("id", portfolio_id).execute()
            if portfolio.data:
                parent_project_id = portfolio.data[0]["project_id"]
                project = supabase.table("projects").select("user_id").eq("id", parent_project_id).execute()
                if project.data:
                    owner_id = project.data[0]["user_id"]
    except Exception as e:
        print(f"[WARNING] Error verifying portfolio owner: {e}")
        
    if not owner_id:
        raise ResourceNotFoundException("Project or Portfolio", portfolio_id)
        
    if owner_id != user_id:
        raise AuthorizationException()
        
    return owner_id


def _get_asset_record(asset_id: str, portfolio_id: str):
    """Fetch asset safely trying project_id first, then falling back to portfolio_id"""
    try:
        res = supabase.table("assets").select("*").eq("id", asset_id).eq("project_id", portfolio_id).execute()
        if res.data:
            return res
    except Exception:
        pass
        
    # Fallback to portfolio_id
    res = supabase.table("assets").select("*").eq("id", asset_id).eq("portfolio_id", portfolio_id).execute()
    if not res.data:
        raise ResourceNotFoundException("Asset", asset_id)
    return res


# ==================== VERSION HISTORY ====================

@router.get("/{portfolio_id}/assets/{asset_id}/versions")
async def get_asset_versions(
    portfolio_id: str,
    asset_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get version history for an asset

    Returns paginated list of versions
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Verify asset exists
        asset = _get_asset_record(asset_id, portfolio_id)

        # Get version history
        versioning_service = get_versioning_service()
        history = await versioning_service.get_version_history(
            asset_id,
            limit=limit,
            offset=offset
        )

        return {
            "asset_id": asset_id,
            "portfolio_id": portfolio_id,
            "versions": history["versions"],
            "pagination": {
                "total_count": history["total_count"],
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < history["total_count"],
            }
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== VERSION DETAILS ====================

@router.get("/{portfolio_id}/assets/{asset_id}/versions/{version_num}")
async def get_asset_version(
    portfolio_id: str,
    asset_id: str,
    version_num: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of specific asset version

    Returns: {version_num, file_size, mime_type, created_at, storage_path, notes}
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Verify asset exists
        asset = _get_asset_record(asset_id, portfolio_id)

        # Get version
        versioning_service = get_versioning_service()
        version = await versioning_service.get_version(asset_id, version_num)

        return {
            "asset_id": asset_id,
            "version_num": version["version_num"],
            "file_size": version.get("file_size"),
            "file_size_formatted": f"{version.get('file_size', 0) / 1024:.2f} KB" if version.get("file_size") else "unknown",
            "mime_type": version.get("mime_type"),
            "version_notes": version.get("version_notes"),
            "created_at": version.get("created_at"),
            "storage_path": version.get("storage_path"),
            "metadata": version.get("metadata", {}),
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== VERSION RESTORATION ====================

@router.post("/{portfolio_id}/assets/{asset_id}/versions/{version_num}/restore")
async def restore_asset_version(
    portfolio_id: str,
    asset_id: str,
    version_num: int,
    restore_notes: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Restore asset to previous version

    Creates a new version record with restoration notes
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Verify asset exists
        asset = _get_asset_record(asset_id, portfolio_id)

        # Restore version
        versioning_service = get_versioning_service()
        result = await versioning_service.restore_version(
            asset_id,
            portfolio_id,
            version_num,
            restore_notes=restore_notes
        )

        return {
            "asset_id": result["asset_id"],
            "restored_to_version": result["restored_to_version"],
            "new_version_num": result["new_version_num"],
            "restored_at": result["restored_at"],
            "message": f"Asset restored to version {version_num}",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== VERSION COMPARISON ====================

@router.get("/{portfolio_id}/assets/{asset_id}/versions/{version_a}/compare/{version_b}")
async def compare_asset_versions(
    portfolio_id: str,
    asset_id: str,
    version_a: int,
    version_b: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Compare two versions of an asset

    Returns: differences in file size, mime type, storage location
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Verify asset exists
        asset = _get_asset_record(asset_id, portfolio_id)

        # Compare versions
        versioning_service = get_versioning_service()
        comparison = await versioning_service.compare_versions(
            asset_id,
            version_a,
            version_b
        )

        return {
            "asset_id": comparison["asset_id"],
            "version_a": comparison["version_a"],
            "version_b": comparison["version_b"],
            "differences": {
                "file_size": {
                    "version_a": comparison["differences"]["file_size"]["a"],
                    "version_b": comparison["differences"]["file_size"]["b"],
                    "changed": comparison["differences"]["file_size"]["changed"],
                    "difference_bytes": abs(
                        (comparison["differences"]["file_size"]["b"] or 0) -
                        (comparison["differences"]["file_size"]["a"] or 0)
                    ) if comparison["differences"]["file_size"]["changed"] else 0,
                },
                "mime_type": comparison["differences"]["mime_type"],
                "storage_path": comparison["differences"]["storage_path"],
            },
            "summary": f"Comparing version {version_a} vs version {version_b}",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== VERSION CLEANUP ====================

@router.post("/{portfolio_id}/assets/{asset_id}/versions/cleanup")
async def cleanup_old_versions(
    portfolio_id: str,
    asset_id: str,
    keep_count: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Clean up old versions, keeping only recent ones

    Returns: {deleted_count, kept_count}
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Verify asset exists
        asset = _get_asset_record(asset_id, portfolio_id)

        # Cleanup versions
        versioning_service = get_versioning_service()
        result = await versioning_service.clean_old_versions(
            asset_id,
            keep_count=keep_count
        )

        return {
            "asset_id": asset_id,
            "deleted_count": result["deleted_count"],
            "kept_count": result["kept_count"],
            "message": f"Deleted {result['deleted_count']} old versions, kept {result['kept_count']}",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== PORTFOLIO VERSIONING STATS ====================

@router.get("/{portfolio_id}/versions/statistics")
async def get_portfolio_versioning_stats(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get versioning statistics for portfolio

    Returns: total_assets, total_versions, avg_versions_per_asset
    """
    try:
        # Verify ownership
        _verify_portfolio_owner(portfolio_id, current_user["user_id"])

        # Get stats
        versioning_service = get_versioning_service()
        stats = await versioning_service.get_portfolio_version_stats(portfolio_id)

        return {
            "portfolio_id": portfolio_id,
            "total_assets": stats["total_assets"],
            "total_versions": stats["total_versions"],
            "avg_versions_per_asset": stats["avg_versions_per_asset"],
            "storage_estimate": {
                "note": "Use asset sizes to calculate actual storage usage",
            },
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

