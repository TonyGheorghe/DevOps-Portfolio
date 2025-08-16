from app.models.user import User
from app.core.security import get_password_hash

def test_login_success(client, db_session):
    # arrange
    u = User(username="admin", password_hash=get_password_hash("admin123"), role="admin")
    db_session.add(u); db_session.commit()
    # act
    r = client.post("/auth/login", json={"username":"admin", "password":"admin123"})
    # assert
    assert r.status_code == 200
    assert "access_token" in r.json()

