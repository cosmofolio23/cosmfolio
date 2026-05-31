"""
Cache Headers Middleware
Phase 7: Task 7.1 - Implement Cache-Control headers for optimal browser caching
"""

import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheHeaderMiddleware(BaseHTTPMiddleware):
    """Middleware to set appropriate Cache-Control headers"""

    # Cache durations (in seconds)
    CACHE_DURATIONS = {
        # Static assets - long cache
        "css": 86400 * 365,      # 1 year
        "js": 86400 * 365,       # 1 year
        "font": 86400 * 365,     # 1 year
        "image": 86400 * 30,     # 30 days

        # API responses - shorter cache
        "api_public": 300,        # 5 minutes
        "api_auth": 60,           # 1 minute
        "api_user": 0,            # No cache

        # HTML pages
        "html": 3600,             # 1 hour
    }

    async def dispatch(self, request: Request, call_next) -> Response:
        """Add cache headers to response"""

        response = await call_next(request)

        # Determine cache duration based on path
        cache_duration = self._get_cache_duration(request.url.path)

        if cache_duration > 0:
            # Set cache headers
            response.headers["Cache-Control"] = f"public, max-age={cache_duration}, immutable"

            # Set Expires header
            expires = datetime.utcnow() + timedelta(seconds=cache_duration)
            response.headers["Expires"] = expires.strftime("%a, %d %b %Y %H:%M:%S GMT")

            logger.debug(f"Cache headers set: {request.url.path} ({cache_duration}s)")
        else:
            # No cache
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response

    def _get_cache_duration(self, path: str) -> int:
        """Determine cache duration based on path"""

        # Static assets
        if any(path.endswith(ext) for ext in ['.css', '.scss']):
            return self.CACHE_DURATIONS["css"]
        if any(path.endswith(ext) for ext in ['.js']):
            return self.CACHE_DURATIONS["js"]
        if any(path.endswith(ext) for ext in ['.woff', '.woff2', '.ttf']):
            return self.CACHE_DURATIONS["font"]
        if any(path.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.svg', '.gif']):
            return self.CACHE_DURATIONS["image"]

        # API endpoints
        if path.startswith("/api"):
            if path.startswith("/api/public"):
                return self.CACHE_DURATIONS["api_public"]
            if path.startswith("/public"):
                return self.CACHE_DURATIONS["api_public"]
            # Auth required endpoints - no cache
            return self.CACHE_DURATIONS["api_user"]

        # HTML pages
        if path.endswith(".html") or path == "/":
            return self.CACHE_DURATIONS["html"]

        # Default: no cache
        return 0


class CDNHeaders:
    """CDN configuration and optimization headers"""

    @staticmethod
    def get_cloudflare_config():
        """Get Cloudflare CDN configuration"""

        return {
            "zone_id": "${CLOUDFLARE_ZONE_ID}",
            "api_token": "${CLOUDFLARE_API_TOKEN}",
            "cache_rules": [
                {
                    "pattern": "*.jpg",
                    "cache_ttl": 86400 * 30,
                    "optimization": "image",
                },
                {
                    "pattern": "*.png",
                    "cache_ttl": 86400 * 30,
                    "optimization": "image",
                },
                {
                    "pattern": "*.css",
                    "cache_ttl": 86400 * 365,
                    "optimization": "minify",
                },
                {
                    "pattern": "*.js",
                    "cache_ttl": 86400 * 365,
                    "optimization": "minify",
                },
                {
                    "pattern": "/api/*",
                    "cache_ttl": 300,
                    "optimization": "gzip",
                },
            ],
            "image_optimization": {
                "enabled": True,
                "quality": 80,
                "formats": ["auto", "avif", "webp"],
                "resize": {
                    "thumbnail": "200x200",
                    "preview": "800x600",
                    "full": "2560x1920",
                },
            },
            "compression": {
                "gzip": True,
                "brotli": True,
            },
        }

    @staticmethod
    def get_cdn_headers():
        """Get CDN optimization headers"""

        return {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
            "Access-Control-Max-Age": "86400",
            "Vary": "Accept-Encoding, Accept",
            "ETag": True,  # Enable entity tags for cache validation
        }
