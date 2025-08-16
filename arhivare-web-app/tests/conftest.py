import pytest
import asyncio

from httpx import AsyncClient
from httpx import ASGITransport

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.db.session import get_db

# 🔹 Creăm o bază de date SQLite in-memory pentru teste
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)

# 🔹 Override DB pentru teste
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# 🔹 Creăm toate tabelele
Base.metadata.create_all(bind=engine)


# ======================================================
# FIXTURES
# ======================================================

# 👇 Event loop pentru testele async
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


# 👇 Client async pentru API
@pytest.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c



# 👇 DB session per test (izolat)
@pytest.fixture(scope="function")
async def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    # Creează un user admin dummy
    user = User(
        username="admin",
        password="admin",   # dacă modelul are hashing, ajustează după caz
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Generează un JWT
    payload = {"sub": user.username}
    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    yield encoded_jwt
    session.close()
    transaction.rollback()
    connection.close()

