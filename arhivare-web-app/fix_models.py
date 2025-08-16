#!/usr/bin/env python3
# fix_models.py - Debug și fix pentru problemele cu modelele

import sys
from pathlib import Path

def check_model_imports():
    """Check if we can import models and see their structure."""
    print("🔍 CHECKING MODEL IMPORTS AND STRUCTURE")
    print("=" * 60)
    
    try:
        # Test basic imports
        from app.models.user import User
        from app.models.fond import Fond
        from app.models.base import Base
        print("✅ Models imported successfully")
        
        # Check User model structure
        print("\n👤 USER MODEL:")
        print("-" * 30)
        
        # Check if User has id column
        if hasattr(User, 'id'):
            user_id = User.id
            print(f"✅ User.id exists: {user_id}")
            if hasattr(user_id, 'autoincrement'):
                print(f"   Autoincrement: {user_id.autoincrement}")
            if hasattr(user_id, 'primary_key'):
                print(f"   Primary key: {user_id.primary_key}")
        else:
            print("❌ User model missing 'id' column!")
            return False
        
        # Test User creation
        try:
            from app.core.security import get_password_hash
            test_user = User(
                username="test_user_debug",
                password_hash=get_password_hash("test123"),
                role="user"
            )
            print("✅ User creation works (basic fields)")
            
            # Check if is_active exists
            if hasattr(test_user, 'is_active'):
                print("✅ User has is_active attribute")
                try:
                    test_user.is_active = True
                    print("✅ Can set is_active manually")
                except Exception as e:
                    print(f"❌ Cannot set is_active: {e}")
            else:
                print("⚠️  User does not have is_active attribute")
                
        except Exception as e:
            print(f"❌ User creation failed: {e}")
            return False
        
        # Check Fond model structure  
        print("\n🏢 FOND MODEL:")
        print("-" * 30)
        
        if hasattr(Fond, 'id'):
            fond_id = Fond.id
            print(f"✅ Fond.id exists: {fond_id}")
            if hasattr(fond_id, 'autoincrement'):
                print(f"   Autoincrement: {fond_id.autoincrement}")
        else:
            print("❌ Fond model missing 'id' column!")
            return False
        
        # Test Fond creation
        try:
            test_fond = Fond(
                company_name="Test Company Debug",
                holder_name="Test Holder Debug", 
                address="Test Address Debug"
            )
            print("✅ Fond creation works (basic fields)")
            
            # Check if active exists
            if hasattr(test_fond, 'active'):
                print("✅ Fond has active attribute")
                try:
                    test_fond.active = True
                    print("✅ Can set active manually")
                except Exception as e:
                    print(f"❌ Cannot set active: {e}")
            else:
                print("⚠️  Fond does not have active attribute")
                
        except Exception as e:
            print(f"❌ Fond creation failed: {e}")
            return False
        
        return True
        
    except ImportError as e:
        print(f"❌ Cannot import models: {e}")
        print("   Make sure you're in the project root directory")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_database_setup():
    """Check database configuration for tests."""
    print("\n🗄️  CHECKING DATABASE SETUP")
    print("=" * 60)
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.models.base import Base
        
        # Create test database
        engine = create_engine("sqlite:///./test_debug.db", echo=True)
        
        print("✅ Test database engine created")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Test session
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        print("✅ Database session created")
        
        # Clean up
        session.close()
        Path("test_debug.db").unlink(missing_ok=True)
        
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_fastapi_app():
    """Test if FastAPI app can be imported and basic structure works."""
    print("\n🚀 CHECKING FASTAPI APP")
    print("=" * 60)
    
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        
        # Check if app has routes
        routes = [route.path for route in app.routes]
        print(f"✅ App has {len(routes)} routes")
        
        key_routes = ["/health", "/auth/login", "/fonds", "/search"]
        for route in key_routes:
            if any(route in r for r in routes):
                print(f"✅ Route {route} found")
            else:
                print(f"⚠️  Route {route} not found")
        
        return True
        
    except Exception as e:
        print(f"❌ FastAPI app check failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def suggest_fixes():
    """Suggest specific fixes based on findings."""
    print("\n" + "=" * 60)
    print("💡 SUGGESTED FIXES")
    print("=" * 60)
    
    print("\n1. Pentru pytest-asyncio:")
    print("   pip install pytest-asyncio==0.21.0")
    print("   Verifică că pytest.ini conține: asyncio_mode = auto")
    
    print("\n2. Pentru AsyncClient errors:")
    print("   Folosește async with AsyncClient(base_url='http://testserver') as client:")
    print("   Nu folosi app= parameter direct")
    
    print("\n3. Pentru modele cu ID problems:")
    print("   Verifică că modelele au:")
    print("   - id = Column(Integer, primary_key=True, autoincrement=True)")
    print("   - Proper foreign key constraints")
    
    print("\n4. Pentru rularea testelor:")
    print("   python run_tests_simple.py  # Pentru debugging pas cu pas")
    print("   pytest tests/test_health.py -v  # Pentru test simplu")
    print("   pytest tests/ --collect-only  # Pentru a vedea ce teste sunt găsite")
    
    print("\n5. Pentru curățarea testelor vechi:")
    print("   python cleanup_old_tests.py")
    print("   sau manual: mv tests/backup_old/ ./old_tests_backup/")

def main():
    """Main debugging function."""
    print("🔧 ARHIVARE WEB APP - MODEL DEBUG & FIX")
    print("=" * 60)
    
    success = True
    
    # Check if we're in the right directory
    if not Path("app").exists():
        print("❌ Not in project root! Run from directory containing 'app/' folder")
        sys.exit(1)
    
    # Run checks
    if not check_model_imports():
        success = False
    
    if not check_database_setup():
        success = False
    
    if not test_fastapi_app():
        success = False
    
    # Always show suggestions
    suggest_fixes()
    
    if success:
        print(f"\n🎉 ALL CHECKS PASSED!")
        print("   Models look good. Try running tests now:")
        print("   python run_tests_simple.py")
    else:
        print(f"\n🚨 SOME CHECKS FAILED!")
        print("   Fix the issues above before running tests")
    
    return success

if __name__ == "__main__":
    main()
