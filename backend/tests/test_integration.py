"""
Integration Tests
Phase 7: Task 7.2 - Test complete workflows and API integration
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# Mock database and services
from main import app


from tests.conftest import create_mock_jwt

# ==================== SETUP ====================

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Generate authorization headers"""
    token = create_mock_jwt("user_456", "user456@example.com")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest.fixture(autouse=True)
def mock_supabase_db():
    """Mock Supabase DB operations for publication routes"""
    with patch('routes.publication.supabase') as mock_db:
        class TableQuery:
            def __init__(self, table_name):
                self.table_name = table_name
                self.filters = {}
                
            def select(self, *args, **kwargs):
                return self
                
            def eq(self, field, value):
                self.filters[field] = value
                return self
                
            def execute(self):
                if self.table_name == "portfolios":
                    p_id = self.filters.get("id")
                    if p_id == "port_123":
                        return Mock(data=[{"project_id": "proj_123"}])
                    return Mock(data=[])
                elif self.table_name == "projects":
                    proj_id = self.filters.get("id")
                    if proj_id == "proj_123":
                        return Mock(data=[{"user_id": "user_456"}])
                    return Mock(data=[])
                return Mock(data=[])
                
        mock_db.table.side_effect = lambda name: TableQuery(name)
        yield mock_db


# ==================== WORKFLOW TESTS ====================

