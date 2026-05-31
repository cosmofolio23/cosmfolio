"""
Rate Limiting Middleware
Phase 7: Task 7.3 - Prevent abuse with request throttling per user/IP
"""

import logging
import time
from typing import Dict, Optional, Tuple
from functools import wraps
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Rate limit configuration"""

    # Default limits (requests per minute)
    DEFAULT_LIMIT = 60

    # Service-specific limits
    LIMITS = {
        # Auth endpoints
        "/api/auth/login": 5,
        "/api/auth/signup": 3,
        "/api/auth/reset": 3,

        # Portfolio endpoints
        "/api/portfolios": 30,  # List
        "/api/portfolios/create": 10,
        "/api/portfolios/*/delete": 10,

        # Export/publish endpoints
        "/api/portfolios/*/export-pdf": 10,
        "/api/portfolios/*/export-html": 10,
        "/api/portfolios/*/publish": 10,
        "/api/portfolios/*/download": 10,

        # Share/analytics endpoints
        "/api/portfolios/*/share": 20,
        "/api/portfolios/*/analytics": 30,

        # Social media
        "/api/portfolios/*/social-preview": 20,

        # AI generation
        "/api/ai/generate": 5,  # Most restrictive for AI
    }

    # Burst limits (max requests in window)
    BURST_LIMITS = {
        "/api/auth/login": (5, 60),      # 5 requests per 60 seconds
        "/api/ai/generate": (3, 300),    # 3 requests per 5 minutes
    }


class RateLimiter:
    """In-memory rate limiter with sliding window"""

    def __init__(self):
        # Track requests: key -> [(timestamp, 1), ...]
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 300  # Cleanup every 5 minutes
        self.last_cleanup = time.time()

    def is_allowed(
        self,
        key: str,
        limit: int,
        window: int = 60,
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request is allowed

        Args:
            key: Unique identifier (user_id:path or ip:path)
            limit: Max requests allowed
            window: Time window in seconds

        Returns:
            (allowed, info) tuple
        """

        now = time.time()

        # Cleanup old entries periodically
        if now - self.last_cleanup > self.cleanup_interval:
            self._cleanup(now)
            self.last_cleanup = now

        # Get request history for this key
        request_times = self.requests[key]

        # Remove old requests outside window
        cutoff = now - window
        request_times[:] = [t for t in request_times if t > cutoff]

        # Count recent requests
        request_count = len(request_times)

        # Check if limit exceeded
        allowed = request_count < limit

        if allowed:
            request_times.append(now)
            remaining = limit - request_count - 1
        else:
            remaining = 0

        # Calculate retry_after
        if request_times:
            oldest = request_times[0]
            retry_after = int(window - (now - oldest)) + 1
        else:
            retry_after = 0

        return allowed, {
            "limit": limit,
            "remaining": max(0, remaining),
            "reset": int(now + window),
            "retry_after": retry_after,
        }

    def _cleanup(self, now: float, max_age: int = 3600):
        """Remove old entries to prevent memory bloat"""

        cutoff = now - max_age

        # Remove empty and old entries
        keys_to_delete = []
        for key, times in self.requests.items():
            times[:] = [t for t in times if t > cutoff]
            if not times:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            del self.requests[key]

        logger.debug(f"Rate limiter cleanup: removed {len(keys_to_delete)} keys")


# Global rate limiter instance
_rate_limiter = None

