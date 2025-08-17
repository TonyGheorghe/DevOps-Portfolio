# tests/test_debug_routes.py
from app.main import app

def test_list_routes():
    paths = [r.path for r in app.routes]
    print("\n📌 ROUTES:", paths)
    assert "/auth/login" in paths
    assert "/auth/me" in paths

