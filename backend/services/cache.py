"""
Redis Caching Service
Phase 7: Task 7.1 - High-performance caching for PDFs, HTML, and API responses
"""

import logging
import json
import redis
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
from functools import wraps
import asyncio

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-based caching service for performance optimization"""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        default_ttl: int = 3600,  # 1 hour
    ):
        """
        Initialize Redis cache service

        Args:
            host: Redis host
            port: Redis port
            db: Database number
            password: Redis password (optional)
            default_ttl: Default time-to-live in seconds
        """

        self.default_ttl = default_ttl

        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                password=password,
                decode_responses=True,
                socket_connect_timeout=5,
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {str(e)}. Using in-memory cache.")
            self.redis_client = None
            self.memory_cache: Dict[str, tuple] = {}  # key -> (value, expiry)

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Set cache value

        Args:
            key: Cache key
            value: Value to cache (JSON serializable)
            ttl: Time-to-live in seconds

        Returns:
            Success status
        """

        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value)

            if self.redis_client:
                self.redis_client.setex(key, ttl, serialized)
            else:
                # In-memory fallback
                expiry = datetime.utcnow() + timedelta(seconds=ttl)
                self.memory_cache[key] = (value, expiry)

            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True

        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
            return False

    def get(self, key: str) -> Optional[Any]:
        """
        Get cache value

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """

        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    logger.debug(f"Cache HIT: {key}")
                    return json.loads(value)
            else:
                # In-memory fallback
                if key in self.memory_cache:
                    value, expiry = self.memory_cache[key]
                    if datetime.utcnow() < expiry:
                        logger.debug(f"Cache HIT: {key}")
                        return value
                    else:
                        del self.memory_cache[key]

            logger.debug(f"Cache MISS: {key}")
            return None

        except Exception as e:
            logger.error(f"Error getting cache: {str(e)}")
            return None

    def delete(self, key: str) -> bool:
        """Delete cache entry"""

        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)

            logger.debug(f"Cache DELETE: {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting cache: {str(e)}")
            return False

    def clear(self) -> bool:
        """Clear all cache entries"""

        try:
            if self.redis_client:
                self.redis_client.flushdb()
            else:
                self.memory_cache.clear()

            logger.info("Cache cleared")
            return True

        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False

    def cache_key(self, *args) -> str:
        """Generate cache key from arguments"""
        return ":".join(str(arg) for arg in args)

    # ==================== SPECIFIC CACHE OPERATIONS ====================

    def cache_pdf_export(
        self,
        portfolio_id: str,
        style_pack: str,
        page_size: str,
        pdf_bytes: bytes,
    ) -> bool:
        """Cache PDF export"""

        key = self.cache_key("pdf", portfolio_id, style_pack, page_size)

        try:
            # Cache binary as base64
            import base64
            pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

            return self.set(
                key,
                {"pdf_b64": pdf_b64, "generated_at": datetime.utcnow().isoformat()},
                ttl=86400,  # 24 hours
            )

        except Exception as e:
            logger.error(f"Error caching PDF: {str(e)}")
            return False

    def get_cached_pdf(
        self,
        portfolio_id: str,
        style_pack: str,
        page_size: str,
    ) -> Optional[bytes]:
        """Get cached PDF export"""

        key = self.cache_key("pdf", portfolio_id, style_pack, page_size)
        cached = self.get(key)

        if cached:
            try:
                import base64
                pdf_bytes = base64.b64decode(cached["pdf_b64"])
                logger.info(f"Using cached PDF for {portfolio_id}")
                return pdf_bytes
            except Exception as e:
                logger.error(f"Error decoding cached PDF: {str(e)}")
                return None

        return None

    def cache_html_export(
        self,
        portfolio_id: str,
        style_pack: str,
        html_content: str,
    ) -> bool:
        """Cache HTML export"""

        key = self.cache_key("html", portfolio_id, style_pack)

        return self.set(
            key,
            {"html": html_content, "generated_at": datetime.utcnow().isoformat()},
            ttl=86400,  # 24 hours
        )

    def get_cached_html(
        self,
        portfolio_id: str,
        style_pack: str,
    ) -> Optional[str]:
        """Get cached HTML export"""

        key = self.cache_key("html", portfolio_id, style_pack)
        cached = self.get(key)

        if cached:
            logger.info(f"Using cached HTML for {portfolio_id}")
            return cached["html"]

        return None

    def cache_api_response(
        self,
        endpoint: str,
        params: Dict[str, Any],
        response: Any,
        ttl: int = 300,  # 5 minutes
    ) -> bool:
        """Cache API response"""

        # Create stable key from endpoint and params
        params_str = json.dumps(params, sort_keys=True)
        key = self.cache_key("api", endpoint, hash(params_str))

        return self.set(key, response, ttl=ttl)

    def get_cached_api_response(
        self,
        endpoint: str,
        params: Dict[str, Any],
    ) -> Optional[Any]:
        """Get cached API response"""

        params_str = json.dumps(params, sort_keys=True)
        key = self.cache_key("api", endpoint, hash(params_str))

        return self.get(key)

    def cache_user_portfolio_list(
        self,
        user_id: str,
        portfolios: List[Dict],
    ) -> bool:
        """Cache user's portfolio list"""

        key = self.cache_key("user_portfolios", user_id)
        return self.set(key, portfolios, ttl=1800)  # 30 minutes

    def get_cached_user_portfolios(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached user portfolios"""

        key = self.cache_key("user_portfolios", user_id)
        return self.get(key)

    def invalidate_user_cache(self, user_id: str) -> bool:
        """Invalidate all cache for a user"""

        keys_to_delete = [
            self.cache_key("user_portfolios", user_id),
        ]

        for key in keys_to_delete:
            self.delete(key)

        return True

    def invalidate_portfolio_cache(self, portfolio_id: str) -> bool:
        """Invalidate all cache for a portfolio"""

        try:
            # Delete all cache entries for this portfolio
            if self.redis_client:
                pattern = f"*:{portfolio_id}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            else:
                # In-memory: delete matching keys
                keys_to_delete = [k for k in self.memory_cache.keys() if portfolio_id in k]
                for key in keys_to_delete:
                    del self.memory_cache[key]

            logger.info(f"Portfolio cache invalidated: {portfolio_id}")
            return True

        except Exception as e:
            logger.error(f"Error invalidating portfolio cache: {str(e)}")
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""

        try:
            if self.redis_client:
                info = self.redis_client.info()
                return {
                    "backend": "redis",
                    "used_memory_mb": info.get("used_memory", 0) / (1024 * 1024),
                    "connected_clients": info.get("connected_clients", 0),
                    "hits": info.get("keyspace_hits", 0),
                    "misses": info.get("keyspace_misses", 0),
                    "evicted_keys": info.get("evicted_keys", 0),
                }
            else:
                return {
                    "backend": "memory",
                    "entry_count": len(self.memory_cache),
                    "estimated_size_mb": sum(
                        len(str(v[0])) for v in self.memory_cache.values()
                    ) / (1024 * 1024),
                }

        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {"error": str(e)}


# ==================== SINGLETON INSTANCE ====================

_cache_service = None

def get_cache_service() -> CacheService:
    """Get or create cache service singleton"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


# ==================== CACHE DECORATOR ====================

def cache_result(ttl: int = 3600):
    """Decorator for caching function results"""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_service = get_cache_service()

            # Generate cache key
            key = cache_service.cache_key(func.__name__, str(args), str(kwargs))

            # Try to get from cache
            cached = cache_service.get(key)
            if cached is not None:
                logger.debug(f"Cache HIT: {func.__name__}")
                return cached

            # Not in cache, call function
            result = func(*args, **kwargs)

            # Store in cache
            cache_service.set(key, result, ttl=ttl)

            return result

        return wrapper

    return decorator
