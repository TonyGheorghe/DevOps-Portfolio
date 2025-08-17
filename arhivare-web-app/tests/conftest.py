# tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond
from app.db.session import get_db
from app.core.security import get_password_hash

# ======================================================
# DATABASE SETUP - SQLite in-memory cu FK activ
# ======================================================
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# ======================================================
# DB OVERRIDE
# ======================================================
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# ======================================================
# EVENT LOOP (pytest-asyncio)
# ======================================================
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# ======================================================
# DATABASE FIXTURES
# ======================================================
@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

# ======================================================
# HTTP CLIENT FIXTURE
# ======================================================
@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as ac:
        yield ac

# ======================================================
# USER FIXTURES
# ======================================================
@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    admin = User(
        username="testadmin",
        password_hash=get_password_hash("testpassword"),
        role="admin",
    )
    if hasattr(admin, "is_active"):
        admin.is_active = True
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    user = User(
        username="testuser",
        password_hash=get_password_hash("testpassword"),
        role="user",
    )
    if hasattr(user, "is_active"):
        user.is_active = True
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# ======================================================
# FOND FIXTURES
# ======================================================
@pytest.fixture(scope="function")
def sample_fonds(db_session) -> list[Fond]:
    fonds_data = [
        {"company_name": "Tractorul Brașov SA", "holder_name": "Turbonium SRL", "address": "Str. Industriei 15"},
        {"company_name": "Inactive Company SRL", "holder_name": "Arhiva Inactivă", "address": "Str. Închisă 1"},
    ]
    fonds = []
    for fd in fonds_data:
        fond = Fond(**fd)
        if hasattr(fond, "active"):
            fond.active = "Inactive" not in fd["company_name"]
        db_session.add(fond)
        fonds.append(fond)
    db_session.commit()
    for f in fonds:
        db_session.refresh(f)
    return fonds

# ======================================================
# AUTH HEADERS
# ======================================================
@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict[str, str]:
    response = await client.post("/auth/login", json={
        "username": admin_user.username,
        "password": "testpassword",
    })
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def user_headers(client: AsyncClient, regular_user: User) -> dict[str, str]:
    response = await client.post("/auth/login", json={
        "username": regular_user.username,
        "password": "testpassword",
    })
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ======================================================
pytest_plugins = ("pytest_asyncio",)
def pytest_configure(config):
    config.option.asyncio_mode = "auto"