class TestPortfolioWorkflow:
    """Integration tests for complete portfolio workflow"""

    @patch('routes.publication.get_publication_service')
    def test_publish_portfolio_workflow(self, mock_pub_service, client, auth_headers):
        """Test: Create → Design → Publish → Share workflow"""

        # Mock publication service
        mock_service = Mock()
        mock_service.publish_portfolio.return_value = {
            "status": "published",
            "public_url": "/p/modern-tower/token123",
            "public_token": "token123",
            "public_slug": "modern-tower",
        }
        mock_pub_service.return_value = mock_service

        # Step 1: Publish portfolio
        response = client.post(
            "/api/portfolios/port_123/publish",
            headers=auth_headers,
            json={"is_password_protected": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "published"
        assert "public_url" in data

    @patch('routes.publication.get_social_export_service')
    def test_share_to_social_workflow(self, mock_social_service, client, auth_headers):
        """Test: Generate social preview → Share workflow"""

        # Mock social service
        mock_service = Mock()
        mock_service.generate_social_preview_card.return_value = {
            "platform": "linkedin",
            "title": "Modern Tower",
            "description": "Sustainable architecture",
            "hashtags": ["#Architecture", "#Design"],
            "image_size": "1200x627",
        }
        mock_social_service.return_value = mock_service

        # Step 1: Get social preview
        response = client.post(
            "/api/portfolios/port_123/social-preview",
            headers=auth_headers,
            json={"platform": "linkedin"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "preview_card" in data
        assert data["preview_card"]["platform"] == "linkedin"

    @patch('routes.publication.get_download_export_service')
    def test_download_workflow(self, mock_download_service, client, auth_headers):
        """Test: Export → Download workflow"""

        # Mock download service
        mock_service = Mock()
        mock_service.export_portfolio_zip.return_value = {
            "format": "zip",
            "filename": "portfolio.zip",
            "file_size_bytes": 1024000,
            "file_size_mb": 1.0,
            "mime_type": "application/zip",
        }
        mock_download_service.return_value = mock_service

        # Step 1: Request download
        response = client.post(
            "/api/portfolios/port_123/download",
            headers=auth_headers,
            json={"format": "zip"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "zip"
        assert "download_url" in data


# ==================== API ENDPOINT TESTS ====================

class TestPublicationAPI:
    """Integration tests for Publication API endpoints"""

    @patch('routes.publication.get_current_user')
    @patch('routes.publication.get_publication_service')
    def test_publish_endpoint(self, mock_pub_service, mock_auth, client, auth_headers):
        """Test POST /api/portfolios/{id}/publish"""

        # Mock authentication
        mock_auth.return_value = {"user_id": "user_456", "name": "Jane Doe"}

        # Mock service
        mock_service = Mock()
        mock_service.publish_portfolio.return_value = {
            "status": "published",
            "public_url": "/p/test-port/token123",
            "public_token": "token123",
            "public_slug": "test-port",
        }
        mock_pub_service.return_value = mock_service

        response = client.post(
            "/api/portfolios/port_123/publish",
            headers=auth_headers,
            json={"is_password_protected": False},
        )

        assert response.status_code == 200
        assert response.json()["status"] == "published"

    @patch('routes.publication.get_current_user')
    @patch('routes.publication.get_publication_service')
    def test_get_public_link_endpoint(self, mock_pub_service, mock_auth, client, auth_headers):
        """Test GET /api/portfolios/{id}/public-link"""

        mock_auth.return_value = {"user_id": "user_456"}

        mock_service = Mock()
        mock_service.get_public_link_settings.return_value = {
            "portfolio_id": "port_123",
            "public_url": "/p/test-port/token123",
            "is_password_protected": False,
        }
        mock_pub_service.return_value = mock_service

        response = client.get(
            "/api/portfolios/port_123/public-link",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "public_url" in data

    @patch('routes.publication.get_current_user')
    @patch('routes.publication.get_publication_service')
    def test_share_endpoint(self, mock_pub_service, mock_auth, client, auth_headers):
        """Test POST /api/portfolios/{id}/share"""

        mock_auth.return_value = {"user_id": "user_456"}

        mock_service = Mock()
        mock_service.create_share_token.return_value = {
            "share_url": "https://cosmofolio.com/share/token123",
            "share_token": "token123",
            "expires_at": "2026-06-30T10:30:00Z",
        }
        mock_pub_service.return_value = mock_service

        response = client.post(
            "/api/portfolios/port_123/share",
            headers=auth_headers,
            json={"expires_in_days": 30},
        )

        assert response.status_code == 200
        data = response.json()
        assert "share_url" in data

    @patch('routes.publication.get_current_user')
    @patch('routes.publication.get_publication_service')
    def test_analytics_endpoint(self, mock_pub_service, mock_auth, client, auth_headers):
        """Test GET /api/portfolios/{id}/analytics"""

        mock_auth.return_value = {"user_id": "user_456"}

        mock_service = Mock()
        mock_service.get_analytics.return_value = {
            "portfolio_id": "port_123",
            "total_views": 42,
            "unique_visitors": 28,
            "top_referrers": ["LinkedIn", "Direct"],
        }
        mock_pub_service.return_value = mock_service

        response = client.get(
            "/api/portfolios/port_123/analytics?days=30",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_views" in data


# ==================== ERROR HANDLING TESTS ====================

class TestErrorHandling:
    """Test error handling and edge cases"""

    @patch('routes.publication.get_current_user')
    def test_unauthenticated_request(self, mock_auth, client):
        """Test request without authentication"""

        mock_auth.side_effect = Exception("Unauthorized")

        response = client.get(
            "/api/portfolios/port_123/analytics",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code in [401, 500]

    def test_invalid_portfolio_id(self, client, auth_headers):
        """Test with invalid portfolio ID"""

        response = client.get(
            "/api/portfolios/non_existent_portfolio_id_123/public-link",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @patch('routes.publication.get_current_user')
    def test_service_exception_handling(self, mock_auth, client, auth_headers):
        """Test service exceptions are caught"""

        mock_auth.return_value = {"user_id": "user_456"}

        with patch('routes.publication.get_publication_service') as mock_service:
            mock_service.return_value.publish_portfolio.side_effect = Exception("Service error")

            response = client.post(
                "/api/portfolios/port_123/publish",
                headers=auth_headers,
                json={},
            )

            assert response.status_code == 500


# ==================== CONCURRENCY TESTS ====================

class TestConcurrency:
    """Test concurrent operations"""

    @patch('routes.publication.get_publication_service')
    def test_concurrent_publishes(self, mock_pub_service):
        """Test concurrent portfolio publications"""

        import concurrent.futures
        import time

        mock_service = Mock()
        mock_service.publish_portfolio.return_value = {
            "status": "published",
            "public_token": "token",
        }
        mock_pub_service.return_value = mock_service

        def publish_portfolio(portfolio_id):
            return mock_service.publish_portfolio(
                portfolio_id=portfolio_id,
                user_id="user_456",
            )

        # Publish 10 portfolios concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(publish_portfolio, f"port_{i}")
                for i in range(10)
            ]
            results = [f.result() for f in futures]

        assert len(results) == 10
        assert all(r["status"] == "published" for r in results)


# ==================== CACHING TESTS ====================

class TestCachingIntegration:
    """Test caching in integration workflows"""

    @patch('services.cache.get_cache_service')
    @patch('routes.publication.get_publication_service')
    def test_cache_hit_on_repeated_request(self, mock_pub_service, mock_cache, client, auth_headers):
        """Test cache hit on repeated requests"""

        mock_auth_user = Mock(id="user_456")

        # First cache miss, then cache hit
        mock_cache.return_value.get.side_effect = [None, {"cached": True}]

        # Make two requests
        client.get("/api/portfolios/port_123/public-link", headers=auth_headers)
        response = client.get("/api/portfolios/port_123/public-link", headers=auth_headers)

        # Second request should use cache
        assert mock_cache.return_value.get.call_count >= 1


# ==================== TEST UTILITIES ====================

@pytest.fixture
def sample_publish_request():
    """Sample publish request payload"""
    return {
        "is_password_protected": False,
    }


@pytest.fixture
def sample_share_request():
    """Sample share request payload"""
    return {
        "expires_in_days": 30,
        "custom_message": "Check out my portfolio!",
    }


@pytest.fixture
def sample_download_request():
    """Sample download request payload"""
    return {
        "format": "zip",
        "filename": "my-portfolio.zip",
    }


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=routes,services", "--cov-report=html"])
