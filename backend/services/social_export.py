"""
Social Media Export Service
Phase 6: Task 6.2 - OG tags, social cards, preview images, shareable links
"""

import logging
from typing import Dict, Any, Optional, List
from enum import Enum
from urllib.parse import urlencode
import json

logger = logging.getLogger(__name__)


class SocialPlatform(str, Enum):
    """Supported social media platforms"""
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"
    EMAIL = "email"


class ImageSize(str, Enum):
    """Standard social media image sizes"""
    # LinkedIn: 1200x627
    LINKEDIN = "1200x627"
    # Instagram: 1080x1080, 1080x1350
    INSTAGRAM_SQUARE = "1080x1080"
    INSTAGRAM_PORTRAIT = "1080x1350"
    # Twitter: 1200x630
    TWITTER = "1200x630"
    # Facebook: 1200x630
    FACEBOOK = "1200x630"
    # Pinterest: 1000x1500
    PINTEREST = "1000x1500"
    # High-res preview: 2560x1440
    PREVIEW_HD = "2560x1440"


class SocialExportService:
    """Service for exporting portfolios to social media"""

    def __init__(self):
        """Initialize social export service"""

        self.base_url = "https://cosmofolio.com"

        # Platform configurations
        self.platform_configs = {
            SocialPlatform.LINKEDIN: {
                "image_size": "1200x627",
                "max_description": 300,
                "title_max": 200,
                "hashtag_count": 5,
            },
            SocialPlatform.INSTAGRAM: {
                "image_size": "1080x1080",
                "max_description": 2200,
                "title_max": 100,
                "hashtag_count": 30,
            },
            SocialPlatform.TWITTER: {
                "image_size": "1200x630",
                "max_description": 280,
                "title_max": 100,
                "hashtag_count": 3,
            },
            SocialPlatform.FACEBOOK: {
                "image_size": "1200x630",
                "max_description": 300,
                "title_max": 200,
                "hashtag_count": 5,
            },
            SocialPlatform.PINTEREST: {
                "image_size": "1000x1500",
                "max_description": 500,
                "title_max": 100,
                "hashtag_count": 10,
            },
        }

        logger.info("Social Export Service initialized")

    def generate_og_meta_tags(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        public_url: str,
        image_url: Optional[str] = None,
    ) -> str:
        """
        Generate Open Graph meta tags for portfolio

        Args:
            portfolio_id: Portfolio ID
            portfolio_data: Portfolio data
            public_url: Public portfolio URL
            image_url: Preview image URL

        Returns:
            HTML meta tags
        """

        try:
            title = portfolio_data.get("title", "Portfolio")
            description = portfolio_data.get("description", "Professional architecture portfolio")
            author = portfolio_data.get("author", "")

            # Default image if not provided
            if not image_url:
                image_url = f"{self.base_url}/previews/{portfolio_id}/og.jpg"

            meta_tags = f"""
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{public_url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{image_url}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="CosmoFolio">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{public_url}">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{image_url}">

    <!-- Additional Meta Tags -->
    <meta name="description" content="{description}">
    <meta name="author" content="{author}">
    <meta property="og:locale" content="en_US">
"""

            logger.info(f"OG meta tags generated for portfolio {portfolio_id}")

            return meta_tags.strip()

        except Exception as e:
            logger.error(f"Error generating OG tags: {str(e)}")
            raise

    def generate_social_preview_card(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        platform: str,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate social media preview card

        Args:
            portfolio_id: Portfolio ID
            portfolio_data: Portfolio data
            platform: Social platform
            image_url: Portfolio image URL

        Returns:
            Preview card data
        """

        try:
            platform_enum = SocialPlatform(platform)
            config = self.platform_configs.get(platform_enum, {})

            title = portfolio_data.get("title", "Portfolio")
            description = portfolio_data.get("description", "")
            author = portfolio_data.get("author", "")

            # Truncate to platform limits
            title = self._truncate(title, config.get("title_max", 200))
            description = self._truncate(description, config.get("max_description", 300))

            # Generate hashtags
            hashtags = self._generate_hashtags(
                portfolio_data.get("keywords", []),
                config.get("hashtag_count", 5)
            )

            preview_card = {
                "portfolio_id": portfolio_id,
                "platform": platform,
                "title": title,
                "description": description,
                "author": author,
                "hashtags": hashtags,
                "image_url": image_url or f"{self.base_url}/previews/{portfolio_id}/{platform}.jpg",
                "image_size": config.get("image_size", "1200x630"),
                "preview_text": self._generate_preview_text(
                    title, description, hashtags, platform
                ),
            }

            logger.info(f"Social preview card generated for {platform}")

            return preview_card

        except Exception as e:
            logger.error(f"Error generating preview card: {str(e)}")
            raise

    def generate_shareable_link(
        self,
        portfolio_id: str,
        platform: str,
        custom_text: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Generate platform-specific shareable link

        Args:
            portfolio_id: Portfolio ID
            platform: Social platform
            custom_text: Custom message

        Returns:
            Platform-specific share URLs
        """

        try:
            public_url = f"{self.base_url}/p/{portfolio_id}"
            default_text = "Check out my architecture portfolio!"
            share_text = custom_text or default_text

            share_urls = {
                "linkedin": self._generate_linkedin_share(public_url, share_text),
                "instagram": self._generate_instagram_share(public_url, share_text),
                "twitter": self._generate_twitter_share(public_url, share_text),
                "facebook": self._generate_facebook_share(public_url, share_text),
                "pinterest": self._generate_pinterest_share(public_url, share_text),
                "email": self._generate_email_share(public_url, share_text),
            }

            logger.info(f"Shareable links generated for portfolio {portfolio_id}")

            return share_urls

        except Exception as e:
            logger.error(f"Error generating share links: {str(e)}")
            raise

    def get_image_sizes(self) -> Dict[str, tuple]:
        """Get all available image sizes with dimensions"""

        sizes = {
            "linkedin": (1200, 627),
            "instagram_square": (1080, 1080),
            "instagram_portrait": (1080, 1350),
            "twitter": (1200, 630),
            "facebook": (1200, 630),
            "pinterest": (1000, 1500),
            "preview_hd": (2560, 1440),
        }

        return sizes

    def generate_social_media_kit(
        self,
        portfolio_id: str,
        portfolio_data: Dict[str, Any],
        image_urls: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Generate complete social media kit

        Args:
            portfolio_id: Portfolio ID
            portfolio_data: Portfolio data
            image_urls: Dict of platform -> image URL

        Returns:
            Complete social media kit
        """

        try:
            kit = {
                "portfolio_id": portfolio_id,
                "generated_at": __import__('datetime').datetime.utcnow().isoformat(),
                "og_meta_tags": self.generate_og_meta_tags(
                    portfolio_id,
                    portfolio_data,
                    f"{self.base_url}/p/{portfolio_id}",
                    image_urls.get("og"),
                ),
                "platforms": {},
            }

            # Generate for each platform
            for platform in SocialPlatform:
                if platform == SocialPlatform.EMAIL:
                    continue

                card = self.generate_social_preview_card(
                    portfolio_id,
                    portfolio_data,
                    platform.value,
                    image_urls.get(platform.value),
                )

                kit["platforms"][platform.value] = card

            logger.info(f"Complete social media kit generated for {portfolio_id}")

            return kit

        except Exception as e:
            logger.error(f"Error generating media kit: {str(e)}")
            raise

    # ==================== HELPER METHODS ====================

    def _truncate(self, text: str, max_length: int) -> str:
        """Truncate text to max length"""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."

    def _generate_hashtags(
        self,
        keywords: List[str],
        count: int
    ) -> List[str]:
        """Generate hashtags from keywords"""
        hashtags = [f"#{kw}" for kw in keywords[:count]]
        if not hashtags:
            hashtags = [
                "#Architecture",
                "#Portfolio",
                "#Design",
                "#Modern",
                "#Professional"
            ][:count]
        return hashtags

    def _generate_preview_text(
        self,
        title: str,
        description: str,
        hashtags: List[str],
        platform: str
    ) -> str:
        """Generate preview text for sharing"""
        base_text = f"{title}\n{description}"
        if platform == "instagram":
            # Instagram allows more hashtags
            return f"{base_text}\n\n{' '.join(hashtags)}"
        elif platform == "twitter":
            # Twitter has character limit
            return f"{title}\n\n{' '.join(hashtags)}"
        else:
            return f"{base_text}\n{' '.join(hashtags)}"

    def _generate_linkedin_share(self, url: str, text: str) -> str:
        """Generate LinkedIn share URL"""
        params = {
            "url": url,
            "title": text.split('\n')[0],
            "summary": text.split('\n')[1] if '\n' in text else text,
        }
        return f"https://www.linkedin.com/sharing/share-offsite/?{urlencode(params)}"

    def _generate_instagram_share(self, url: str, text: str) -> str:
        """Generate Instagram share info"""
        return f"instagram://share?url={url}"

    def _generate_twitter_share(self, url: str, text: str) -> str:
        """Generate Twitter share URL"""
        params = {
            "url": url,
            "text": text.split('\n')[0],
        }
        return f"https://twitter.com/intent/tweet?{urlencode(params)}"

    def _generate_facebook_share(self, url: str, text: str) -> str:
        """Generate Facebook share URL"""
        params = {
            "u": url,
            "quote": text.split('\n')[0],
        }
        return f"https://www.facebook.com/sharer/sharer.php?{urlencode(params)}"

    def _generate_pinterest_share(self, url: str, text: str) -> str:
        """Generate Pinterest share URL"""
        params = {
            "url": url,
            "description": text.split('\n')[0],
        }
        return f"https://pinterest.com/pin/create/button/?{urlencode(params)}"

    def _generate_email_share(self, url: str, text: str) -> str:
        """Generate email share link"""
        subject = text.split('\n')[0]
        body = f"Check out this portfolio: {url}\n\n{text}"
        params = {
            "subject": subject,
            "body": body,
        }
        return f"mailto:?{urlencode(params)}"


# ==================== SINGLETON INSTANCE ====================

_social_export_service = None

def get_social_export_service() -> SocialExportService:
    """Get or create social export service singleton"""
    global _social_export_service
    if _social_export_service is None:
        _social_export_service = SocialExportService()
    return _social_export_service
