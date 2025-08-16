# debug_search_error.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_search_detailed():
    """Testează căutarea cu detalii complete despre eroare."""
    print("🔍 Testare detaliată pentru endpoint-ul /search")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/search", params={"query": "test"})
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Raw Response: {response.text}")
        
        if response.status_code == 500:
            print("\n❌ Eroare 500 - Server Error")
            print("Verifică log-urile din terminal unde rulează uvicorn")
            
    except Exception as e:
        print(f"❌ Excepție în request: {e}")

def test_direct_database():
    """Testează conexiunea directă la baza de date."""
    print("\n🗄️ Testare conexiune directă la baza de date")
    print("=" * 50)
    
    try:
        from app.db.session import SessionLocal
        from app.models.fond import Fond
        
        db = SessionLocal()
        
        # Test simplu - contorizează fondurile
        count = db.query(Fond).count()
        print(f"✅ Conexiune DB OK - Total fonduri: {count}")
        
        # Test search direct
        active_fonds = db.query(Fond).filter(Fond.active == True).limit(3).all()
        print(f"✅ Query OK - Fonduri active: {len(active_fonds)}")
        
        for fond in active_fonds:
            print(f"  - {fond.company_name} (ID: {fond.id})")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Eroare DB: {e}")
        import traceback
        traceback.print_exc()

def test_crud_functions():
    """Testează funcțiile CRUD direct."""
    print("\n🔧 Testare funcții CRUD")
    print("=" * 50)
    
    try:
        from app.db.session import SessionLocal
        from app.crud.fond import search_fonds
        
        db = SessionLocal()
        results = search_fonds(db, "test", skip=0, limit=5)
        print(f"✅ CRUD search_fonds OK - Rezultate: {len(results)}")
        
        for fond in results:
            print(f"  - {fond.company_name}")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Eroare CRUD: {e}")
        import traceback
        traceback.print_exc()

def test_schema_serialization():
    """Testează serializarea cu Pydantic."""
    print("\n📋 Testare serializare Pydantic")
    print("=" * 50)
    
    try:
        from app.db.session import SessionLocal
        from app.models.fond import Fond
        from app.schemas.fond import FondResponse
        
        db = SessionLocal()
        fond = db.query(Fond).first()
        
        if fond:
            # Încearcă să serializezi cu Pydantic
            fond_response = FondResponse.model_validate(fond)
            print(f"✅ Serializare OK pentru: {fond.company_name}")
            print(f"Response data: {fond_response.model_dump()}")
        else:
            print("⚠️ Nu există fonduri în baza de date")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Eroare serializare: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_search_detailed()
    test_direct_database() 
    test_crud_functions()
    test_schema_serialization()
