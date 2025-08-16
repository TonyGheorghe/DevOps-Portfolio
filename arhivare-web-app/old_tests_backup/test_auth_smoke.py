import json
import pytest

async def test_auth_login_contract_fields_present(client):
    res = await client.post("/auth/login", data=json.dumps({}), headers={"Content-Type": "application/json"})
    assert res.status_code in (400, 401, 422)

