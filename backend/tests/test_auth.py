"""
Authentication & Authorization Tests for CosmoFolio
Phase 1: Task 1.8 - Verify Firebase integration and RLS policies on projects
"""

import pytest
import os
from uuid import uuid4
from datetime import datetime
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

# These tests verify:
# 1. Firebase token validation
# 2. RLS policies enforcement
# 3. Access control (403 on unauthorized)
# 4. Token expiration handling

class TestAuthenticationFlow:
    """Test Firebase authentication flow"""

    def test_create_project_requires_auth(self, client: TestClient):
        """Verify project creation requires valid auth token"""
        response = client.post(
            "/api/projects",
            json={
                "title": "Test Project",
                "description": "A test architecture project",
                "project_type": "residential"
            }
        )
        # Without headers, deps.py returns 412/401
        assert response.status_code == 401, "Should require authentication"

    def test_valid_firebase_token_accepted(self, client: TestClient, valid_token: str):
        """Verify valid Firebase tokens are accepted"""
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {valid_token}"},
            json={
                "title": "Test Project",
                "description": "A test architecture project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 200, f"Valid token should be accepted, got {response.status_code}"
        assert response.json()["id"] is not None

    def test_invalid_token_rejected(self, client: TestClient):
        """Verify invalid tokens are rejected"""
        response = client.post(
            "/api/projects",
            headers={"Authorization": "Bearer invalid_token_12345"},
            json={
                "title": "Test Project",
                "description": "A test architecture project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 401, "Invalid token should be rejected"

    def test_expired_token_rejected(self, client: TestClient, expired_token: str):
        """Verify expired tokens are rejected"""
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {expired_token}"},
            json={
                "title": "Test Project",
                "description": "A test architecture project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 401, "Expired token should be rejected"

    def test_missing_bearer_prefix(self, client: TestClient, valid_token: str):
        """Verify token must have Bearer prefix"""
        response = client.post(
            "/api/projects",
            headers={"Authorization": valid_token},  # Missing "Bearer " prefix
            json={
                "title": "Test Project",
                "description": "A test architecture project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 401, "Bearer prefix is required"


class TestAuthorizationRLS:
    """Test Row-Level Security policies"""

    def test_user_cannot_access_other_projects(
        self,
        client: TestClient,
        user1_token: str,
        user2_token: str
    ):
        """Verify User1 cannot access User2's projects (RLS)"""
        # Create project as User 1
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "title": "User1 Project",
                "description": "User 1 project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 200
        project_id = response.json()["id"]

        # Try to access as User 2
        response = client.get(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        assert response.status_code == 404, "User2 should not access User1's project"

    def test_user_cannot_update_other_projects(
        self,
        client: TestClient,
        user1_token: str,
        user2_token: str
    ):
        """Verify User1 cannot update User2's projects"""
        # Create project as User 1
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "title": "User1 Project",
                "description": "User 1 project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 200
        project_id = response.json()["id"]

        # Try to update as User 2
        response = client.put(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {user2_token}"},
            json={
                "title": "Hacked Title",
                "project_type": "residential"
            }
        )
        assert response.status_code in [400, 403, 404], "User2 should not modify User1's project"

    def test_user_cannot_delete_other_projects(
        self,
        client: TestClient,
        user1_token: str,
        user2_token: str
    ):
        """Verify User1 cannot delete User2's projects"""
        # Create project as User 1
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "title": "User1 Project",
                "description": "User 1 project",
                "project_type": "residential"
            }
        )
        assert response.status_code == 200
        project_id = response.json()["id"]

        # Try to delete as User 2
        response = client.delete(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        assert response.status_code in [400, 403, 404], "User2 should not delete User1's project"


class TestErrorResponses:
    """Test error response standardization"""

    def test_401_on_missing_token(self, client: TestClient):
        """Verify 401 on missing auth token"""
        response = client.get("/api/projects")
        assert response.status_code == 401

    def test_403_on_unauthorized_access(
        self,
        client: TestClient,
        user1_token: str,
        user2_token: str
    ):
        """Verify 404/403 on access denied"""
        # Create project as User 1
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "title": "User1 Project",
                "description": "User 1 project",
                "project_type": "residential"
            }
        )
        project_id = response.json()["id"]

        # Try to access as User 2
        response = client.get(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        assert response.status_code == 404

    def test_404_on_not_found(self, client: TestClient, valid_token: str):
        """Verify 404 on missing resource"""
        response = client.get(
            f"/api/projects/{uuid4()}",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 404

    def test_400_on_bad_request(self, client: TestClient, valid_token: str):
        """Verify 400 on invalid request data"""
        response = client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {valid_token}"},
            json={
                "project_type": "invalid_type_123"
            }
        )
        assert response.status_code == 422  # FastAPI validation error


# ==================== FIXTURES ====================

from tests.conftest import create_mock_jwt

@pytest.fixture(autouse=True)
def setup_test_users():
    """Ensure that the test users exist in the users table so that FK constraints on projects table don't fail"""
    from database import supabase
    from datetime import datetime
    
    users = [
        {"id": "00000000-0000-0000-0000-000000000001", "email": "valid_user@example.com", "name": "Valid User"},
        {"id": "00000000-0000-0000-0000-000000000002", "email": "user1@example.com", "name": "User 1"},
        {"id": "00000000-0000-0000-0000-000000000003", "email": "user2@example.com", "name": "User 2"}
    ]
    
    # Pre-clean
    for u in users:
        try:
            supabase.table("projects").delete().eq("user_id", u["id"]).execute()
            supabase.table("users").delete().eq("id", u["id"]).execute()
        except Exception:
            pass
            
    # Insert
    for u in users:
        try:
            supabase.table("users").insert({
                "id": u["id"],
                "email": u["email"],
                "name": u["name"],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"[WARN] Failed to insert test user {u['id']}: {e}")
            
    yield
    
    # Cleanup (will delete projects and users)
    for u in users:
        try:
            supabase.table("projects").delete().eq("user_id", u["id"]).execute()
            supabase.table("users").delete().eq("id", u["id"]).execute()
        except Exception:
            pass

@pytest.fixture
def valid_token() -> str:
    """Valid Firebase token fixture"""
    return create_mock_jwt("00000000-0000-0000-0000-000000000001", "valid_user@example.com")

@pytest.fixture
def expired_token() -> str:
    """Expired Firebase token fixture"""
    return create_mock_jwt("00000000-0000-0000-0000-000000000001", "valid_user@example.com", expired=True)

@pytest.fixture
def user1_token() -> str:
    """User 1 Firebase token fixture"""
    return create_mock_jwt("00000000-0000-0000-0000-000000000002", "user1@example.com")

@pytest.fixture
def user2_token() -> str:
    """User 2 Firebase token fixture"""
    return create_mock_jwt("00000000-0000-0000-0000-000000000003", "user2@example.com")

@pytest.fixture
def client() -> TestClient:
    """Test client fixture"""
    from main import app
    return TestClient(app)
