# app/database.py - CONFIGURAȚIE UNIFICATĂ (înlocuiește și database.py și db/session.py)
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=5,
    max_overflow=10
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Alternative function for direct database access
def get_db_session():
    """Get database session for direct access (not as dependency)"""
    return SessionLocal()

# Create tables function
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

# Drop tables function (for development/testing)
def drop_tables():
    """Drop all database tables - USE WITH CAUTION!"""
    Base.metadata.drop_all(bind=engine)

