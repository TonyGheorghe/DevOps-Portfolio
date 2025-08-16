import pytest

from app.models.fond import Fond
from app.models.user import User

async def test_search_empty_query_400(client):
    r = await client.get("/search")
    assert r.status_code in (400, 422)  # depinde cum ai validarea

async def test_search_returns_results(client, db_session):
    db_session.add_all([
        Fond(company_name="Tractorul Brașov SA", holder_name="Turbonium SRL", active=True),
        Fond(company_name="Altă Companie", holder_name="Alt Holder", active=True),
    ])
    db_session.commit()
    r = await client.get("/search", params={"query": "brașov", "limit": 10})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any("Tractorul" in (row.get("company_name") or "") for row in data)

async def test_search_count(client, db_session):
    r = await client.get("/search/count", params={"query": "brașov"})
    assert r.status_code == 200
    body = r.json()
    assert "total_results" in body

