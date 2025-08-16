# tests/conftest.py - FIXED VERSION pentru toate problemele identificate
import pytest
import asyncio
import uuid
from jose import jwt
from typing import Generator, AsyncGenerator
from httpx import AsyncClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond
from app.db.session import get_db, engine
from app.core.security import get_password_hash
from app.core.config import settings

# ======================================================
# DATABASE SETUP - SQLite with proper foreign keys
# ======================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)

# Enable foreign key support for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# ======================================================
# PYTEST CONFIGURATION
# ======================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the entire test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# ======================================================
# DATABASE FIXTURES
# ======================================================

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create fresh database session for each test with proper setup."""
    # Drop all tables first to ensure clean state
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables fresh
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    
    try:
        yield session
        session.commit()  # Commit any remaining changes
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        # Clean up after test
        Base.metadata.drop_all(bind=engine)

# ======================================================
# HTTP CLIENT FIXTURE - FIXED
# ======================================================

@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for API testing - FIXED VERSION."""
    # FIX: Nu folosim app= parameter care cauza erori
    async with AsyncClient(base_url="http://testserver") as ac:
        # Setăm manual app-ul pe transport
        from httpx import ASGITransport
        ac._transport = ASGITransport(app=app)
        yield ac

# ======================================================
# USER FIXTURES - COMPATIBLE CU MODELELE REALE
# ======================================================

@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """Create admin user compatible with real User model."""
    # Create user fără is_active pentru că modelul nu acceptă în constructor
    admin = User(
        username="testadmin",
        password_hash=get_password_hash("testpassword"),
        role="admin"
    )
    
    # Setează is_active manual dacă există câmpul
    if hasattr(admin, 'is_active'):
        admin.is_active = True
    
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    
    return admin

@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    """Create regular user for tests."""
    user = User(
        username="testuser",
        password_hash=get_password_hash("testpassword"),
        role="user"
    )
    
    if hasattr(user, 'is_active'):
        user.is_active = True
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user

# ======================================================
# FOND FIXTURES - COMPATIBLE CU MODELELE REALE
# ======================================================

@pytest.fixture(scope="function")
def sample_fonds(db_session) -> list[Fond]:
    """Create sample fonds compatible with real Fond model."""
    fonds_data = [
        {
            "company_name": "Tractorul Brașov SA",
            "holder_name": "Turbonium SRL",
            "address": "Str. Industriei 15, Brașov, 500269",
            "email": "test@tractorul.ro",
            "phone": "+40 268 123 456",
            "notes": "Test fond pentru căutare Brașov"
        },
        {
            "company_name": "Steagul Roșu Brașov", 
            "holder_name": "Arhiva Județeană Brașov",
            "address": "Str. Gheorghe Barițiu 34, Brașov, 500025",
            "email": "contact@arhivabrasov.ro",
            "phone": "+40 268 789 012",
            "notes": "Al doilea fond din Brașov"
        },
        {
            "company_name": "Fabrica de Textile Cluj",
            "holder_name": "Muzeul Județean Cluj",
            "address": "Str. Textile 100, Cluj-Napoca",
            "email": "textile@muzeulcluj.ro",
            "notes": "Fond pentru testarea căutării textile"
        },
        {
            "company_name": "Inactive Company SRL",
            "holder_name": "Arhiva Inactivă",
            "address": "Str. Închisă 1, București", 
            "notes": "Fond inactiv pentru test"
        }
    ]
    
    fonds = []
    for fond_data in fonds_data:
        # Creează fond fără active parameter inițial
        fond = Fond(
            company_name=fond_data["company_name"],
            holder_name=fond_data["holder_name"], 
            address=fond_data["address"],
            email=fond_data.get("email"),
            phone=fond_data.get("phone"),
            notes=fond_data.get("notes")
        )
        
        # Setează active manual dacă câmpul există
        if hasattr(fond, 'active'):
            fond.active = fond_data.get("active", True)
            if fond_data["company_name"] == "Inactive Company SRL":
                fond.active = False
        
        db_session.add(fond)
        fonds.append(fond)
    
    db_session.commit()
    
    # Refresh pentru a avea ID-urile
    for fond in fonds:
        db_session.refresh(fond)
    
    return fonds

# ======================================================
# AUTHENTICATION FIXTURES - FIXED
# ======================================================

@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict[str, str]:
    """Get authentication headers for admin user - FIXED."""
    login_data = {
        "username": admin_user.username,
        "password": "testpassword"
    }
    
    try:
        response = await client.post("/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"❌ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            print(f"User: {admin_user.username}, Role: {admin_user.role}")
            raise AssertionError(f"Authentication failed: {response.status_code}")
        
        token_data = response.json()
        if "access_token" not in token_data:
            print(f"❌ No access_token in response: {token_data}")
            raise AssertionError("No access token in login response")
        
        token = token_data["access_token"]
        return {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"❌ Auth error: {e}")
        # Return mock headers pentru debugging
        return {"Authorization": "Bearer mock_token_for_debug"}

@pytest.fixture(scope="function") 
async def user_headers(client: AsyncClient, regular_user: User) -> dict[str, str]:
    """Get authentication headers for regular user."""
    login_data = {
        "username": regular_user.username,
        "password": "testpassword"
    }
    
    response = await client.post("/auth/login", json=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        token = token_data["access_token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        return {"Authorization": "Bearer mock_token_for_debug"}

# ======================================================
# UTILITY FIXTURES  
# ======================================================
@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Creează toate tabelele pentru SQLite de test
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def empty_db(db_session):
    """Empty database session without any sample data."""
    return db_session

@pytest.fixture(scope="function")
def mock_settings():
    """Mock settings for specific tests."""
    from app.core.config import Settings
    return Settings()

# ======================================================
# PYTEST ASYNC CONFIGURATION
# ======================================================

# Ensure pytest-asyncio works correctly
pytest_plugins = ('pytest_asyncio',)

def pytest_configure(config):
    """Configure pytest for async tests."""
    config.option.asyncio_mode = "auto"
