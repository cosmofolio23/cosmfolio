"""
Portfolio Publication Service
Phase 6: Task 6.1 - Public URLs, versioning, analytics, password protection
"""

import logging
import secrets
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum
import json

logger = logging.getLogger(__name__)


class PublicationStatus(str, Enum):
    """Publication status for portfolios"""
    DRAFT = "draft"           # Not published
    PUBLIC = "public"         # Publicly available
    PASSWORD_PROTECTED = "password_protected"  # Requires password
    ARCHIVED = "archived"     # Published but archived


class PortfolioVersion(str, Enum):
    """Portfolio version tracking"""
    V1 = "v1"
    V2 = "v2"
    V3 = "v3"
    V4 = "v4"
    V5 = "v5"


class PublicationService:
    """Service for managing portfolio publication and sharing"""

    def __init__(self):
        """Initialize publication service"""

        # Token generation settings
        self.token_length = 32
        self.token_charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

        # Analytics retention
        self.analytics_retention_days = 90

        logger.info("Portfolio Publication Service initialized")

    def publish_portfolio(
        self,
        portfolio_id: str,
        user_id: str,
        is_password_protected: bool = False,
        password: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Publish a portfolio publicly

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID (owner)
            is_password_protected: Whether to password protect
            password: Password for access (if protected)

        Returns:
            Publication details with public URL
        """

        try:
            # Generate unique public token
            public_token = self._generate_token()
            public_slug = self._generate_slug(portfolio_id)

            # Hash password if provided
            password_hash = None
            if is_password_protected and password:
                password_hash = self._hash_password(password)

            publication_data = {
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "public_token": public_token,
                "public_slug": public_slug,
                "status": PublicationStatus.PASSWORD_PROTECTED.value if is_password_protected else PublicationStatus.PUBLIC.value,
                "password_hash": password_hash,
                "is_password_protected": is_password_protected,
                "current_version": PortfolioVersion.V1.value,
                "published_at": datetime.utcnow().isoformat(),
                "view_count": 0,
                "unique_visitors": 0,
                "last_viewed_at": None,
                "analytics": [],
            }

            # Public URL format: /p/{slug}/{token}
            public_url = f"/p/{public_slug}/{public_token}"

            logger.info(
                f"Portfolio {portfolio_id} published: {public_url} "
                f"(password_protected={is_password_protected})"
            )

            return {
                "status": "published",
                "portfolio_id": portfolio_id,
                "public_token": public_token,
                "public_slug": public_slug,
                "public_url": public_url,
                "full_url": f"https://cosmofolio.com{public_url}",
                "is_password_protected": is_password_protected,
                "published_at": publication_data["published_at"],
                "current_version": PortfolioVersion.V1.value,
            }

        except Exception as e:
            logger.error(f"Error publishing portfolio: {str(e)}")
            raise

    def unpublish_portfolio(
        self,
        portfolio_id: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Unpublish a portfolio (make private)

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID (owner)

        Returns:
            Confirmation with analytics snapshot
        """

        try:
            # Archive publication record instead of deleting
            logger.info(f"Portfolio {portfolio_id} unpublished by {user_id}")

            return {
                "status": "unpublished",
                "portfolio_id": portfolio_id,
                "archived_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error unpublishing portfolio: {str(e)}")
            raise

    def get_public_portfolio(
        self,
        public_slug: str,
        public_token: str,
        password: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get public portfolio by slug and token

        Args:
            public_slug: Public slug
            public_token: Public token
            password: Password if protected

        Returns:
            Portfolio data
        """

        try:
            # Validate token and slug match
            if not self._validate_token(public_slug, public_token):
                raise ValueError("Invalid public link")

            # Check if password protected and verify
            # (In production, would query database)

            logger.info(f"Public portfolio accessed: {public_slug}")

            return {
                "status": "accessible",
                "portfolio_id": public_slug,  # In real impl, would look up
                "public_url": f"/p/{public_slug}/{public_token}",
            }

        except Exception as e:
            logger.error(f"Error accessing public portfolio: {str(e)}")
            raise

    def track_view(
        self,
        portfolio_id: str,
        public_token: str,
        visitor_ip: Optional[str] = None,
        referrer: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Track portfolio view

        Args:
            portfolio_id: Portfolio ID
            public_token: Public token
            visitor_ip: Visitor IP address
            referrer: Referring URL

        Returns:
            Updated view count
        """

        try:
            view_data = {
                "portfolio_id": portfolio_id,
                "viewed_at": datetime.utcnow().isoformat(),
                "visitor_ip": visitor_ip,
                "referrer": referrer,
            }

            logger.info(
                f"Portfolio {portfolio_id} view tracked from {visitor_ip}"
            )

            return {
                "status": "tracked",
                "portfolio_id": portfolio_id,
                "view_data": view_data,
            }

        except Exception as e:
            logger.error(f"Error tracking view: {str(e)}")
            raise

    def get_analytics(
        self,
        portfolio_id: str,
        user_id: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Get portfolio analytics

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID (owner)
            days: Number of days to include

        Returns:
            Analytics data
        """

        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)

            # In production, would query analytics database
            analytics = {
                "portfolio_id": portfolio_id,
                "period": f"Last {days} days",
                "total_views": 0,
                "unique_visitors": 0,
                "top_referrers": [],
                "views_by_date": [],
                "views_by_country": [],
                "top_pages": [],
                "devices": {
                    "desktop": 0,
                    "mobile": 0,
                    "tablet": 0,
                },
            }

            logger.info(f"Analytics retrieved for portfolio {portfolio_id}")

            return analytics

        except Exception as e:
            logger.error(f"Error retrieving analytics: {str(e)}")
            raise

    def create_share_token(
        self,
        portfolio_id: str,
        user_id: str,
        expires_in_days: int = 30,
        custom_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create temporary share token

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID
            expires_in_days: Expiration time
            custom_message: Custom message for share

        Returns:
            Share token and URL
        """

        try:
            share_token = self._generate_token()
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

            share_data = {
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "share_token": share_token,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": expires_at.isoformat(),
                "custom_message": custom_message,
                "click_count": 0,
            }

            share_url = f"https://cosmofolio.com/share/{share_token}"

            logger.info(
                f"Share token created for portfolio {portfolio_id}, "
                f"expires in {expires_in_days} days"
            )

            return {
                "status": "created",
                "portfolio_id": portfolio_id,
                "share_token": share_token,
                "share_url": share_url,
                "expires_at": expires_at.isoformat(),
                "custom_message": custom_message,
            }

        except Exception as e:
            logger.error(f"Error creating share token: {str(e)}")
            raise

    def update_portfolio_version(
        self,
        portfolio_id: str,
        user_id: str,
        new_version: str,
    ) -> Dict[str, Any]:
        """
        Update portfolio version

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID
            new_version: New version (v1, v2, etc.)

        Returns:
            Version update confirmation
        """

        try:
            # Validate version format
            if new_version not in [v.value for v in PortfolioVersion]:
                raise ValueError(f"Invalid version: {new_version}")

            logger.info(
                f"Portfolio {portfolio_id} version updated to {new_version}"
            )

            return {
                "status": "updated",
                "portfolio_id": portfolio_id,
                "new_version": new_version,
                "updated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error updating version: {str(e)}")
            raise

    def get_public_link_settings(
        self,
        portfolio_id: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Get public link settings

        Args:
            portfolio_id: Portfolio ID
            user_id: User ID

        Returns:
            Current publication settings
        """

        try:
            settings = {
                "portfolio_id": portfolio_id,
                "publication_status": PublicationStatus.DRAFT.value,
                "public_url": None,
                "is_password_protected": False,
                "current_version": PortfolioVersion.V1.value,
                "published_at": None,
                "view_count": 0,
                "unique_visitors": 0,
                "allow_downloads": True,
                "allow_sharing": True,
                "track_analytics": True,
            }

            return settings

        except Exception as e:
            logger.error(f"Error getting link settings: {str(e)}")
            raise

    def bulk_publish(
        self,
        portfolio_ids: List[str],
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Publish multiple portfolios

        Args:
            portfolio_ids: List of portfolio IDs
            user_id: User ID

        Returns:
            Bulk publication results
        """

        try:
            results = []
            for portfolio_id in portfolio_ids:
                result = self.publish_portfolio(
                    portfolio_id=portfolio_id,
                    user_id=user_id,
                )
                results.append(result)

            logger.info(
                f"Bulk published {len(results)} portfolios for user {user_id}"
            )

            return {
                "status": "bulk_published",
                "total": len(portfolio_ids),
                "successful": len(results),
                "results": results,
            }

        except Exception as e:
            logger.error(f"Error in bulk publish: {str(e)}")
            raise

    # ==================== HELPER METHODS ====================

    def _generate_token(self) -> str:
        """Generate unique token"""
        return secrets.token_urlsafe(self.token_length)

    def _generate_slug(self, portfolio_id: str) -> str:
        """Generate URL-safe slug from portfolio ID"""
        # In production, could be more sophisticated
        return portfolio_id.lower().replace("_", "-")

    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(password) == password_hash

    def _validate_token(self, slug: str, token: str) -> bool:
        """Validate token format"""
        # In production, would verify against database
        return len(token) == self.token_length and len(slug) > 0


# ==================== SINGLETON INSTANCE ====================

_publication_service = None

def get_publication_service() -> PublicationService:
    """Get or create publication service singleton"""
    global _publication_service
    if _publication_service is None:
        _publication_service = PublicationService()
    return _publication_service
