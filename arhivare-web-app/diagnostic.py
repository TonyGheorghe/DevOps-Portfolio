#!/usr/bin/env python3
# diagnostic.py - Script pentru diagnosticarea problemelor cu testele

import sys
from pathlib import Path

def check_app_structure():
    """Check if the app structure is correct."""
    print("🔍 CHECKING APP STRUCTURE")
    print("=" * 50)
    
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        
        # List all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                methods = getattr(route, 'methods', {'GET'})
                routes.append(f"{list(methods)} {route.path}")
        
        print(f"\n📋 AVAILABLE ROUTES ({len(routes)}):")
        for route in sorted(routes):
            print(f"  {route}")
        
        # Check specific routes we need for tests
        route_paths = [r.path for r in app.routes if hasattr(r, 'path')]
        
        critical_routes = [
            "/health",
            "/auth/login",
            "/auth/protected", 
            "/search",
            "/search/count",
            "/fonds"
        ]
        
        print(f"\n🎯 CRITICAL ROUTES CHECK:")
        for route in critical_routes:
            if route in route_paths:
                print(f"  ✅ {route}")
            else:
                print(f"  ❌ {route} - MISSING!")
                # Check for variations
                variations = [r for r in route_paths if route.rstrip('/') in r or r.rstrip('/') in route]
                if variations:
                    print(f"    💡 Similar routes found: {variations}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to analyze app structure: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_models():
    """Check if models are properly configured."""
    print(f"\n🗄️ CHECKING MODELS")
    print("=" * 50)
    
    try:
        from app.models.user import User
        from app.models.fond import Fond
        
        print("✅ Models imported successfully")
        
        # Check User model structure
        print(f"\n👤 USER MODEL STRUCTURE:")
        user_attrs = [attr for attr in dir(User) if not attr.startswith('_')]
        for attr in user_attrs:
            if not callable(getattr(User, attr, None)):
                print(f"  - {attr}")
        
        # Check Fond model structure  
        print(f"\n🏢 FOND MODEL STRUCTURE:")
        fond_attrs = [attr for attr in dir(Fond) if not attr.startswith('_')]
        for attr in fond_attrs:
            if not callable(getattr(Fond, attr, None)):
                print(f"  - {attr}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to check models: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_database_connection():
    """Check if database setup works."""
    print(f"\n💾 CHECKING DATABASE")
    print("=" * 50)
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.models.base import Base
        
        # Create test database
        engine = create_engine("sqlite:///:memory:")
        print("✅ Test database engine created")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Test session
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        print("✅ Database session created")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_dependencies():
    """Check if all required packages are installed."""
    print(f"\n📦 CHECKING DEPENDENCIES")
    print("=" * 50)
    
    required_packages = [
        ("pytest", "pytest"),
        ("pytest-asyncio", "pytest_asyncio"),
        ("httpx", "httpx"),
        ("fastapi", "fastapi"),
        ("sqlalchemy", "sqlalchemy"),
        ("pydantic", "pydantic"),
        ("jose", "jose"),
        ("passlib", "passlib"),
    ]
    
    missing_packages = []
    
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"  ✅ {package_name}")
        except ImportError:
            print(f"  ❌ {package_name} - MISSING!")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n💡 Install missing packages:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_test_configuration():
    """Check pytest configuration."""
    print(f"\n🧪 CHECKING TEST CONFIGURATION")
    print("=" * 50)
    
    # Check pytest.ini
    pytest_ini = Path("pytest.ini")
    if pytest_ini.exists():
        print("✅ pytest.ini exists")
        content = pytest_ini.read_text()
        if "asyncio_mode = auto" in content:
            print("✅ asyncio_mode configured")
        else:
            print("❌ asyncio_mode not configured")
            return False
    else:
        print("❌ pytest.ini missing")
        return False
    
    # Check conftest.py
    conftest = Path("tests/conftest.py")
    if conftest.exists():
        print("✅ tests/conftest.py exists")
    else:
        print("❌ tests/conftest.py missing")
        return False
    
    return True

def run_simple_test():
    """Try to run a very simple test."""
    print(f"\n🚀 RUNNING SIMPLE TEST")
    print("=" * 50)
    
    try:
        # Import test modules to check for syntax errors
        from tests.conftest import client, admin_user
        print("✅ Test fixtures can be imported")
        
        # Try to import test modules
        import tests.test_health
        print("✅ test_health module imported")
        
        import tests.test_auth  
        print("✅ test_auth module imported")
        
        return True
        
    except Exception as e:
        print(f"❌ Simple test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def suggest_fixes(results):
    """Suggest specific fixes based on diagnostic results."""
    print(f"\n" + "=" * 60)
    print("💡 SUGGESTED FIXES")
    print("=" * 60)
    
    if not results["dependencies"]:
        print("\n1. INSTALL MISSING DEPENDENCIES:")
        print("   pip install pytest pytest-asyncio httpx")
        print("   pip install fastapi sqlalchemy pydantic")
        print("   pip install python-jose[cryptography] passlib[bcrypt]")
    
    if not results["models"]:
        print("\n2. FIX MODEL ISSUES:")
        print("   - Check that all models inherit from Base")
        print("   - Verify database column definitions")
        print("   - Ensure __tablename__ is set correctly")
    
    if not results["app_structure"]:
        print("\n3. FIX ROUTE ISSUES:")
        print("   - Check that all routers are properly included")
        print("   - Verify route prefixes and trailing slashes")
        print("   - Ensure endpoints are decorated correctly")
    
    if not results["database"]:
        print("\n4. FIX DATABASE ISSUES:")
        print("   - Check SQLAlchemy configuration")
        print("   - Verify model relationships")
        print("   - Check for circular imports")
    
    if not results["test_config"]:
        print("\n5. FIX TEST CONFIGURATION:")
        print("   - Update pytest.ini with asyncio_mode = auto")
        print("   - Fix conftest.py fixture definitions")
        print("   - Check pytest-asyncio version")
    
    print("\n6. COMMON FIXES FOR YOUR ERRORS:")
    print("   - AsyncClient issue: Update httpx version")
    print("   - 404 instead of 401: Check route definitions") 
    print("   - UNIQUE constraint: Use unique usernames in fixtures")
    print("   - Count mismatches: Check active/inactive fond filtering")

def main():
    """Run complete diagnostic."""
    print("🔧 ARHIVARE WEB APP - DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("app").exists():
        print("❌ Not in project root! Run from directory containing 'app/' folder")
        sys.exit(1)
    
    # Run all checks
    results = {
        "dependencies": check_dependencies(),
        "models": check_models(), 
        "app_structure": check_app_structure(),
        "database": check_database_connection(),
        "test_config": check_test_configuration(),
        "simple_test": run_simple_test()
    }
    
    # Print summary
    print(f"\n" + "=" * 60)
    print("📊 DIAGNOSTIC RESULTS")
    print("=" * 60)
    
    for check, status in results.items():
        emoji = "✅" if status else "❌"
        print(f"{emoji} {check.replace('_', ' ').title()}: {'PASS' if status else 'FAIL'}")
    
    # Suggest fixes
    suggest_fixes(results)
    
    # Final recommendation
    passed = sum(results.values())
    total = len(results)
    
    print(f"\n" + "=" * 60)
    
    if passed == total:
        print("🎉 ALL CHECKS PASSED!")
        print("   Your app structure looks good. Try running:")
        print("   python run_tests_simple.py")
    elif passed >= total - 2:
        print("⚠️  MOSTLY READY")
        print(f"   {passed}/{total} checks passed. Fix the issues above and retry.")
    else:
        print("🚨 MAJOR ISSUES FOUND")
        print(f"   Only {passed}/{total} checks passed. Address the critical issues first.")
    
    return passed == total

if __name__ == "__main__":
    main()
