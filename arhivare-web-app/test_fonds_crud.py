# test_fonds_crud.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.fond import Fond
from app.schemas.fond import FondCreate, FondUpdate
from app.crud.fond import (
    create_fond, get_fond, get_fonds, search_fonds,
    update_fond, soft_delete_fond, get_fonds_count
)

# Conexiune DB - ajustează dacă ai alt port sau user/parolă
DATABASE_URL = "postgresql+psycopg2://app:app@localhost:5432/arhivare"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_fond_operations():
    db = SessionLocal()
    
    try:
        # 1) Creare fond
        print("\n=== 1. Creare fond ===")
        fond_data = FondCreate(
            company_name="Tractorul Brașov SA",
            holder_name="Turbonium SRL",
            address="Str. Industriei 15, Brașov, 500269",
            email="arhiva@turbonium.ro",
            phone="+40 268 123 456",
            notes="Arhiva completă pentru perioada 1950-2010",
            source_url="https://turbonium.ro/arhiva"
        )
        new_fond = create_fond(db, fond_data)
        print(f"✅ Fond creat: ID={new_fond.id}, Company={new_fond.company_name}")
        
        # 2) Creare al doilea fond pentru teste
        fond_data2 = FondCreate(
            company_name="Steagul Roșu Brașov",
            holder_name="Arhiva Județeană Brașov",
            address="Str. Gheorghe Barițiu 34, Brașov",
            email="contact@arhivabrasov.ro",
            phone="+40 268 789 012"
        )
        fond2 = create_fond(db, fond_data2)
        print(f"✅ Al doilea fond creat: ID={fond2.id}")
        
        # 3) Căutare fonduri
        print("\n=== 2. Căutare fonduri ===")
        results = search_fonds(db, "Brașov", skip=0, limit=10)
        print(f"🔍 Găsite {len(results)} fonduri pentru 'Brașov':")
        for fond in results:
            print(f"  - {fond.company_name} -> {fond.holder_name}")
        
        # 4) Căutare case-insensitive
        results2 = search_fonds(db, "tractorul", skip=0, limit=10)
        print(f"🔍 Găsite {len(results2)} fonduri pentru 'tractorul' (lowercase)")
        
        # 5) Get fond by ID
        print("\n=== 3. Get fond by ID ===")
        fetched = get_fond(db, new_fond.id)
        print(f"📄 Fond ID {fetched.id}: {fetched.company_name}")
        
        # 6) List all fonds
        print("\n=== 4. List all fonds ===")
        all_fonds = get_fonds(db, skip=0, limit=10, active_only=True)
        print(f"📋 Total fonduri active: {len(all_fonds)}")
        for fond in all_fonds:
            print(f"  - {fond.company_name} (active: {fond.active})")
        
        # 7) Update fond
        print("\n=== 5. Update fond ===")
        update_data = FondUpdate(
            phone="+40 268 999 888",
            notes="Arhivă actualizată cu documente noi"
        )
        updated = update_fond(db, new_fond.id, update_data)
        print(f"✏️ Fond actualizat: telefon nou = {updated.phone}")
        
        # 8) Soft delete
        print("\n=== 6. Soft delete fond ===")
        success = soft_delete_fond(db, fond2.id)
        print(f"🗑️ Soft delete fond2: {'✅ Success' if success else '❌ Failed'}")
        
        # Verifică că nu mai apare în căutări
        active_count = get_fonds_count(db, active_only=True)
        total_count = get_fonds_count(db, active_only=False)
        print(f"📊 Fonduri active: {active_count}, Total: {total_count}")
        
        print("\n🎉 Toate testele CRUD au trecut cu succes!")
        
    except Exception as e:
        print(f"❌ Eroare în teste: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    test_fond_operations()
