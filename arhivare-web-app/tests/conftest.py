# tests/conftest.py - FIXED VERSION
import pytest
import asyncio
from typing import AsyncGenerator
import uuid

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond
from app.database import get_db
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
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# ======================================================
# DATABASE FIXTURES
# ======================================================
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
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def empty_db(db_session):
    """Provide an explicitly empty database."""
    # Clear all data (already handled by setup_test_db)
    return db_session

# ======================================================
# HTTP CLIENT FIXTURE - FIXED VERSION
# ======================================================
@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Provide HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        timeout=10.0
    ) as ac:
        yield ac

# ======================================================
# USER FIXTURES - FIXED TO AVOID DUPLICATES
# ======================================================
@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """Create unique admin user for each test."""
    unique_id = str(uuid.uuid4())[:8]
    admin = User(
        username=f"testadmin_{unique_id}",
        password_hash=get_password_hash("testpassword"),
        role="admin",
    )
    # Handle is_active if it exists
    if hasattr(admin, "is_active"):
        admin.is_active = True
    
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
        role="user",
    )
    # Handle is_active if it exists
    if hasattr(user, "is_active"):
        user.is_active = True
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# ======================================================
# FOND FIXTURES - UPDATED WITH REALISTIC DATA
# ======================================================
@pytest.fixture(scope="function")
def sample_fonds(db_session) -> list[Fond]:
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
            "active": False  # Explicite inactive
        }
    ]
    
    fonds = []
    for fd in fonds_data:
        # Extract active status separately
        active_status = fd.pop("active", True)
        
        fond = Fond(**fd)
        
        # Set active status
        if hasattr(fond, "active"):
            fond.active = active_status
        
        db_session.add(fond)
        fonds.append(fond)
    
    db_session.commit()
    
    # Refresh all objects to get IDs
    for f in fonds:
        db_session.refresh(f)
    
    return fonds

# ======================================================
# AUTH HELPERS - FIXED VERSION
# ======================================================
@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict[str, str]:
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
async def user_headers(client: AsyncClient, regular_user: User) -> dict[str, str]:
    """Provide authentication headers for regular user."""
    response = await client.post("/auth/login", json={
        "username": regular_user.username,
        "password": "testpassword",
    })
    
    if response.status_code != 200:
        pytest.fail(f"User login failed: {response.status_code} - {response.text}")
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ======================================================
# PYTEST CONFIGURATION
# ======================================================
pytest_plugins = ("pytest_asyncio",)

def pytest_configure(config):
    """Configure pytest for async testing."""
    config.option.asyncio_mode = "auto"

# Additional test utilities
@pytest.fixture
def debug_routes():
    """Debug helper to print all available routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(f"{route.methods if hasattr(route, 'methods') else 'ALL'} {route.path}")
    return routes
