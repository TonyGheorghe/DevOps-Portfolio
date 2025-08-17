# tests/test_health_simple.py - FIXED VERSION
"""
Teste simple pentru health check - pentru debug și verificare că pytest-asyncio funcționează.
"""
import pytest
import httpx
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_health_endpoint_basic(client: AsyncClient):
    """Test basic pentru health endpoint - folosește fixture-ul client corect."""
    response = await client.get("/health")
    
    # Don't be too strict - just check it works
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    print(f"Health response: {data}")


@pytest.mark.asyncio  
async def test_async_functionality():
    """Test că funcțiile async funcționează în pytest."""
    result = await async_helper_function()
    assert result == "async works"


async def async_helper_function():
    """Helper function pentru test async."""
    return "async works"


def test_sync_function():
    """Test sincron pentru comparație."""
    assert True


@pytest.mark.asyncio
async def test_manual_client_creation():
    """Test creating client manually to verify AsyncClient works."""
    from app.main import app
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as client:
        response = await client.get("/health")
        print(f"Manual client - Status: {response.status_code}")
        print(f"Manual client - Response: {response.text}")
        
        # Should work fine
        assert response.status_code == 200
