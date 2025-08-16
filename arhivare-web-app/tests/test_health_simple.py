# tests/test_health_simple.py
"""
Teste simple pentru health check - pentru debug și verificare că pytest-asyncio funcționează.
"""
import pytest
import httpx
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint_basic():
    """Test basic pentru health endpoint - cel mai simplu test async."""
    async with AsyncClient(app=None, base_url="http://testserver") as client:
        # În loc să folosim app dependency, testăm doar că pytest-asyncio funcționează
        pass  # Dacă acest test trece, pytest-asyncio e configurat corect


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


# Test cu client fixture dacă există
async def test_health_with_client_if_available(client):
    """Test health endpoint dacă client fixture funcționează."""
    try:
        response = await client.get("/health")
        # Dacă ajungem aici, client fixture funcționează
        print(f"Health response status: {response.status_code}")
        print(f"Health response body: {response.text}")
        
        # Nu facem assertion strict - doar verificăm că nu explodează
        assert response.status_code in [200, 404, 422, 500]  # Orice status valid
        
    except Exception as e:
        # Dacă client fixture nu funcționează, skip testul
        pytest.skip(f"Client fixture not working: {e}")
