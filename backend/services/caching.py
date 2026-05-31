"""
Asset caching and CDN service
Phase 2: Task 2.9 - Cache optimization and CDN integration
"""

import logging
import hashlib
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

# ==================== CACHE CONFIGURATION ====================

class CacheConfig:
    """Cache configuration and strategy"""

    # Cache control headers per asset type
    CACHE_STRATEGIES = {
        "image": {
            "max_age": 31536000,  # 1 year
            "immutable": True,
            "public": True,
        },
        "video": {
            "max_age": 31536000,
            "immutable": True,
            "public": True,
        },
        "document": {
            "max_age": 604800,  # 7 days
            "immutable": False,
            "public": True,
        },
        "thumbnail": {
            "max_age": 2592000,  # 30 days
            "immutable": False,
            "public": True,
        },
        "preview": {
            "max_age": 86400,  # 1 day
            "immutable": False,
            "public": True,
        },
    }

    # Cache headers for different endpoints
    ENDPOINT_CACHE = {
        "assets": 300,  # 5 minutes
        "search": 60,   # 1 minute
        "previews": 3600,  # 1 hour
        "metadata": 3600,   # 1 hour
    }

    # Stale-while-revalidate (allows serving stale content while refreshing)
    STALE_WHILE_REVALIDATE = 604800  # 7 days

    # ETag generation strategy
    ETAG_VERSION = "v1"


# ==================== CACHING SERVICE ====================

