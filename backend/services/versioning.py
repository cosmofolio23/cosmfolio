"""
Asset versioning service
Phase 2: Task 2.7 - Version history management and restoration
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import uuid4

from database import supabase
from error_handlers import ResourceNotFoundException, DatabaseException

logger = logging.getLogger(__name__)

# ==================== VERSIONING SERVICE ====================

class AssetVersioningService:
    """Manage asset versions, history, and restoration"""

    def __init__(self):
        """Initialize versioning service"""
        self.supabase = supabase

    # ==================== VERSION CREATION ====================

    async def create_version(
        self,
        asset_id: str,
        portfolio_id: str,
        storage_path: str,
        file_size: int,
        mime_type: str,
        version_notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new version of an asset

        Returns: {version_num, asset_id, storage_path, created_at}
        """
        try:
            # Get current version number
            versions = self.supabase.table("asset_versions").select(
                "version_num"
            ).eq("asset_id", asset_id).order(
                "version_num", desc=True
            ).limit(1).execute()

            next_version = 1 if not versions.data else versions.data[0]["version_num"] + 1

            # Create version record
            version_data = {
                "id": str(uuid4()),
                "asset_id": asset_id,
                "portfolio_id": portfolio_id,
                "version_num": next_version,
                "storage_path": storage_path,
                "file_size": file_size,
                "mime_type": mime_type,
                "version_notes": version_notes,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("asset_versions").insert(version_data).execute()

            if not result.data:
                raise DatabaseException("Failed to create asset version")

            logger.info(f"Created version {next_version} for asset {asset_id}")

            return {
                "version_num": next_version,
                "asset_id": asset_id,
                "storage_path": storage_path,
                "created_at": version_data["created_at"],
            }

        except Exception as e:
            logger.error(f"Error creating version: {str(e)}")
            raise

    # ==================== VERSION RETRIEVAL ====================

    async def get_version(
        self,
        asset_id: str,
        version_num: int
    ) -> Dict[str, Any]:
        """Get specific version details"""
        try:
            result = self.supabase.table("asset_versions").select("*").eq(
                "asset_id", asset_id
            ).eq("version_num", version_num).execute()

            if not result.data:
                raise ResourceNotFoundException("AssetVersion", f"{asset_id}:v{version_num}")

            return result.data[0]

        except Exception as e:
            logger.error(f"Error getting version: {str(e)}")
            raise

    async def get_version_history(
        self,
        asset_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get version history for an asset

        Returns: {versions, total_count, limit, offset}
        """
        try:
            # Get total count
            count_result = self.supabase.table("asset_versions").select(
                "id", count="exact"
            ).eq("asset_id", asset_id).execute()

            total_count = count_result.count or 0

            # Get versions
            result = self.supabase.table("asset_versions").select("*").eq(
                "asset_id", asset_id
            ).order("version_num", desc=True).range(
                offset, offset + limit - 1
            ).execute()

            versions = result.data or []

            return {
                "versions": [
                    {
                        "version_num": v["version_num"],
                        "file_size": v.get("file_size"),
                        "mime_type": v.get("mime_type"),
                        "version_notes": v.get("version_notes"),
                        "created_at": v.get("created_at"),
                        "storage_path": v.get("storage_path"),
                    }
                    for v in versions
                ],
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
            }

        except Exception as e:
            logger.error(f"Error getting version history: {str(e)}")
            raise

    # ==================== VERSION COMPARISON ====================

    async def compare_versions(
        self,
        asset_id: str,
        version_a: int,
        version_b: int
    ) -> Dict[str, Any]:
        """
        Compare two versions

        Returns: {version_a, version_b, differences}
        """
        try:
            version_a_data = await self.get_version(asset_id, version_a)
            version_b_data = await self.get_version(asset_id, version_b)

            differences = {
                "file_size": {
                    "a": version_a_data.get("file_size"),
                    "b": version_b_data.get("file_size"),
                    "changed": version_a_data.get("file_size") != version_b_data.get("file_size"),
                },
                "mime_type": {
                    "a": version_a_data.get("mime_type"),
                    "b": version_b_data.get("mime_type"),
                    "changed": version_a_data.get("mime_type") != version_b_data.get("mime_type"),
                },
                "storage_path": {
                    "a": version_a_data.get("storage_path"),
                    "b": version_b_data.get("storage_path"),
                    "changed": version_a_data.get("storage_path") != version_b_data.get("storage_path"),
                },
            }

            return {
                "asset_id": asset_id,
                "version_a": version_a,
                "version_b": version_b,
                "differences": differences,
            }

        except Exception as e:
            logger.error(f"Error comparing versions: {str(e)}")
            raise

    # ==================== VERSION RESTORATION ====================

    async def restore_version(
        self,
        asset_id: str,
        portfolio_id: str,
        version_num: int,
        restore_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Restore asset to previous version

        Creates new version record with restoration notes
        """
        try:
            # Get version to restore
            version = await self.get_version(asset_id, version_num)

            # Get current asset
            asset_result = self.supabase.table("assets").select("*").eq(
                "id", asset_id
            ).eq("portfolio_id", portfolio_id).execute()

            if not asset_result.data:
                raise ResourceNotFoundException("Asset", asset_id)

            current_asset = asset_result.data[0]

            # Create new version with restored content
            notes = restore_notes or f"Restored from version {version_num}"

            new_version = await self.create_version(
                asset_id,
                portfolio_id,
                version["storage_path"],
                version.get("file_size"),
                version.get("mime_type"),
                version_notes=notes,
                metadata={
                    "restored_from": version_num,
                    "restoration_date": datetime.utcnow().isoformat(),
                    "previous_path": current_asset.get("storage_path"),
                }
            )

            # Update asset to point to restored version
            update_data = {
                "storage_path": version["storage_path"],
                "file_size": version.get("file_size"),
                "mime_type": version.get("mime_type"),
                "updated_at": datetime.utcnow().isoformat(),
            }

            update_result = self.supabase.table("assets").update(
                update_data
            ).eq("id", asset_id).execute()

            if not update_result.data:
                raise DatabaseException("Failed to restore asset")

            logger.info(f"Restored asset {asset_id} to version {version_num}")

            return {
                "asset_id": asset_id,
                "restored_to_version": version_num,
                "new_version_num": new_version["version_num"],
                "restored_at": new_version["created_at"],
            }

        except Exception as e:
            logger.error(f"Error restoring version: {str(e)}")
            raise

    # ==================== VERSION CLEANUP ====================

    async def clean_old_versions(
        self,
        asset_id: str,
        keep_count: int = 10
    ) -> Dict[str, Any]:
        """
        Clean up old versions, keeping only recent ones

        Returns: {deleted_count, kept_count}
        """
        try:
            # Get all versions sorted by version_num
            versions = self.supabase.table("asset_versions").select("id, version_num").eq(
                "asset_id", asset_id
            ).order("version_num", desc=True).execute()

            if not versions.data:
                return {"deleted_count": 0, "kept_count": 0}

            # Get versions to delete (older than keep_count)
            to_delete = versions.data[keep_count:] if len(versions.data) > keep_count else []

            deleted_count = 0
            for version in to_delete:
                try:
                    self.supabase.table("asset_versions").delete().eq(
                        "id", version["id"]
                    ).execute()
                    deleted_count += 1
                except Exception as e:
                    logger.warning(f"Failed to delete version {version['version_num']}: {str(e)}")

            logger.info(f"Cleaned {deleted_count} old versions for asset {asset_id}")

            return {
                "deleted_count": deleted_count,
                "kept_count": len(versions.data) - deleted_count,
            }

        except Exception as e:
            logger.error(f"Error cleaning versions: {str(e)}")
            raise

    # ==================== BATCH OPERATIONS ====================

    async def get_portfolio_version_stats(
        self,
        portfolio_id: str
    ) -> Dict[str, Any]:
        """
        Get versioning statistics for portfolio

        Returns: {total_assets, total_versions, avg_versions_per_asset}
        """
        try:
            # Get all assets in portfolio
            assets_result = self.supabase.table("assets").select(
                "id"
            ).eq("portfolio_id", portfolio_id).execute()

            asset_ids = [a["id"] for a in assets_result.data or []]

            if not asset_ids:
                return {
                    "total_assets": 0,
                    "total_versions": 0,
                    "avg_versions_per_asset": 0,
                }

            # Get version counts
            versions_result = self.supabase.table("asset_versions").select(
                "asset_id", count="exact"
            ).in_("asset_id", asset_ids).execute()

            total_versions = versions_result.count or 0

            return {
                "total_assets": len(asset_ids),
                "total_versions": total_versions,
                "avg_versions_per_asset": round(total_versions / len(asset_ids), 2),
            }

        except Exception as e:
            logger.error(f"Error getting version stats: {str(e)}")
            raise

    # ==================== DELETION HANDLING ====================

    async def handle_asset_deletion(
        self,
        asset_id: str
    ) -> Dict[str, Any]:
        """
        Handle versioning when asset is deleted

        Archives versions and marks for cleanup
        """
        try:
            # Get all versions
            versions = self.supabase.table("asset_versions").select("*").eq(
                "asset_id", asset_id
            ).execute()

            version_count = len(versions.data or [])

            # Mark versions as archived
            if version_count > 0:
                self.supabase.table("asset_versions").update({
                    "archived_at": datetime.utcnow().isoformat()
                }).eq("asset_id", asset_id).is_("archived_at", "null").execute()

            logger.info(f"Archived {version_count} versions for deleted asset {asset_id}")

            return {
                "asset_id": asset_id,
                "archived_versions": version_count,
            }

        except Exception as e:
            logger.error(f"Error handling asset deletion: {str(e)}")
            raise


# ==================== SINGLETON INSTANCE ====================

_versioning_service = None

def get_versioning_service() -> AssetVersioningService:
    """Get or create versioning service singleton"""
    global _versioning_service
    if _versioning_service is None:
        _versioning_service = AssetVersioningService()
    return _versioning_service
