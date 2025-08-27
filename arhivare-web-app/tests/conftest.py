# tests/conftest.py - FINAL WORKING VERSION
import pytest
import asyncio
from typing import AsyncGenerator
import uuid

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.models.fond import Fond
from app.core.security import get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

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

# Override database dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Event loop fixture
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# Database fixtures
@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """Setup fresh database for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up after each test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test."""
    session = TestingSessionLocal()
    try:
        # Test session with proper SQLAlchemy 2.0 syntax
        session.execute(text("SELECT 1"))
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def empty_db(db_session):
    """Provide an explicitly empty database."""
    return db_session

# HTTP Client fixture - FIXED VERSION
@pytest.fixture(scope="function")
async def client() -> AsyncClient:
    """Provide HTTP client for testing - RETURNS CLIENT DIRECTLY, NOT GENERATOR."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        timeout=30.0
    ) as ac:
        yield ac

# User fixtures
@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """Create unique admin user for each test."""
    unique_id = str(uuid.uuid4())[:8]
    admin = User(
        username=f"testadmin_{unique_id}",
        password_hash=get_password_hash("testpassword"),
        role="admin",
    )
    
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    """Create unique regular user for each test."""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"testuser_{unique_id}",
        password_hash=get_password_hash("testpassword"),
        role="client",
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# Sample data fixtures
@pytest.fixture(scope="function")
def sample_fonds(db_session):
    """Create sample fonds with realistic Romanian company data."""
    fonds_data = [
        {
            "company_name": "Tractorul Brașov SA",
            "holder_name": "Arhiva Națională Brașov",
            "address": "Str. Industriei 15, Brașov",
            "email": "contact@arhiva-brasov.ro",
            "phone": "+40 268 123 456"
        },
        {
            "company_name": "Steagul Roșu Brașov SA", 
            "holder_name": "Muzeul Județean Brașov",
            "address": "Piața Sfatului 30, Brașov",
            "email": "arhiva@muzeul-brasov.ro",
            "phone": "+40 268 789 012"
        },
        {
            "company_name": "Fabrica de Textile Cluj SRL",
            "holder_name": "Arhiva de Stat Cluj",
            "address": "Str. Memorandumului 21, Cluj-Napoca", 
            "email": "textile@arhiva-cluj.ro",
            "phone": "+40 264 555 777"
        },
        {
            "company_name": "Inactive Company SRL",
            "holder_name": "Arhiva Inactivă",
            "address": "Str. Închisă 1",
            "email": "inactive@example.com",
            "phone": None,
            "active": False
        }
    ]
    
    fonds = []
    for fd in fonds_data:
        active_status = fd.pop("active", True)
        fond = Fond(**fd)
        fond.active = active_status
        
        db_session.add(fond)
        fonds.append(fond)
    
    db_session.commit()
    
    for f in fonds:
        db_session.refresh(f)
    
    return fonds

# Auth fixtures
@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict:
    """Provide authentication headers for admin user."""
    response = await client.post("/auth/login", json={
        "username": admin_user.username,
        "password": "testpassword",
    })
    
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.status_code} - {response.text}")
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def user_headers(client: AsyncClient, regular_user: User) -> dict:
    """Provide authentication headers for regular user."""
    response = await client.post("/auth/login", json={
        "username": regular_user.username,
        "password": "testpassword",
    })
    
    if response.status_code != 200:
        pytest.fail(f"User login failed: {response.status_code} - {response.text}")
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# Debug utility
@pytest.fixture
def debug_routes():
    """Debug helper to print all available routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = getattr(route, 'methods', {'ALL'})
            routes.append(f"{methods} {route.path}")
    return routes
