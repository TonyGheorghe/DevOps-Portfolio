import pytest
# test_imports.py - verifică toate importurile
def test_import(module_path, description):
    try:
        exec(f"import {module_path}")
        print(f"✅ {description}: {module_path}")
        assert True
    except Exception as e:
        print(f"❌ {description}: {module_path} - Error: {e}")
        assert False

def main():
    print("🔍 Testarea importurilor pentru Arhivare Web App")
    print("=" * 60)
    
    # Test basic imports
    test_import("app", "Basic app module")
    test_import("app.core.config", "Config module")
    test_import("app.db.session", "Database session")
    
    # Test models
    test_import("app.models.base", "Base model")
    test_import("app.models.user", "User model") 
    test_import("app.models.fond", "Fond model")
    
    # Test schemas
    test_import("app.schemas.user", "User schemas")
    test_import("app.schemas.fond", "Fond schemas")
    
    # Test CRUD
    test_import("app.crud.user", "User CRUD")
    test_import("app.crud.fond", "Fond CRUD")
    
    # Test API modules
    test_import("app.api.auth", "Auth API")
    test_import("app.api.search", "Search API")
    test_import("app.api.routes.users", "Users routes")
    test_import("app.api.routes.fonds", "Fonds routes")
    
    print("\n" + "=" * 60)
    
    # Test specific functions
    print("\n🧪 Testarea funcțiilor specifice:")
    
    try:
        from app.schemas.fond import FondCreate, FondResponse
        print("✅ Fond schemas classes")
    except Exception as e:
        print(f"❌ Fond schemas: {e}")
    
    try:
        from app.crud.fond import create_fond, search_fonds
        print("✅ Fond CRUD functions")
    except Exception as e:
        print(f"❌ Fond CRUD: {e}")
    
    try:
        from app.api.search import router as search_router
        print(f"✅ Search router with {len(search_router.routes)} routes")
    except Exception as e:
        print(f"❌ Search router: {e}")
    
    try:
        from app.api.routes.fonds import router as fonds_router
        print(f"✅ Fonds router with {len(fonds_router.routes)} routes")
    except Exception as e:
        print(f"❌ Fonds router: {e}")

if __name__ == "__main__":
    main()

@pytest.fixture
def module_path():
    return "app.main"  # poți ajusta dacă testul vrea alt modul

@pytest.fixture
def description():
    return "main application module"

