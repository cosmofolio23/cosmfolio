"""
Pytest configuration and fixtures
"""

import pytest
import os
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from uuid import uuid4

# Load environment variables for testing
load_dotenv()

# Set test environment
os.environ["DEBUG"] = "True"


@pytest.fixture(scope="session")
def app():
    """Create FastAPI app for testing"""
    from main import app
    return app


@pytest.fixture(scope="function")
def client(app):
    """Create TestClient for API testing"""
    return TestClient(app)


@pytest.fixture
def test_user():
    """Create test user data"""
    return {
        "user_id": str(uuid4()),
        "email": f"test_{uuid4().hex[:8]}@example.com",
        "name": "Test User",
    }


@pytest.fixture
def test_project():
    """Create test project data"""
    return {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "title": "Test Project",
        "description": "A test architecture project",
        "project_type": "residential",
        "location": "San Francisco, CA",
        "status": "draft",
    }


@pytest.fixture
def test_portfolio():
    """Create test portfolio data"""
    return {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "project_id": str(uuid4()),
        "layout_id": "layout_hero",
        "style_pack": "minimal",
        "status": "ready",
    }


@pytest.fixture
def test_asset():
    """Create test asset data"""
    return {
        "id": str(uuid4()),
        "project_id": str(uuid4()),
        "asset_type": "render",
        "file_url": "https://example.com/image.jpg",
        "file_name": "test_render.jpg",
        "file_size": 2048000,
    }


@pytest.fixture
def auth_headers(test_user):
    """Create authorization headers for testing"""
    # This would use a test token in production
    return {
        "Authorization": f"Bearer test_token_{test_user['user_id']}"
    }


@pytest.fixture(autouse=True)
def reset_ai_service_singleton():
    """Reset AI service singleton between tests"""
    from services import ai_generation
    ai_generation._ai_generation_service = None
    yield
    ai_generation._ai_generation_service = None
