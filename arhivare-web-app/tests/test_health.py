import pytest

async def test_health_endpoint(client):
    res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "ok"
    assert "version" in data

