# tests/test_health.py
import pytest
from httpx import AsyncClient

async def test_health_endpoint_success(client: AsyncClient):
    """Test that health endpoint returns 200 with correct structure."""
    response = await client.get("/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data.get("status") == "ok"
    assert "version" in data
    
    # Additional checks
    assert isinstance(data["status"], str)
    assert isinstance(data["version"], str)

async def test_health_endpoint_structure(client: AsyncClient):
    """Test the exact structure of health response."""
    response = await client.get("/health")
    
    data = response.json()
    required_keys = {"status", "version"}
    actual_keys = set(data.keys())
    
    assert required_keys.issubset(actual_keys), f"Missing keys: {required_keys - actual_keys}"
