
# minimal_test.py - Minimal test for debugging
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

@pytest.mark.asyncio
async def test_async_works():
    '''Test that pytest-asyncio is working.'''
    await asyncio.sleep(0.01)
    assert True

@pytest.mark.asyncio  
async def test_httpx_import():
    '''Test that httpx can be imported and used.'''
    # Test without app first
    async with AsyncClient(base_url="https://httpbin.org") as client:
        response = await client.get("/get")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_app_import():
    '''Test that our app can be imported.'''
    try:
        from app.main import app
        assert app is not None
        print(f"App type: {type(app)}")
    except Exception as e:
        pytest.fail(f"Cannot import app: {e}")

@pytest.mark.asyncio
async def test_asgi_transport():
    '''Test ASGI transport with our app.'''
    try:
        from app.main import app
        transport = ASGITransport(app=app)
        
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Try the simplest endpoint
            response = await client.get("/health")
            print(f"Health check status: {response.status_code}")
            print(f"Health check response: {response.text}")
            
            # Don't assert success - just check it doesn't crash
            assert response.status_code in [200, 404, 422]
            
    except Exception as e:
        pytest.fail(f"ASGI transport failed: {e}")
