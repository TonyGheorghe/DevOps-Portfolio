# complete_debug_test.py
"""
Script complet pentru debug-ul aplicației Arhivare Web App
Identifică și rezolvă problemele cu search endpoint-urile
"""

import sys
import traceback
from pathlib import Path

def test_imports():
    """Testează toate importurile critice"""
    print("🔍 Testing critical imports...")
    print("-" * 40)
    
    import_tests = [
        ("app.core.config", "Settings configuration"),
        ("app.db.session", "Database session"),
        ("app.models.base", "Base model"),
        ("app.models.user", "User model"),
        ("app.models.fond", "Fond model"),
        ("app.schemas.fond", "Fond schemas"),
        ("app.crud.fond", "Fond CRUD operations"),
        ("app.api.search", "Search API router"),
        ("app.api.auth", "Auth API router"),
        ("app.api.routes.fonds", "Fonds routes"),
        ("app.main", "Main FastAPI app")
    ]
    
    results = {}
    for module, description in import_tests:
        try:
            __import__(module)
            print(f"✅ {description}")
            results[module] = "OK"
        except Exception as e:
            print(f"❌ {description}: {e}")
            results[module] = str(e)
    
    assert all(v == "OK" for v in results.values()), f"Import errors: {results}"

def test_database_connection():
    """Testează conexiunea la baza de date"""
    print("\n🗄️  Testing database connection...")
    print("-" * 40)
    
    try:
        from app.db.session import SessionLocal, engine
        from app.models.fond import Fond
        
        # Test conexiune
        db = SessionLocal()
        
        # Test query simplu
        count = db.query(Fond).count()
        print(f"✅ Database connection OK")
        print(f"✅ Total fonds in database: {count}")
        
        if count == 0:
            print("⚠️  Database is empty - consider running populate_sample_fonds.py")
        
        # Test search query
        active_fonds = db.query(Fond).filter(Fond.active == True).limit(3).all()
        print(f"✅ Active fonds: {len(active_fonds)}")
        
        for fond in active_fonds[:2]:  # Show first 2
            print(f"   - {fond.company_name}")
        
        db.close()
        assert db_ok is True, "Database connection failed"
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Make sure PostgreSQL is running and database exists")
        traceback.print_exc()
        assert False

def test_crud_operations():
    """Testează operațiunile CRUD direct"""
    print("\n🔧 Testing CRUD operations...")
    print("-" * 40)
    
    try:
        from app.db.session import SessionLocal
        from app.crud.fond import search_fonds, get_fonds_count
        
        db = SessionLocal()
        
        # Test search
        results = search_fonds(db, "test", skip=0, limit=5)
        print(f"✅ CRUD search_fonds works: found {len(results)} results")
        
        # Test count
        count = get_fonds_count(db, active_only=True)
        print(f"✅ CRUD get_fonds_count works: {count} active fonds")
        
        db.close()
        assert crud_ok is True, "CRUD operations failed"
        
    except Exception as e:
        print(f"❌ CRUD operations failed: {e}")
        traceback.print_exc()
        assert False

def test_schema_serialization():
    """Testează serializarea Pydantic"""
    print("\n📋 Testing Pydantic serialization...")
    print("-" * 40)
    
    try:
        from app.db.session import SessionLocal
        from app.models.fond import Fond
        from app.schemas.fond import FondResponse
        
        db = SessionLocal()
        fond = db.query(Fond).first()
        
        if fond:
            # Test serialization
            serialized = FondResponse.model_validate(fond)
            print(f"✅ Pydantic serialization works")
            print(f"   Company: {serialized.company_name}")
            print(f"   Holder: {serialized.holder_name}")
            
            # Test JSON conversion
            json_data = serialized.model_dump()
            print(f"✅ JSON serialization works: {len(json_data)} fields")
        else:
            print("⚠️  No fonds in database to test serialization")
        
        db.close()
        assert None

    except Exception as e:
        print(f"X Schema serialization failed: {e}")
        traceback.print_exc()
        assert None

def check_file_issues():
    """Verifică probleme cu fișierele"""
    print("\n📁 Checking file structure issues...")
    print("-" * 40)
    
    # Check for problematic files
    api_main_path = Path("app/api/main.py")
    if api_main_path.exists():
        with open(api_main_path, 'r') as f:
            content = f.read().strip()
            if content and "app.include_router" in content:
                print("⚠️  app/api/main.py contains router registration")
                print("   This might cause conflicts with app/main.py")
                print("   Consider emptying this file")
    
    # Check __init__.py files
    init_files = [
        "app/__init__.py",
        "app/api/__init__.py", 
        "app/api/routes/__init__.py",
        "app/crud/__init__.py",
        "app/models/__init__.py"
    ]
    
    for file_path in init_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} exists")
        else:
            print(f"⚠️  {file_path} missing")
    
    return True

def fix_common_issues():
    """Încearcă să repare probleme comune"""
    print("\n🔨 Attempting to fix common issues...")
    print("-" * 40)
    
    # 1. Clear problematic app/api/main.py
    api_main_path = Path("app/api/main.py")
    if api_main_path.exists():
        try:
            with open(api_main_path, 'w') as f:
                f.write("# This file is intentionally empty to avoid router conflicts\n")
            print("✅ Cleared app/api/main.py")
        except Exception as e:
            print(f"❌ Could not clear app/api/main.py: {e}")
    
    return True
