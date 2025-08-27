"""Debug test to understand database issues."""
import pytest
from sqlalchemy import create_engine, inspect

def test_debug_database_tables():
    """Debug what tables are available."""
    try:
        from app.database import Base
        from app.models.user import User
        from app.models.fond import Fond
        
        print(f"\nDEBUG: Base.metadata.tables.keys(): {list(Base.metadata.tables.keys())}")
        
        # Create test engine
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine)
        
        # Check what was created
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"DEBUG: Created tables: {tables}")
        
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"DEBUG: {table} columns: {[col['name'] for col in columns]}")
        
        assert len(tables) > 0, "No tables were created"
        assert "users" in tables, "users table not created"
        assert "fonds" in tables, "fonds table not created"
        
    except Exception as e:
        print(f"DEBUG: Error in database test: {e}")
        import traceback
        traceback.print_exc()
        raise

def test_debug_imports():
    """Debug import issues."""
    try:
        from app.main import app
        print(f"DEBUG: App imported: {type(app)}")
        
        from app.models.user import User
        print(f"DEBUG: User model: {User}")
        
        from app.models.fond import Fond  
        print(f"DEBUG: Fond model: {Fond}")
        
        from app.database import Base
        print(f"DEBUG: Base: {Base}")
        print(f"DEBUG: Base registry: {Base.registry._class_registry.keys()}")
        
    except Exception as e:
        print(f"DEBUG: Import error: {e}")
        import traceback
        traceback.print_exc()
        raise

@pytest.mark.asyncio
async def test_debug_app_startup():
    """Debug app startup issues."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            timeout=10.0
        ) as client:
            
            # Try various endpoints
            endpoints = ["/health", "/", "/docs"]
            
            for endpoint in endpoints:
                try:
                    response = await client.get(endpoint)
                    print(f"DEBUG: {endpoint} -> {response.status_code}")
                    if response.status_code not in [404]:
                        print(f"DEBUG: {endpoint} response: {response.text[:200]}")
                except Exception as e:
                    print(f"DEBUG: {endpoint} error: {e}")
            
            # The test always passes - it's just for debugging
            assert True
            
    except Exception as e:
        print(f"DEBUG: App startup error: {e}")
        import traceback
        traceback.print_exc()
        raise
