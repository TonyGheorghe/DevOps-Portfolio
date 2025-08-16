#!/usr/bin/env python3
# debug_models.py - Verifică structura modelelor pentru a repara testele

import inspect
from pathlib import Path

def check_model_structure():
    """Check the actual structure of User and Fond models."""
    try:
        from app.models.user import User
        from app.models.fond import Fond
        
        print("🔍 VERIFICARE STRUCTURĂ MODELE")
        print("=" * 60)
        
        # Check User model
        print("\n👤 USER MODEL:")
        print("-" * 30)
        user_attrs = dir(User)
        user_columns = [attr for attr in user_attrs if not attr.startswith('_')]
        
        print("Atribute disponibile:")
        for attr in sorted(user_columns):
            if hasattr(User, attr):
                attr_obj = getattr(User, attr)
                if hasattr(attr_obj, 'type'):  # SQLAlchemy column
                    print(f"  - {attr}: {attr_obj.type}")
                elif not callable(attr_obj):
                    print(f"  - {attr}: (property)")
        
        # Test User creation
        print("\n🧪 Test User creation:")
        try:
            user = User(username="test", password_hash="hash", role="admin", is_active=True)
            print("  ✅ User acceptă is_active=True")
        except TypeError as e:
            print(f"  ❌ User NU acceptă is_active: {e}")
            try:
                user = User(username="test", password_hash="hash", role="admin")
                print("  ✅ User funcționează fără is_active")
                if hasattr(user, 'is_active'):
                    print("  ℹ️  dar are atributul is_active (poate fi setat manual)")
                else:
                    print("  ❌ User nu are deloc atributul is_active")
            except Exception as e2:
                print(f"  ❌ User creation failed completely: {e2}")
        
        # Check Fond model  
        print("\n🏢 FOND MODEL:")
        print("-" * 30)
        fond_attrs = dir(Fond)
        fond_columns = [attr for attr in fond_attrs if not attr.startswith('_')]
        
        print("Atribute disponibile:")
        for attr in sorted(fond_columns):
            if hasattr(Fond, attr):
                attr_obj = getattr(Fond, attr)
                if hasattr(attr_obj, 'type'):  # SQLAlchemy column
                    print(f"  - {attr}: {attr_obj.type}")
                elif not callable(attr_obj):
                    print(f"  - {attr}: (property)")
        
        # Test Fond creation
        print("\n🧪 Test Fond creation:")
        try:
            fond = Fond(company_name="Test", holder_name="Test", address="Test", active=True)
            print("  ✅ Fond acceptă active=True")
        except TypeError as e:
            print(f"  ❌ Fond NU acceptă active: {e}")
            try:
                fond = Fond(company_name="Test", holder_name="Test", address="Test")
                print("  ✅ Fond funcționează fără active")
                if hasattr(fond, 'active'):
                    print("  ℹ️  dar are atributul active (poate fi setat manual)")
                else:
                    print("  ❌ Fond nu are deloc atributul active")
            except Exception as e2:
                print(f"  ❌ Fond creation failed completely: {e2}")
        
        # Check for ID generation
        print("\n🆔 ID GENERATION:")
        print("-" * 30)
        
        # Check if models have autoincrement IDs
        user_id_col = getattr(User, 'id', None)
        fond_id_col = getattr(Fond, 'id', None)
        
        if user_id_col:
            print(f"User.id: {user_id_col.type}, autoincrement: {getattr(user_id_col, 'autoincrement', 'unknown')}")
        else:
            print("❌ User model nu are câmpul 'id'")
            
        if fond_id_col:
            print(f"Fond.id: {fond_id_col.type}, autoincrement: {getattr(fond_id_col, 'autoincrement', 'unknown')}")
        else:
            print("❌ Fond model nu are câmpul 'id'")
        
    except ImportError as e:
        print(f"❌ Nu pot importa modelele: {e}")
        print("Verifică că ești în directorul corect și că app/ este disponibil")
        
    except Exception as e:
        print(f"❌ Eroare neașteptată: {e}")
        import traceback
        traceback.print_exc()

def suggest_fixes():
    """Suggest fixes based on the model structure."""
    print("\n" + "=" * 60)
    print("💡 SUGESTII PENTRU REPARARE:")
    print("=" * 60)
    
    print("\n1. Pentru problema pytest-asyncio:")
    print("   pip install pytest-asyncio")
    print("   Adaugă în pytest.ini: asyncio_mode = auto")
    
    print("\n2. Pentru erori de model:")
    print("   - Dacă User nu acceptă is_active în constructor:")
    print("     Creează User fără is_active, apoi setează manual")
    print("   - Dacă Fond nu acceptă active în constructor:")
    print("     Creează Fond fără active, apoi setează manual")
    
    print("\n3. Pentru ID constraint errors:")
    print("   - Verifică că modelele au PRIMARY KEY autoincrement")
    print("   - Verifică că Base.metadata.create_all() se rulează corect")
    
    print("\n4. Pentru a exclude testele vechi:")
    print("   pytest tests/ --ignore=tests/backup_old/")
    print("   sau mută backup_old/ în afara directorului tests/")

if __name__ == "__main__":
    check_model_structure()
    suggest_fixes()
