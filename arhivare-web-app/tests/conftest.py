# tests/conftest.py
import pytest
import asyncio
import uuid
from typing import Generator, AsyncGenerator
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
# FIX ENV VARS pentru Settings
# ======================================================
import os
@pytest.fixture(scope="session", autouse=True)
def test_env_vars(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("JWT_SECRET", "testsecret")
    monkeypatch.setenv("ADMIN_USERNAME", "testadmin")
    monkeypatch.setenv("ADMIN_PASSWORD", "testpassword")


# ======================================================
# DATABASE SETUP - SQLite in-memory
# ======================================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Enable foreign key support
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


# ======================================================
# PYTEST CONFIG
# ======================================================
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
def create_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session() -> Generator:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
        session.commit()
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ======================================================
# HTTP CLIENT
# ======================================================
@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        base_url="http://testserver",
        transport=ASGITransport(app=app),
    ) as ac:
        yield ac


# ======================================================
# USER FIXTURES (username random pt. UNIQUE)
# ======================================================
@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    admin = User(
        username=f"admin_{uuid.uuid4().hex[:6]}",
        password_hash=get_password_hash("testpassword"),
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    user = User(
        username=f"user_{uuid.uuid4().hex[:6]}",
        password_hash=get_password_hash("testpassword"),
        role="user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ======================================================
# AUTH FIXTURES
# ======================================================
@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict[str, str]:
    login_data = {"username": admin_user.username, "password": "testpassword"}
    response = await client.post("/auth/login", json=login_data)
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def user_headers(client: AsyncClient, regular_user: User) -> dict[str, str]:
    login_data = {"username": regular_user.username, "password": "testpassword"}
    response = await client.post("/auth/login", json=login_data)
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ======================================================
# UTILS
# ======================================================
pytest_plugins = ("pytest_asyncio",)

def pytest_configure(config):
    config.option.asyncio_mode = "auto"