def get_rate_limiter() -> RateLimiter:
    """Get or create rate limiter singleton"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests"""

    async def dispatch(self, request: Request, call_next):
        """Check rate limits before processing request"""

        # Skip rate limiting for certain paths
        if request.url.path.startswith("/health"):
            return await call_next(request)

        # Get client identifier
        client_ip = request.client.host if request.client else "unknown"
        user_id = request.headers.get("X-User-ID", "anonymous")

        # Create rate limit key
        # Prefer user_id if authenticated, fall back to IP
        if user_id != "anonymous":
            rate_key = f"user:{user_id}:{request.url.path}"
        else:
            rate_key = f"ip:{client_ip}:{request.url.path}"

        # Get rate limit for this endpoint
        limit = self._get_limit(request.url.path)

        # Check rate limit
        rate_limiter = get_rate_limiter()
        allowed, info = rate_limiter.is_allowed(rate_key, limit)

        if not allowed:
            logger.warning(
                f"Rate limit exceeded: {rate_key} (limit: {limit}/min)"
            )

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "retry_after": info["retry_after"],
                },
                headers={
                    "Retry-After": str(info["retry_after"]),
                    "X-RateLimit-Limit": str(info["limit"]),
                    "X-RateLimit-Remaining": str(info["remaining"]),
                    "X-RateLimit-Reset": str(info["reset"]),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset"])

        return response

    def _get_limit(self, path: str) -> int:
        """Get rate limit for endpoint"""

        # Exact match
        if path in RateLimitConfig.LIMITS:
            return RateLimitConfig.LIMITS[path]

        # Wildcard match
        for pattern, limit in RateLimitConfig.LIMITS.items():
            if "*" in pattern:
                # Simple wildcard matching
                pattern_parts = pattern.split("*")
                if all(part in path for part in pattern_parts):
                    return limit

        # Default limit
        return RateLimitConfig.DEFAULT_LIMIT


def rate_limit(limit: int = 60, window: int = 60):
    """
    Decorator for per-endpoint rate limiting

    Usage:
        @rate_limit(limit=10, window=60)
        async def expensive_operation(request):
            ...
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request from args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                return await func(*args, **kwargs)

            # Check rate limit
            client_ip = request.client.host if request.client else "unknown"
            rate_key = f"func:{func.__name__}:{client_ip}"

            rate_limiter = get_rate_limiter()
            allowed, info = rate_limiter.is_allowed(rate_key, limit, window)

            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded",
                    headers={
                        "Retry-After": str(info["retry_after"]),
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


class RequestBudget:
    """Track request budget for expensive operations"""

    def __init__(self, user_id: str, budget: Dict[str, int]):
        """
        Initialize budget

        Args:
            user_id: User identifier
            budget: Dict of operation -> remaining quota
        """

        self.user_id = user_id
        self.budget = budget
        self.last_reset = datetime.utcnow()

    def use(self, operation: str, amount: int = 1) -> bool:
        """
        Use budget

        Args:
            operation: Operation name
            amount: Amount to deduct

        Returns:
            Whether budget is available
        """

        if operation not in self.budget:
            return True  # No limit

        if self.budget[operation] >= amount:
            self.budget[operation] -= amount
            return True

        return False

    def get_remaining(self, operation: str) -> int:
        """Get remaining budget for operation"""
        return self.budget.get(operation, 0)

    def reset(self):
        """Reset budget"""
        for key in self.budget:
            self.budget[key] = 100  # Reset to 100

        self.last_reset = datetime.utcnow()


# Budget tracking
_user_budgets: Dict[str, RequestBudget] = {}

def get_user_budget(user_id: str) -> RequestBudget:
    """Get or create user budget"""

    if user_id not in _user_budgets:
        _user_budgets[user_id] = RequestBudget(
            user_id=user_id,
            budget={
                "generate_portfolio": 100,    # AI generation
                "export_pdf": 100,            # PDF exports
                "export_html": 100,           # HTML exports
                "export_zip": 50,             # ZIP archives (costly)
                "ai_rewrite": 50,             # AI content rewrite
            },
        )

    return _user_budgets[user_id]


def check_budget(user_id: str, operation: str) -> Tuple[bool, str]:
    """
    Check if user has budget for operation

    Returns:
        (allowed, message)
    """

    budget = get_user_budget(user_id)

    if budget.use(operation):
        remaining = budget.get_remaining(operation)
        return True, f"Remaining: {remaining}"

    remaining = budget.get_remaining(operation)
    return False, f"Budget exceeded. Remaining: {remaining}. Resets daily."
