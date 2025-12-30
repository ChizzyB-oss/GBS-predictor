import pytest
from fastapi.testclient import TestClient
from types import SimpleNamespace

from backend.app.main import app
from backend.app.services.auth_service import get_current_user

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def override_auth_dependency():
    """
    Automatically override authentication for all tests
    unless explicitly cleared inside a test.
    """

    def mock_current_user():
        return SimpleNamespace(
            id=1,
            email="test@admin.com",
            role="admin"
        )

    app.dependency_overrides[get_current_user] = mock_current_user

    yield

    # Cleanup after each test
    app.dependency_overrides.clear()
