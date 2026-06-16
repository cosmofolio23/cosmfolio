"""
Asset management API endpoints
Phase 2: Task 2.3 - Upload, list, update, delete assets
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query, Form
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from models import (
    AssetUploadRequest,
    AssetMetadataRequest,
    AssetResponse,
    AssetListResponse,
    AssetVersionResponse,
    AssetVersionListResponse,
    BulkAssetUploadResponse,
)
from .deps import get_current_user
from services.storage import get_storage_client
from services.upload import get_upload_manager
from database import supabase
from error_handlers import (
    ResourceNotFoundException,
    AuthorizationException,
    ValidationException,
    DatabaseException,
)

router = APIRouter()

# ==================== ASSET UPLOAD ====================

@router.post("/{portfolio_id}/assets", response_model=AssetResponse)
async def upload_asset(
    portfolio_id: str,
    file: UploadFile = File(...),
    asset_type: str = Form("render"),
    tags: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload single asset file"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Validate asset type
        valid_types = ["render", "plan", "section", "diagram", "detail", "material",
                       "cover", "elevation", "concept", "model", "process", "site", "other"]
        if asset_type not in valid_types:
            raise ValidationException(
                f"Invalid asset_type. Must be one of: {', '.join(valid_types)}",
                context={"valid_types": valid_types}
            )

        # Generate asset ID
        asset_id = str(uuid4())
        upload_manager = get_upload_manager()

        # Upload file
        upload_result = await upload_manager.upload_file(
            file,
            portfolio_id,
            asset_id,
            asset_type
        )

        # Parse tags
        tag_list = []
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]

        # Build public URLs the frontend can render directly
        storage = get_storage_client()
        public_url = await storage.get_public_url(upload_result["storage_path"])
        preview_path = upload_result.get("preview_path") or upload_result["storage_path"]
        preview_public = await storage.get_public_url(preview_path)

        # Try inserting simple schema first (as defined in database.py)
        simple_data = {
            "id": asset_id,
            "project_id": portfolio_id,
            "asset_type": asset_type,
            "file_url": public_url,
            "file_name": file.filename,
            "file_size": upload_result.get("file_size", 0),
            "analysis": {},
            "upload_order": 0,
            "created_at": datetime.utcnow().isoformat(),
        }

        inserted_record = None
        try:
            response = supabase.table("assets").insert(simple_data).execute()
            if response.data:
                inserted_record = response.data[0]
        except Exception as simple_err:
            print(f"[WARNING] Simple schema insert failed, trying minimal schema: {simple_err}")
            try:
                minimal_data = {
                    "id": asset_id,
                    "project_id": portfolio_id,
                    "asset_type": asset_type,
                    "file_url": public_url,
                    "file_name": file.filename,
                    "file_size": upload_result.get("file_size", 0),
                    "upload_order": 0,
                    "analysis": {},
                    "created_at": datetime.utcnow().isoformat(),
                }
                response = supabase.table("assets").insert(minimal_data).execute()
                if response.data:
                    inserted_record = response.data[0]
            except Exception as minimal_err:
                print(f"[WARNING] Minimal schema insert failed, trying extended schema: {minimal_err}")
                # Fallback: Create extended asset record
                asset_data = {
                    "id": asset_id,
                    "user_id": current_user["user_id"],
                    "portfolio_id": portfolio_id,
                    "file_name": file.filename,
                    "original_file_name": file.filename,
                    "file_size": upload_result["file_size"],
                    "mime_type": upload_result["mime_type"],
                    "asset_type": asset_type,
                    "storage_path": upload_result["storage_path"],
                    "thumb_path": upload_result["thumb_path"],
                    "preview_path": upload_result["preview_path"],
                    "width": upload_result["width"],
                    "height": upload_result["height"],
                    "aspect_ratio": upload_result["aspect_ratio"],
                    "description": description,
                    "exif_data": upload_result["metadata"].get("exif", {}),
                    "upload_status": "completed",
                    "thumbnail_status": "completed",
                    "version": 1,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }
                # Insert asset
                response = supabase.table("assets").insert(asset_data).execute()
                if response.data:
                    inserted_record = response.data[0]

        if not inserted_record:
            # The file is already in storage and we have a usable public URL — the
            # editor only needs that URL to place the image. Don't fail the whole
            # upload just because the metadata row couldn't be written (schema/RLS
            # drift on the assets table). Degrade gracefully and return the URL.
            if public_url:
                print("[WARNING] Asset metadata insert failed; returning storage URL without DB row")
                return {
                    "id": asset_id,
                    "project_id": portfolio_id,
                    "asset_type": asset_type,
                    "file_url": public_url,
                    "file_name": file.filename,
                    "file_size": upload_result.get("file_size", 0),
                    "tags": tag_list,
                    "url": public_url,
                    "preview_url": preview_public,
                }
            raise DatabaseException("Failed to create asset record")

        # Insert tags
        if tag_list:
            tag_data = [
                {
                    "id": str(uuid4()),
                    "asset_id": asset_id,
                    "tag_name": tag,
                    "created_at": datetime.utcnow().isoformat(),
                }
                for tag in tag_list
            ]
            try:
                supabase.table("asset_tags").insert(tag_data).execute()
            except Exception as tag_err:
                print(f"[WARNING] Inserting tags failed: {tag_err}")

        # Return asset with tags
        return {
            **inserted_record,
            "project_id": portfolio_id,
            "file_url": public_url,
            "tags": tag_list,
            "url": public_url,
            "preview_url": preview_public,
        }

    except (ResourceNotFoundException, AuthorizationException, ValidationException, DatabaseException):
        raise
    except Exception as e:
        # Better error messages for frontend
        msg = str(e).lower()
        if 'bucket' in msg or 'permission' in msg or 'access denied' in msg:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Storage service unavailable. Try again later.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== BATCH UPLOAD ====================

@router.post("/{portfolio_id}/assets/bulk")
async def bulk_upload_assets(
    portfolio_id: str,
    files: List[UploadFile] = File(...),
    asset_type: str = Form("render"),
    design_project_index: Optional[int] = Form(None),
    design_project_id: Optional[str] = Form(None),
    design_project_name: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload multiple assets at once"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Upload batch (uploads to storage)
        upload_manager = get_upload_manager()
        results = await upload_manager.upload_batch(files, portfolio_id, asset_type)

        # Insert DB records for each successfully uploaded asset
        # Try multiple schema variations (older simple schema + newer extended schema)
        for upload_result in results.get("assets", []):
            asset_id = upload_result.get("asset_id")
            file_url = upload_result.get("file_url") or upload_result.get("storage_path", "")
            file_name = upload_result.get("file_name", "unknown")

            # Insert with ACTUAL schema columns only:
            # id, project_id, asset_type, file_url, file_name, file_size, upload_order, analysis, created_at
            try:
                # Build analysis JSONB with image metadata + optional design project tagging
                analysis_data = {
                    "width": upload_result.get("width"),
                    "height": upload_result.get("height"),
                    "aspect_ratio": upload_result.get("aspect_ratio"),
                    "mime_type": upload_result.get("mime_type"),
                    "storage_path": upload_result.get("storage_path"),
                    "thumb_path": upload_result.get("thumb_path"),
                    "preview_path": upload_result.get("preview_path"),
                }
                # If this upload belongs to a specific design project, tag it
                if design_project_index is not None:
                    analysis_data["design_project_index"] = design_project_index
                if design_project_id:
                    analysis_data["design_project_id"] = design_project_id
                if design_project_name:
                    analysis_data["design_project_name"] = design_project_name

                simple_data = {
                    "id": asset_id,
                    "project_id": portfolio_id,
                    "asset_type": asset_type,
                    "file_url": file_url,
                    "file_name": file_name,
                    "file_size": upload_result.get("file_size", 0),
                    "upload_order": design_project_index if design_project_index is not None else 0,
                    "analysis": analysis_data,
                    "created_at": datetime.utcnow().isoformat(),
                }
                result = supabase.table("assets").insert(simple_data).execute()
                print(f"[OK] Asset inserted: {asset_id} (design_project_index={design_project_index})")
            except Exception as db_err:
                print(f"[WARNING] Simple schema insert failed: {db_err}")
                # Try EXTENDED schema as fallback
                try:
                    asset_data = {
                        "id": asset_id,
                        "user_id": current_user["user_id"],
                        "portfolio_id": portfolio_id,
                        "project_id": portfolio_id,
                        "file_name": file_name,
                        "original_file_name": file_name,
                        "file_size": upload_result.get("file_size", 0),
                        "mime_type": upload_result.get("mime_type", "image/jpeg"),
                        "asset_type": asset_type,
                        "storage_path": upload_result.get("storage_path", ""),
                        "thumb_path": upload_result.get("thumb_path", ""),
                        "preview_path": upload_result.get("preview_path", ""),
                        "width": upload_result.get("width"),
                        "height": upload_result.get("height"),
                        "aspect_ratio": upload_result.get("aspect_ratio"),
                        "file_url": file_url,
                        "upload_status": "completed",
                        "thumbnail_status": "completed",
                        "version": 1,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                    supabase.table("assets").insert(asset_data).execute()
                    print(f"[OK] Asset inserted (extended schema): {asset_id}")
                except Exception as db_err2:
                    print(f"[ERROR] Both schema attempts failed for {asset_id}: {db_err2}")

        # Return raw dict so frontend can grab file_url for each uploaded asset
        return {
            "uploaded": results["uploaded"],
            "failed": results["failed"],
            "total": results["total"],
            "errors": results["errors"] if results["errors"] else None,
            "assets": results.get("assets", []),  # Each has file_url, asset_id, etc.
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== LIST ASSETS ====================

@router.get("/{portfolio_id}/assets")
async def list_assets(
    portfolio_id: str,
    asset_type: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|file_size|file_name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List portfolio assets with filtering and sorting"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Build query - use project_id (actual column name in DB)
        # Try project_id first, fall back to portfolio_id if column doesn't exist
        try:
            query = supabase.table("assets").select("*").eq("project_id", portfolio_id)
            # Apply filters
            if asset_type:
                query = query.eq("asset_type", asset_type)
            # Apply sorting
            is_desc = sort_order == "desc"
            query = query.order(sort_by, desc=is_desc)
            # Get total count
            count_response = supabase.table("assets").select("id", count="exact").eq(
                "project_id", portfolio_id
            ).execute()
        except Exception:
            # Fallback to portfolio_id column (extended schema)
            query = supabase.table("assets").select("*").eq("portfolio_id", portfolio_id)
            if asset_type:
                query = query.eq("asset_type", asset_type)
            is_desc = sort_order == "desc"
            query = query.order(sort_by, desc=is_desc)
            count_response = supabase.table("assets").select("id", count="exact").eq(
                "portfolio_id", portfolio_id
            ).execute()
        total = count_response.count

        # Paginate
        offset = (page - 1) * page_size
        response = query.range(offset, offset + page_size - 1).execute()

        assets = response.data or []

        # Fix file_url for assets that don't have a proper public URL
        # Also expose width/height from analysis JSONB column
        # AND add default values for fields the AssetListResponse model expects
        from services.storage import get_storage_client
        storage_client = get_storage_client()
        for asset in assets:
            current_url = asset.get("file_url") or ""
            analysis = asset.get("analysis") or {}

            # Expose analysis fields at top level for frontend
            if isinstance(analysis, dict):
                asset["width"] = analysis.get("width")
                asset["height"] = analysis.get("height")
                asset["mime_type"] = analysis.get("mime_type")
                asset["storage_path"] = analysis.get("storage_path")
                asset["thumb_path"] = analysis.get("thumb_path")
                asset["preview_path"] = analysis.get("preview_path")
                # Per-project tagging (Batch 1.2)
                asset["design_project_index"] = analysis.get("design_project_index")
                asset["design_project_id"] = analysis.get("design_project_id")
                asset["design_project_name"] = analysis.get("design_project_name")

            storage_path = asset.get("storage_path", "") or (analysis.get("storage_path", "") if isinstance(analysis, dict) else "")
            # If file_url is missing or doesn't start with http, regenerate it
            if storage_path and (not current_url or not current_url.startswith("http")):
                try:
                    public_url = await storage_client.get_public_url(storage_path)
                    asset["file_url"] = public_url
                except Exception as url_err:
                    print(f"[WARNING] Could not generate URL for asset {asset.get('id')}: {url_err}")

            # Add defaults for fields required by AssetListResponse model
            asset.setdefault("portfolio_id", asset.get("project_id", ""))
            asset.setdefault("file_type", asset.get("asset_type", "render"))
            asset.setdefault("preview_url", asset.get("file_url", ""))
            asset.setdefault("description", "")
            asset.setdefault("updated_at", asset.get("created_at"))
            asset.setdefault("version", 1)
            asset.setdefault("user_id", "")
            asset.setdefault("original_file_name", asset.get("file_name", ""))
            asset.setdefault("mime_type", asset.get("mime_type") or "image/jpeg")
            asset.setdefault("upload_status", "completed")
            asset.setdefault("thumbnail_status", "completed")
            asset.setdefault("exif_data", {})
            asset.setdefault("is_latest", True)
            asset.setdefault("deleted_at", None)
            asset.setdefault("custom_metadata", {})

        # Get tags for each asset
        for asset in assets:
            try:
                tags_response = supabase.table("asset_tags").select("tag_name").eq(
                    "asset_id", asset["id"]
                ).execute()
                asset["tags"] = [t["tag_name"] for t in tags_response.data]
            except Exception:
                asset["tags"] = []

        # Filter by tag if specified
        if tag:
            assets = [a for a in assets if tag in a.get("tags", [])]

        total_pages = (total + page_size - 1) // page_size

        # Return as plain dict to avoid Pydantic validation errors
        return {
            "items": assets,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== GET ASSET ====================

@router.get("/{portfolio_id}/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    portfolio_id: str,
    asset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get asset details with metadata and tags"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Get asset
        response = supabase.table("assets").select("*").eq(
            "id", asset_id
        ).eq("portfolio_id", portfolio_id).execute()

        if not response.data:
            raise ResourceNotFoundException("Asset", asset_id)

        asset = response.data[0]

        # Get tags
        tags_response = supabase.table("asset_tags").select("tag_name").eq(
            "asset_id", asset_id
        ).execute()
        asset["tags"] = [t["tag_name"] for t in tags_response.data]

        # Get preview URL
        storage_client = get_storage_client()
        asset["preview_url"] = await storage_client.get_public_url(asset["preview_path"])

        return asset

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== UPDATE ASSET ====================

@router.put("/{portfolio_id}/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    portfolio_id: str,
    asset_id: str,
    req: AssetMetadataRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update asset metadata and tags"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Get asset
        response = supabase.table("assets").select("*").eq(
            "id", asset_id
        ).eq("portfolio_id", portfolio_id).execute()

        if not response.data:
            raise ResourceNotFoundException("Asset", asset_id)

        # Build update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat(),
        }

        if req.description is not None:
            update_data["description"] = req.description

        if req.asset_type is not None:
            valid_types = ["render", "plan", "section", "diagram", "detail", "material",
                       "cover", "elevation", "concept", "model", "process", "site", "other"]
            if req.asset_type.value not in valid_types:
                raise ValidationException(f"Invalid asset_type: {req.asset_type}")
            update_data["asset_type"] = req.asset_type.value

        # Update asset
        update_response = supabase.table("assets").update(update_data).eq(
            "id", asset_id
        ).execute()

        if not update_response.data:
            raise DatabaseException("Failed to update asset")

        asset = update_response.data[0]

        # Update tags if provided
        if req.tags is not None:
            # Delete existing tags
            supabase.table("asset_tags").delete().eq("asset_id", asset_id).execute()

            # Insert new tags
            if req.tags:
                tag_data = [
                    {
                        "id": str(uuid4()),
                        "asset_id": asset_id,
                        "tag_name": tag,
                        "created_at": datetime.utcnow().isoformat(),
                    }
                    for tag in req.tags
                ]
                supabase.table("asset_tags").insert(tag_data).execute()

            asset["tags"] = req.tags
        else:
            # Get existing tags
            tags_response = supabase.table("asset_tags").select("tag_name").eq(
                "asset_id", asset_id
            ).execute()
            asset["tags"] = [t["tag_name"] for t in tags_response.data]

        return asset

    except (ResourceNotFoundException, AuthorizationException, ValidationException, DatabaseException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== DELETE ASSET ====================

@router.delete("/{portfolio_id}/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    portfolio_id: str,
    asset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete asset and all associated files"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Get asset
        response = supabase.table("assets").select("*").eq(
            "id", asset_id
        ).eq("portfolio_id", portfolio_id).execute()

        if not response.data:
            raise ResourceNotFoundException("Asset", asset_id)

        # Delete from storage
        storage_client = get_storage_client()
        await storage_client.delete_asset(portfolio_id, asset_id)

        # Delete from database (soft delete)
        supabase.table("assets").update({
            "deleted_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", asset_id).execute()

        # Delete tags
        supabase.table("asset_tags").delete().eq("asset_id", asset_id).execute()

        # Delete uses
        supabase.table("asset_uses").delete().eq("asset_id", asset_id).execute()

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== ASSET VERSIONS ====================

@router.get("/{portfolio_id}/assets/{asset_id}/versions", response_model=AssetVersionListResponse)
async def get_asset_versions(
    portfolio_id: str,
    asset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get version history for asset"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Get asset
        asset_response = supabase.table("assets").select("*").eq(
            "id", asset_id
        ).eq("portfolio_id", portfolio_id).execute()

        if not asset_response.data:
            raise ResourceNotFoundException("Asset", asset_id)

        # Get versions
        versions_response = supabase.table("asset_versions").select("*").eq(
            "asset_id", asset_id
        ).order("version_number", desc=True).execute()

        versions = versions_response.data or []

        return AssetVersionListResponse(
            asset_id=asset_id,
            versions=versions,
            total_versions=len(versions),
        )

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== RESTORE VERSION ====================

@router.post("/{portfolio_id}/assets/{asset_id}/versions/{version_num}/restore")
async def restore_asset_version(
    portfolio_id: str,
    asset_id: str,
    version_num: int,
    current_user: dict = Depends(get_current_user)
):
    """Restore asset to previous version"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        # Get asset
        asset_response = supabase.table("assets").select("*").eq(
            "id", asset_id
        ).eq("portfolio_id", portfolio_id).execute()

        if not asset_response.data:
            raise ResourceNotFoundException("Asset", asset_id)

        # Get version
        version_response = supabase.table("asset_versions").select("*").eq(
            "asset_id", asset_id
        ).eq("version_number", version_num).execute()

        if not version_response.data:
            raise ResourceNotFoundException("Asset version", f"{asset_id}:v{version_num}")

        version = version_response.data[0]

        # Update asset with version data
        update_data = {
            "storage_path": version["file_path"],
            "thumb_path": version["thumb_path"],
            "preview_path": version["preview_path"],
            "width": version["width"],
            "height": version["height"],
            "file_size": version["file_size"],
            "version": version_num,
            "updated_at": datetime.utcnow().isoformat(),
        }

        update_response = supabase.table("assets").update(update_data).eq(
            "id", asset_id
        ).execute()

        if not update_response.data:
            raise DatabaseException("Failed to restore version")

        return {
            "asset_id": asset_id,
            "restored_to_version": version_num,
            "message": f"Asset restored to version {version_num}",
        }

    except (ResourceNotFoundException, AuthorizationException, DatabaseException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== UPLOAD PROGRESS ====================

@router.get("/{portfolio_id}/assets/upload/{upload_id}/progress")
async def get_upload_progress(
    portfolio_id: str,
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get upload progress"""
    try:
        # Verify ownership - check both portfolios AND projects tables
        # (frontend uses project_id, but legacy code looks in portfolios)
        owner_id = None
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if portfolio.data:
            owner_id = portfolio.data[0]["user_id"]
        else:
            # Try projects table (frontend uses project_id here)
            project = supabase.table("projects").select("*").eq("id", portfolio_id).execute()
            if project.data:
                owner_id = project.data[0]["user_id"]
            else:
                raise ResourceNotFoundException("Project", portfolio_id)

        if owner_id != current_user["user_id"]:
            raise AuthorizationException()

        upload_manager = get_upload_manager()
        progress = upload_manager.get_upload_progress(upload_id)

        if not progress:
            raise ResourceNotFoundException("Upload", upload_id)

        return progress

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
