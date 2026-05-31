"""
Security Middleware
Phase 7: Task 7.3 - CSRF protection, input validation, XSS prevention
"""

import logging
import secrets
import re
import html
from typing import Dict, Optional, Any
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import bleach

logger = logging.getLogger(__name__)


class CSRFProtection:
    """CSRF token generation and validation"""

    TOKEN_LENGTH = 32
    TOKEN_HEADER = "X-CSRF-Token"
    TOKEN_COOKIE = "csrf_token"

    @staticmethod
    def generate_token() -> str:
        """Generate CSRF token"""
        return secrets.token_urlsafe(CSRFProtection.TOKEN_LENGTH)

    @staticmethod
    def validate_token(request: Request, token: str) -> bool:
        """
        Validate CSRF token

        Token can come from:
        - Request header
        - Request body
        - Cookie
        """

        if not token:
            return False

        # Get stored token from session/cookie
        stored_token = request.cookies.get(CSRFProtection.TOKEN_COOKIE)

        if not stored_token:
            return False

        # Constant-time comparison to prevent timing attacks
        return secrets.compare_digest(token, stored_token)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware for CSRF protection"""

    # Methods that require CSRF protection
    PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    # Paths that don't require CSRF (e.g., public endpoints)
    EXCLUDED_PATHS = {
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/reset",
        "/public/",
        "/health",
    }

    async def dispatch(self, request: Request, call_next):
        """Check CSRF token for state-changing requests"""

        # Skip CSRF check for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)

        # Only check for state-changing methods
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)

        # Get CSRF token from request
        csrf_token = request.headers.get(CSRFProtection.TOKEN_HEADER)

        if not csrf_token:
            # Try to get from body (for forms)
            if request.method in {"POST", "PUT", "PATCH"}:
                try:
                    body = await request.body()
                    if request.headers.get("content-type") == "application/json":
                        import json
                        data = json.loads(body)
                        csrf_token = data.get("csrf_token")
                except:
                    pass

        # Validate CSRF token
        if not CSRFProtection.validate_token(request, csrf_token):
            logger.warning(f"CSRF validation failed for {request.url.path}")

            return JSONResponse(
                status_code=403,
                content={"error": "CSRF token validation failed"},
            )

        # Generate new CSRF token for response
        new_token = CSRFProtection.generate_token()

        response = await call_next(request)

        # Set CSRF token in cookie and header
        response.set_cookie(
            CSRFProtection.TOKEN_COOKIE,
            new_token,
            httponly=True,
            secure=True,  # HTTPS only
            samesite="Strict",
            max_age=3600,
        )
        response.headers[CSRFProtection.TOKEN_HEADER] = new_token

        return response


class InputValidator:
    """Input validation and sanitization"""

    # HTML tags allowed (for rich text)
    ALLOWED_TAGS = {
        "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li", "blockquote", "a", "img", "code", "pre",
    }

    # HTML attributes allowed
    ALLOWED_ATTRIBUTES = {
        "a": ["href", "title"],
        "img": ["src", "alt", "width", "height"],
    }

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email)) and len(email) <= 254

    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format"""
        pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*$'
        return bool(re.match(pattern, url)) and len(url) <= 2048

    @staticmethod
    def validate_slug(slug: str) -> bool:
        """Validate URL slug (alphanumeric, hyphens, underscores)"""
        pattern = r'^[a-zA-Z0-9_-]{3,50}$'
        return bool(re.match(pattern, slug))

    @staticmethod
    def sanitize_html(html_content: str, allow_tags: bool = False) -> str:
        """
        Sanitize HTML to prevent XSS

        Args:
            html_content: HTML to sanitize
            allow_tags: Whether to allow specific HTML tags

        Returns:
            Sanitized HTML
        """

        if allow_tags:
            return bleach.clean(
                html_content,
                tags=InputValidator.ALLOWED_TAGS,
                attributes=InputValidator.ALLOWED_ATTRIBUTES,
                strip=True,
            )
        else:
            # Strip all HTML
            return bleach.clean(html_content, tags=[], strip=True)

    @staticmethod
    def sanitize_string(text: str, max_length: int = 500) -> str:
        """
        Sanitize plain text

        - Remove leading/trailing whitespace
        - Limit length
        - Escape HTML entities
        """

        text = text.strip()
        text = text[:max_length]
        text = html.escape(text)

        return text

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal

        Removes: .., /, \, null bytes, control characters
        """

        # Remove path separators and traversal attempts
        filename = filename.replace("..", "")
        filename = filename.replace("/", "")
        filename = filename.replace("\\", "")

        # Remove null bytes
        filename = filename.replace("\x00", "")

        # Remove control characters
        filename = "".join(char for char in filename if ord(char) >= 32)

        # Limit length
        filename = filename[:255]

        return filename if filename else "file"

    @staticmethod
    def validate_json(data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """
        Validate JSON against schema

        Simple validation - in production use jsonschema library
        """

        for key, expected_type in schema.items():
            if key not in data:
                return False

            if not isinstance(data[key], expected_type):
                return False

        return True


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        """Add security headers"""

        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Feature policy / Permissions policy
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Content Security Policy (strict)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' api.cosmofolio.com; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp

        # HSTS (HTTP Strict Transport Security)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class AuditLogger:
    """Log sensitive security events"""

    @staticmethod
    def log_auth_attempt(
        user_id: str,
        email: str,
        success: bool,
        ip_address: str,
        user_agent: str,
    ):
        """Log authentication attempt"""

        status = "SUCCESS" if success else "FAILED"
        logger.warning(
            f"[AUDIT] Auth attempt: {status} | User: {user_id} ({email}) | IP: {ip_address}"
        )

    @staticmethod
    def log_permission_denied(
        user_id: str,
        action: str,
        resource_id: str,
        ip_address: str,
    ):
        """Log permission denied"""

        logger.warning(
            f"[AUDIT] Permission denied: User {user_id} attempted {action} on {resource_id} from {ip_address}"
        )

    @staticmethod
    def log_sensitive_operation(
        user_id: str,
        operation: str,
        details: Dict[str, Any],
        ip_address: str,
    ):
        """Log sensitive operations"""

        logger.warning(
            f"[AUDIT] Sensitive operation: User {user_id} performed {operation} | Details: {details} | IP: {ip_address}"
        )

    @staticmethod
    def log_suspicious_activity(
        description: str,
        user_id: Optional[str],
        ip_address: str,
        details: Dict[str, Any],
    ):
        """Log suspicious activity"""

        logger.critical(
            f"[SECURITY] Suspicious activity: {description} | User: {user_id} | IP: {ip_address} | Details: {details}"
        )


class RateLimitBypassDetection:
    """Detect attempts to bypass rate limiting"""

    def __init__(self):
        self.suspicious_ips = set()
        self.suspicious_users = set()

    def check_suspicious(self, ip_address: str, user_id: str) -> bool:
        """Check if IP or user is suspicious"""
        return ip_address in self.suspicious_ips or user_id in self.suspicious_users

    def mark_suspicious(
        self,
        ip_address: str,
        user_id: str,
        reason: str,
    ):
        """Mark IP or user as suspicious"""

        self.suspicious_ips.add(ip_address)
        self.suspicious_users.add(user_id)

        AuditLogger.log_suspicious_activity(
            description=f"Rate limit bypass detection: {reason}",
            user_id=user_id,
            ip_address=ip_address,
            details={"reason": reason},
        )