class AssetCachingService:
    """Manage asset caching and CDN integration"""

    def __init__(self):
        """Initialize caching service"""
        self.config = CacheConfig()
        self.etag_cache: Dict[str, str] = {}

    # ==================== CACHE HEADERS ====================

    def get_cache_headers(
        self,
        asset_type: str,
        asset_id: str,
        version: Optional[int] = None,
        etag: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Get appropriate cache headers for asset

        Returns: {Cache-Control, ETag, Vary, CDN-Cache-Control}
        """
        strategy = self.config.CACHE_STRATEGIES.get(
            asset_type,
            self.config.CACHE_STRATEGIES["image"]
        )

        # Build Cache-Control header
        cache_control_parts = []
        if strategy["public"]:
            cache_control_parts.append("public")
        else:
            cache_control_parts.append("private")

        cache_control_parts.append(f"max-age={strategy['max_age']}")

        if strategy["immutable"]:
            cache_control_parts.append("immutable")
        else:
            cache_control_parts.append(f"stale-while-revalidate={self.config.STALE_WHILE_REVALIDATE}")

        cache_control = ", ".join(cache_control_parts)

        # Generate ETag if not provided
        if not etag:
            etag = self._generate_etag(asset_id, version)

        headers = {
            "Cache-Control": cache_control,
            "ETag": etag,
            "Vary": "Accept-Encoding, Accept",  # Cache separately for different encodings
            "X-Content-Type-Options": "nosniff",
        }

        # Add CDN-specific headers if immutable
        if strategy["immutable"]:
            headers["CDN-Cache-Control"] = f"max-age={strategy['max_age']}, immutable"

        return headers

    def get_browser_cache_headers(
        self,
        max_age_seconds: int = 3600
    ) -> Dict[str, str]:
        """Get cache headers optimized for browser caching"""
        return {
            "Cache-Control": f"public, max-age={max_age_seconds}, stale-while-revalidate={self.config.STALE_WHILE_REVALIDATE}",
            "Vary": "Accept-Encoding, Accept",
            "X-Content-Type-Options": "nosniff",
        }

    def get_cdn_cache_headers(
        self,
        asset_type: str,
        cache_duration: Optional[int] = None
    ) -> Dict[str, str]:
        """
        Get CDN-specific cache headers

        For use with CDN providers (Cloudflare, CloudFront, etc.)
        """
        if cache_duration is None:
            cache_duration = self.config.CACHE_STRATEGIES.get(
                asset_type,
                {}
            ).get("max_age", 3600)

        headers = {
            "CDN-Cache-Control": f"max-age={cache_duration}",
            "Cache-Key": "default",  # CDN caching key
            "Cache-Tag": f"asset-type-{asset_type}",
        }

        return headers

    # ==================== ETAG GENERATION ====================

    def _generate_etag(
        self,
        asset_id: str,
        version: Optional[int] = None
    ) -> str:
        """
        Generate ETag for asset

        Format: "version-asset_id-hash"
        """
        etag_key = f"{asset_id}:v{version or 1}"

        if etag_key in self.etag_cache:
            return self.etag_cache[etag_key]

        # Create hash from asset info
        hash_input = f"{asset_id}:{version or 1}:{self.config.ETAG_VERSION}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        etag = f'W/"{hash_value}"'

        self.etag_cache[etag_key] = etag
        return etag

    def validate_etag(
        self,
        etag: str,
        asset_id: str,
        version: Optional[int] = None
    ) -> bool:
        """Check if ETag is still valid"""
        expected_etag = self._generate_etag(asset_id, version)
        return etag == expected_etag

    # ==================== CACHE INVALIDATION ====================

    def get_cache_invalidation_tags(
        self,
        asset_id: str,
        portfolio_id: str
    ) -> list:
        """
        Get tags for cache invalidation

        Useful for CDN cache purging
        """
        return [
            f"asset:{asset_id}",
            f"portfolio:{portfolio_id}",
            f"asset-type:image",  # Cache by type
            f"user-content",  # General user content
        ]

    def create_cache_invalidation_payload(
        self,
        asset_ids: list,
        portfolio_id: str
    ) -> Dict[str, Any]:
        """
        Create payload for CDN cache invalidation

        Can be used with Cloudflare, CloudFront, etc.
        """
        tags = set()
        for asset_id in asset_ids:
            tags.update(self.get_cache_invalidation_tags(asset_id, portfolio_id))

        return {
            "tags": list(tags),
            "asset_ids": asset_ids,
            "portfolio_id": portfolio_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # ==================== COMPRESSION OPTIMIZATION ====================

    def get_compression_headers(
        self,
        content_type: str
    ) -> Dict[str, str]:
        """
        Get headers for compression optimization

        Returns: {Content-Encoding, Vary, ...}
        """
        compressible_types = [
            "text/",
            "application/json",
            "application/xml",
            "image/svg+xml",
        ]

        is_compressible = any(
            content_type.startswith(t) for t in compressible_types
        )

        headers = {
            "Vary": "Accept-Encoding",
        }

        if is_compressible:
            headers["Content-Encoding"] = "gzip"

        return headers

    # ==================== PRELOAD OPTIMIZATION ====================

    def get_preload_headers(
        self,
        asset_ids: list,
        base_url: str
    ) -> Dict[str, str]:
        """
        Get Link headers for resource preloading

        Improves page load performance
        """
        links = []

        for asset_id in asset_ids:
            # Preload thumbnail
            links.append(
                f'<{base_url}/api/assets/{asset_id}/preview?size=thumb-250>; rel=preload; as=image'
            )

        return {
            "Link": ", ".join(links) if links else "",
        }

    # ==================== CACHE WARMING ====================

    def get_cache_warming_urls(
        self,
        asset_ids: list,
        portfolio_id: str,
        base_url: str
    ) -> list:
        """
        Get URLs to warm cache for CDN

        Useful for proactively caching popular assets
        """
        urls = []

        for asset_id in asset_ids:
            # Add previews of different sizes
            sizes = ["thumb-250", "thumb-500", "preview-1200"]
            for size in sizes:
                urls.append(
                    f"{base_url}/api/portfolios/{portfolio_id}/assets/{asset_id}/preview?size={size}"
                )

        return urls

    # ==================== PERFORMANCE METRICS ====================

    def estimate_cache_savings(
        self,
        hit_count: int,
        miss_count: int,
        avg_asset_size_kb: float
    ) -> Dict[str, Any]:
        """
        Estimate bandwidth and cost savings from caching

        Returns: {hit_rate, bandwidth_saved_gb, cost_savings_estimate}
        """
        total_requests = hit_count + miss_count
        if total_requests == 0:
            return {
                "hit_rate": 0,
                "bandwidth_saved_gb": 0,
                "cost_savings_estimate": 0,
            }

        hit_rate = (hit_count / total_requests) * 100

        # Estimate bandwidth saved (in GB)
        bandwidth_saved_bytes = hit_count * (avg_asset_size_kb * 1024)
        bandwidth_saved_gb = bandwidth_saved_bytes / (1024 ** 3)

        # Rough cost estimate: $0.085 per GB for typical CDN
        cost_per_gb = 0.085
        cost_savings = bandwidth_saved_gb * cost_per_gb

        return {
            "hit_rate": round(hit_rate, 2),
            "hits": hit_count,
            "misses": miss_count,
            "total_requests": total_requests,
            "bandwidth_saved_gb": round(bandwidth_saved_gb, 2),
            "cost_savings_estimate": round(cost_savings, 2),
        }

    # ==================== CACHE ANALYSIS ====================

    def analyze_cache_effectiveness(
        self,
        cache_headers: Dict[str, str],
        content_type: str,
        file_size_kb: float
    ) -> Dict[str, Any]:
        """
        Analyze cache configuration effectiveness

        Returns: {score, recommendations, cache_duration, estimated_bandwidth}
        """
        score = 0
        recommendations = []

        # Check Cache-Control header
        if "Cache-Control" in cache_headers:
            cache_control = cache_headers["Cache-Control"]

            if "public" in cache_control:
                score += 20
            else:
                recommendations.append("Use 'public' for broadly cacheable assets")

            if "immutable" in cache_headers.get("Cache-Control", ""):
                score += 20
            elif "max-age=" in cache_control:
                score += 15
            else:
                recommendations.append("Set appropriate max-age")
        else:
            recommendations.append("Add Cache-Control header")

        # Check compression
        if "gzip" in cache_headers.get("Content-Encoding", ""):
            score += 15
        elif content_type.startswith("text/") or content_type == "application/json":
            recommendations.append("Enable gzip compression")

        # Check ETag
        if "ETag" in cache_headers:
            score += 15
        else:
            recommendations.append("Add ETag for cache validation")

        # Check Vary header
        if "Vary" in cache_headers:
            score += 10

        return {
            "cache_effectiveness_score": min(score, 100),
            "recommendations": recommendations,
            "estimated_monthly_bandwidth_gb": (file_size_kb / 1024) * 30,  # Rough estimate
        }


# ==================== SINGLETON INSTANCE ====================

_caching_service = None

def get_caching_service() -> AssetCachingService:
    """Get or create caching service singleton"""
    global _caching_service
    if _caching_service is None:
        _caching_service = AssetCachingService()
    return _caching_service
