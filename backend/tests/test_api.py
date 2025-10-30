"""
Basic API Tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["status"] == "running"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "healthy"


def test_create_session():
    """Test session creation"""
    response = client.post("/api/sessions", json={
        "child_name": "Test Child",
        "child_age": 8,
        "parent_id": "test_parent_123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["child_name"] == "Test Child"
    assert data["child_age"] == 8
    assert data["is_active"] is True

    return data["session_id"]


def test_get_session():
    """Test getting session details"""
    # First create a session
    session_id = test_create_session()

    # Then get it
    response = client.get(f"/api/sessions/{session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id


def test_get_nonexistent_session():
    """Test getting a session that doesn't exist"""
    response = client.get("/api/sessions/nonexistent-id")
    assert response.status_code == 404


def test_session_summary():
    """Test getting session summary"""
    session_id = test_create_session()

    response = client.get(f"/api/sessions/{session_id}/summary")
    assert response.status_code == 200
    data = response.json()
    assert "session" in data
    assert "total_messages" in data
    assert "total_activities" in data
    assert "total_alerts" in data


def test_end_session():
    """Test ending a session"""
    session_id = test_create_session()

    response = client.post(f"/api/sessions/{session_id}/end")
    assert response.status_code == 200

    # Verify session is no longer active
    response = client.get(f"/api/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_chat_without_session():
    """Test chat with invalid session"""
    response = client.post("/api/chat", json={
        "session_id": "invalid",
        "message": "Hello",
        "child_age": 8
    })
    assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
