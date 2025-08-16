# tests/conftest.py - FINAL VERSION bazată pe structura reală a modelelor
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond
from app.db.session import get_db
from app.core.security import get_password_hash

# 🔹 Test database configuration - folosim SQLite in-memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
    echo=False  # Set la True pentru debug SQL
)

TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# 🔹 Override database dependency pentru teste
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# ======================================================
# PYTEST FIXTURES - compatibile cu modelele reale
# ======================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create fresh database session for each test."""
    # Create all tables fresh pentru fiecare test
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        # Clean up după test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for API testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """Create admin user compatible cu modelul real User."""
    # User nu acceptă is_active în constructor și nu are câmpul is_active
    admin = User(
        username="testadmin",
        password_hash=get_password_hash("testpassword"),
        role="admin"
    )
    
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
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user

@pytest.fixture(scope="function")
def sample_fonds(db_session) -> list[Fond]:
    """Create sample fonds compatible cu modelul real Fond."""
    fonds_data = [
        {
            "company_name": "Tractorul Brașov SA",
            "holder_name": "Turbonium SRL",
            "address": "Str. Industriei 15, Brașov, 500269",
            "email": "test@tractorul.ro",
            "phone": "+40 268 123 456",
            "notes": "Test fond pentru căutare Brașov",
            "active": True
        },
        {
            "company_name": "Steagul Roșu Brașov", 
            "holder_name": "Arhiva Județeană Brașov",
            "address": "Str. Gheorghe Barițiu 34, Brașov, 500025",
            "email": "contact@arhivabrasov.ro",
            "phone": "+40 268 789 012",
            "notes": "Al doilea fond din Brașov",
            "active": True
        },
        {
            "company_name": "Fabrica de Textile Cluj",
            "holder_name": "Muzeul Județean Cluj",
            "address": "Str. Textile 100, Cluj-Napoca",
            "email": "textile@muzeulcluj.ro",
            "notes": "Fond pentru testarea căutării textile",
            "active": True
        },
        {
            "company_name": "Inactive Company SRL",
            "holder_name": "Arhiva Inactivă",
            "address": "Str. Închisă 1, București", 
            "notes": "Fond inactiv pentru test",
            "active": False  # Acest fond e inactiv
        }
    ]
    
    fonds = []
    for fond_data in fonds_data:
        # Fond acceptă active=True/False în constructor
        fond = Fond(**fond_data)
        db_session.add(fond)
        fonds.append(fond)
    
    db_session.commit()
    
    # Refresh pentru a avea ID-urile
    for fond in fonds:
        db_session.refresh(fond)
    
    return fonds

@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, admin_user: User) -> dict[str, str]:
    """Get authentication headers for admin user."""
    login_data = {
        "username": admin_user.username,
        "password": "testpassword"
    }
    
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

@pytest.fixture(scope="function") 
async def user_headers(client: AsyncClient, regular_user: User) -> dict[str, str]:
    """Get authentication headers for regular user."""
    login_data = {
        "username": regular_user.username,
        "password": "testpassword"
    }
    
    response = await client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    
    token_data = response.json()
    token = token_data["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

# ======================================================
# UTILITY FIXTURES  
# ======================================================

@pytest.fixture(scope="function")
def empty_db(db_session):
    """Empty database session without any sample data."""
    return db_session

@pytest.fixture(scope="function")
def mock_settings():
    """Mock settings pentru teste specific."""
    from app.core.config import Settings
    return Settings()
