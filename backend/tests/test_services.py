"""
Unit Tests for Services
Phase 7: Task 7.2 - Test all backend services with >80% coverage
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

# Import services to test
from services.publication import PublicationService, PublicationStatus, PortfolioVersion
from services.social_export import SocialExportService, SocialPlatform
from services.download_export import DownloadExportService, ExportFormat
from services.cache import CacheService


# ==================== PUBLICATION SERVICE TESTS ====================

class TestPublicationService:
    """Unit tests for PublicationService"""

    @pytest.fixture
    def publication_service(self):
        """Create publication service instance"""
        return PublicationService()

    def test_publish_portfolio_public(self, publication_service):
        """Test publishing portfolio as public"""
        result = publication_service.publish_portfolio(
            portfolio_id="port_123",
            user_id="user_456",
            is_password_protected=False,
        )

        assert result["status"] == "published"
        assert result["public_url"].startswith("/p/")
        assert "public_token" in result
        assert "public_slug" in result
        assert result["is_password_protected"] is False

    def test_publish_portfolio_password_protected(self, publication_service):
        """Test publishing with password protection"""
        result = publication_service.publish_portfolio(
            portfolio_id="port_123",
            user_id="user_456",
            is_password_protected=True,
            password="secure123",
        )

        assert result["is_password_protected"] is True
        assert "public_token" in result

    def test_token_generation_uniqueness(self, publication_service):
        """Test that tokens are unique"""
        token1 = publication_service._generate_token()
        token2 = publication_service._generate_token()

        assert token1 != token2
        assert len(token1) == len(token2)

    def test_password_hashing(self, publication_service):
        """Test password hashing"""
        password = "test_password_123"
        hash1 = publication_service._hash_password(password)
        hash2 = publication_service._hash_password(password)

        # Same password should produce same hash
        assert hash1 == hash2
        # Hash should not be password
        assert hash1 != password

    def test_password_verification(self, publication_service):
        """Test password verification"""
        password = "test_password_123"
        password_hash = publication_service._hash_password(password)

        assert publication_service._verify_password(password, password_hash) is True
        assert publication_service._verify_password("wrong_password", password_hash) is False

    def test_create_share_token(self, publication_service):
        """Test share token creation"""
        result = publication_service.create_share_token(
            portfolio_id="port_123",
            user_id="user_456",
            expires_in_days=30,
        )

        assert result["status"] == "created"
        assert "share_token" in result
        assert "share_url" in result
        assert "expires_at" in result

    def test_share_token_expiration(self, publication_service):
        """Test share token expiration date"""
        result = publication_service.create_share_token(
            portfolio_id="port_123",
            user_id="user_456",
            expires_in_days=7,
        )

        expires = datetime.fromisoformat(result["expires_at"])
        now = datetime.utcnow()
        days_diff = (expires - now).days

        assert 6 <= days_diff <= 7

    def test_unpublish_portfolio(self, publication_service):
        """Test unpublishing portfolio"""
        result = publication_service.unpublish_portfolio(
            portfolio_id="port_123",
            user_id="user_456",
        )

        assert result["status"] == "unpublished"

    def test_get_public_link_settings(self, publication_service):
        """Test getting public link settings"""
        result = publication_service.get_public_link_settings(
            portfolio_id="port_123",
            user_id="user_456",
        )

        assert "publication_status" in result
        assert "allow_downloads" in result
        assert "allow_sharing" in result
        assert "track_analytics" in result

    def test_bulk_publish(self, publication_service):
        """Test bulk publishing multiple portfolios"""
        portfolio_ids = ["port_1", "port_2", "port_3"]

        result = publication_service.bulk_publish(
            portfolio_ids=portfolio_ids,
            user_id="user_456",
        )

        assert result["status"] == "bulk_published"
        assert result["total"] == 3
        assert len(result["results"]) == 3


# ==================== SOCIAL EXPORT SERVICE TESTS ====================

class TestSocialExportService:
    """Unit tests for SocialExportService"""

    @pytest.fixture
    def social_service(self):
        """Create social export service instance"""
        return SocialExportService()

    def test_generate_og_meta_tags(self, social_service):
        """Test OG meta tag generation"""
        portfolio_data = {
            "title": "Modern Architecture",
            "description": "Sustainable architecture portfolio",
            "author": "Jane Doe",
        }

        result = social_service.generate_og_meta_tags(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            public_url="https://cosmofolio.com/p/modern-arch/token123",
        )

        assert "og:title" in result
        assert "og:description" in result
        assert "twitter:card" in result
        assert "Modern Architecture" in result

    def test_social_preview_linkedin(self, social_service):
        """Test LinkedIn preview card generation"""
        portfolio_data = {
            "title": "Modern Tower",
            "description": "Sustainable residential tower",
            "author": "Jane Doe",
            "keywords": ["architecture", "sustainable"],
        }

        result = social_service.generate_social_preview_card(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            platform="linkedin",
        )

        assert result["platform"] == "linkedin"
        assert result["image_size"] == "1200x627"
        assert len(result["hashtags"]) <= 5

    def test_social_preview_instagram(self, social_service):
        """Test Instagram preview card generation"""
        portfolio_data = {
            "title": "Modern Tower",
            "description": "Sustainable residential tower",
            "author": "Jane Doe",
            "keywords": ["architecture", "design", "modern"],
        }

        result = social_service.generate_social_preview_card(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            platform="instagram",
        )

        assert result["platform"] == "instagram"
        assert result["image_size"] in ["1080x1080", "1080x1350"]
        assert len(result["hashtags"]) <= 30

    def test_generate_shareable_links(self, social_service):
        """Test shareable link generation"""
        result = social_service.generate_shareable_link(
            portfolio_id="port_123",
            platform="linkedin",
        )

        assert "linkedin" in result
        assert "twitter" in result
        assert "facebook" in result
        assert "email" in result
        assert all(isinstance(v, str) for v in result.values())

    def test_hashtag_generation(self, social_service):
        """Test hashtag generation from keywords"""
        keywords = ["architecture", "design", "modern", "sustainable", "eco"]
        hashtags = social_service._generate_hashtags(keywords, 5)

        assert len(hashtags) == 5
        assert all(tag.startswith("#") for tag in hashtags)

    def test_text_truncation(self, social_service):
        """Test text truncation for platform limits"""
        long_text = "A" * 500
        truncated = social_service._truncate(long_text, 50)

        assert len(truncated) <= 50
        assert truncated.endswith("...")

    def test_get_image_sizes(self, social_service):
        """Test getting recommended image sizes"""
        sizes = social_service.get_image_sizes()

        assert sizes["linkedin"] == (1200, 627)
        assert sizes["instagram_square"] == (1080, 1080)
        assert sizes["twitter"] == (1200, 630)


# ==================== DOWNLOAD EXPORT SERVICE TESTS ====================

class TestDownloadExportService:
    """Unit tests for DownloadExportService"""

    @pytest.fixture
    def download_service(self):
        """Create download export service instance"""
        return DownloadExportService()

    def test_export_pdf(self, download_service):
        """Test PDF export preparation"""
        portfolio_data = {
            "title": "Modern Architecture",
            "author": "Jane Doe",
        }
        pdf_content = b"%PDF-1.4\n test content"

        result = download_service.export_portfolio_pdf(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            pdf_binary=pdf_content,
        )

        assert result["format"] == "pdf"
        assert result["mime_type"] == "application/pdf"
        assert result["file_size_bytes"] == len(pdf_content)
        assert "filename" in result

    def test_export_html(self, download_service):
        """Test HTML export preparation"""
        portfolio_data = {
            "title": "Modern Architecture",
            "author": "Jane Doe",
        }
        html_content = "<html><body>Portfolio</body></html>"

        result = download_service.export_portfolio_html(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            html_content=html_content,
        )

        assert result["format"] == "html"
        assert result["mime_type"] == "text/html"
        assert "filename" in result

    def test_export_zip(self, download_service):
        """Test ZIP export creation"""
        portfolio_data = {
            "title": "Modern Architecture",
            "author": "Jane Doe",
        }
        files = {
            "index.html": b"<html></html>",
            "style.css": b"body { color: black; }",
            "image.jpg": b"fake image data",
        }

        result = download_service.export_portfolio_zip(
            portfolio_id="port_123",
            portfolio_data=portfolio_data,
            files=files,
        )

        assert result["format"] == "zip"
        assert result["mime_type"] == "application/zip"
        assert result["file_count"] == 5  # 3 files + metadata.json + README.md
        assert result["file_size_bytes"] > 0

    def test_batch_export(self, download_service):
        """Test batch export of multiple portfolios"""
        portfolio_data_map = {
            "port_1": {"title": "Portfolio 1"},
            "port_2": {"title": "Portfolio 2"},
        }
        files_map = {
            "port_1": {"index.html": b"html1"},
            "port_2": {"index.html": b"html2"},
        }

        result = download_service.batch_export(
            portfolio_ids=["port_1", "port_2"],
            portfolio_data_map=portfolio_data_map,
            format="zip",
            files_map=files_map,
        )

        assert result["status"] == "batch_exported"
        assert result["total_portfolios"] == 2
        assert result["successful"] >= 1

    def test_get_export_info(self, download_service):
        """Test getting export format information"""
        pdf_info = download_service.get_export_info("pdf")

        assert pdf_info["name"] == "PDF Document"
        assert pdf_info["extension"] == ".pdf"
        assert "suitable_for" in pdf_info

    def test_file_size_limits(self, download_service):
        """Test file size validation"""
        portfolio_data = {"title": "Test"}
        # Create content exceeding max file size
        large_pdf = b"x" * (100 * 1024 * 1024 + 1)  # 100MB + 1 byte

        with pytest.raises(ValueError):
            download_service.export_portfolio_pdf(
                portfolio_id="port_123",
                portfolio_data=portfolio_data,
                pdf_binary=large_pdf,
            )


# ==================== CACHE SERVICE TESTS ====================

class TestCacheService:
    """Unit tests for CacheService"""

    @pytest.fixture
    def cache_service(self):
        """Create cache service instance (uses in-memory fallback)"""
        return CacheService(host="invalid_host")  # Force in-memory mode

    def test_set_and_get(self, cache_service):
        """Test setting and getting cache values"""
        cache_service.set("test_key", {"data": "value"}, ttl=3600)
        result = cache_service.get("test_key")

        assert result == {"data": "value"}

    def test_cache_miss(self, cache_service):
        """Test cache miss returns None"""
        result = cache_service.get("nonexistent_key")
        assert result is None

    def test_cache_delete(self, cache_service):
        """Test deleting cache entries"""
        cache_service.set("key_to_delete", {"data": "value"})
        cache_service.delete("key_to_delete")
        result = cache_service.get("key_to_delete")

        assert result is None

    def test_cache_expiration(self, cache_service):
        """Test cache TTL expiration"""
        cache_service.set("expiring_key", {"data": "value"}, ttl=1)
        import time
        time.sleep(1.1)

        result = cache_service.get("expiring_key")
        assert result is None

    def test_cache_key_generation(self, cache_service):
        """Test cache key generation"""
        key = cache_service.cache_key("portfolio", "port_123", "pdf")
        assert key == "portfolio:port_123:pdf"

    def test_pdf_export_caching(self, cache_service):
        """Test PDF export caching"""
        pdf_content = b"%PDF test"
        cache_service.cache_pdf_export(
            portfolio_id="port_123",
            style_pack="dark_studio",
            page_size="A4",
            pdf_bytes=pdf_content,
        )

        cached_pdf = cache_service.get_cached_pdf(
            portfolio_id="port_123",
            style_pack="dark_studio",
            page_size="A4",
        )

        assert cached_pdf == pdf_content

    def test_cache_stats(self, cache_service):
        """Test cache statistics"""
        cache_service.set("key1", "value1")
        cache_service.set("key2", "value2")

        stats = cache_service.get_cache_stats()
        assert "backend" in stats
        assert stats["backend"] == "memory"
        assert stats["entry_count"] == 2


# ==================== TEST FIXTURES ====================

@pytest.fixture
def sample_portfolio_data():
    """Sample portfolio data for testing"""
    return {
        "id": "port_123",
        "title": "Modern Architecture Tower",
        "description": "Sustainable residential tower with green spaces",
        "author": "Jane Doe",
        "status": "published",
        "created_at": datetime.utcnow().isoformat(),
        "keywords": ["architecture", "design", "modern", "sustainable"],
    }


@pytest.fixture
def sample_portfolio_files():
    """Sample portfolio files for testing"""
    return {
        "index.html": b"<html><body>Portfolio</body></html>",
        "styles.css": b"body { color: black; }",
        "script.js": b"console.log('test');",
    }


# ==================== TEST EXECUTION ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=services", "--cov-report=html"])
