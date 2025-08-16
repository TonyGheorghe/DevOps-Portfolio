# populate_sample_fonds.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.fond import Fond
from app.schemas.fond import FondCreate
from app.crud.fond import create_fond

DATABASE_URL = "postgresql+psycopg2://app:app@localhost:5432/arhivare"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Date sample pentru fonduri arhivistice din România
SAMPLE_FONDS = [
    {
        "company_name": "Tractorul Brașov SA",
        "holder_name": "Turbonium SRL",
        "address": "Str. Industriei 15, Brașov, 500269",
        "email": "arhiva@turbonium.ro",
        "phone": "+40 268 123 456",
        "notes": "Arhiva completă pentru perioada 1950-2010. Include dosare personal, contracte și documente tehnice.",
        "source_url": "https://turbonium.ro/arhiva"
    },
    {
        "company_name": "Steagul Roșu Brașov",
        "holder_name": "Arhiva Județeană Brașov",
        "address": "Str. Gheorghe Barițiu 34, Brașov, 500025",
        "email": "contact@arhivabrasov.ro",
        "phone": "+40 268 789 012",
        "notes": "Fonduri din perioada 1921-1989. Dosare complete ale angajaților.",
    },
    {
        "company_name": "Fabrică de Încălțăminte Diana Făgăraș",
        "holder_name": "SC Archival Services SRL",
        "address": "Str. Mihai Eminescu 23, Făgăraș, 505200",
        "email": "info@archivalservices.ro",
        "phone": "+40 268 456 789",
        "notes": "Arhive din industria textilă și încălțăminte, perioada 1960-2005.",
    },
    {
        "company_name": "Întreprinderea de Construcții București",
        "holder_name": "Arhiva Națională a României - Filiala București",
        "address": "Bd. Regina Elisabeta 49, București, 030018",
        "email": "bucuresti@arhivelenationale.ro",
        "phone": "+40 21 314 2850",
        "notes": "Documente construcții și infrastructură. Perioada 1945-1995.",
        "source_url": "http://arhivelenationale.ro"
    },
    {
        "company_name": "Combinatul Siderurgic Galați",
        "holder_name": "ArcelorMittal Galați SA - Departamentul Arhivă",
        "address": "Șos. Siderurgiștilor nr. 1, Galați, 800665",
        "email": "arhiva@arcelormittal.com",
        "phone": "+40 236 493 000",
        "notes": "Arhiva industrială siderurgică. Acces restricționat, necesită programare.",
        "source_url": "https://galati.arcelormittal.com"
    },
    {
        "company_name": "Fabrica de Zahăr Bod",
        "holder_name": "Consiliul Județean Brașov - Serviciul Arhivă",
        "address": "Piața Sfatului 30, Brașov, 500025",
        "email": "arhiva@cjbrasov.ro",
        "phone": "+40 268 307 200",
        "notes": "Industria alimentară, perioada interbelic și socialistă."
    },
    {
        "company_name": "Uzinele Tractorul UTB Brașov",
        "holder_name": "Biblioteca Județeană George Barițiu - Secția Arhivă",
        "address": "Str. Barițiu 1, Brașov, 500025",
        "email": "biblioteca@bjgb.ro",
        "phone": "+40 268 472 010",
        "notes": "Colecție specială cu documente industriale și tehnice."
    },
    {
        "company_name": "Întreprinderea de Textile Arad",
        "holder_name": "Muzeul Județean Arad - Secția Istorie",
        "address": "Piața George Enescu 1, Arad, 310131",
        "email": "secretariat@muzeularad.ro",
        "phone": "+40 257 281 847",
        "notes": "Documente din industria textilă arădeană, secolul XX."
    }
]

def main():
    db = SessionLocal()
    
    try:
        print("🏛️ Popularea bazei de date cu fonduri arhivistice sample...")
        print("=" * 60)
        
        created_count = 0
        existing_count = 0
        
        for fond_data in SAMPLE_FONDS:
            # Verifică dacă fondul există deja
            existing = db.query(Fond).filter(
                Fond.company_name == fond_data["company_name"]
            ).first()
            
            if existing:
                print(f"⚠️  Există deja: {fond_data['company_name']}")
                existing_count += 1
                continue
            
            # Creează fondul
            fond_create = FondCreate(**fond_data)
            new_fond = create_fond(db, fond_create)
            
            print(f"✅ Creat: {new_fond.company_name} -> {new_fond.holder_name}")
            created_count += 1
        
        print("=" * 60)
        print(f"📊 Rezultate:")
        print(f"   - Fonduri create: {created_count}")
        print(f"   - Fonduri existente: {existing_count}")
        print(f"   - Total în sample: {len(SAMPLE_FONDS)}")
        
        # Statistici finale
        total_active = db.query(Fond).filter(Fond.active == True).count()
        total_all = db.query(Fond).count()
        
        print(f"\n📈 Statistici baza de date:")
        print(f"   - Fonduri active: {total_active}")
        print(f"   - Total fonduri: {total_all}")
        
        print("\n🔍 Testează căutarea:")
        print("   - Brașov: http://localhost:8000/search?query=Brașov")
        print("   - Tractorul: http://localhost:8000/search?query=tractorul")
        print("   - Textile: http://localhost:8000/search?query=textile")
        
    except Exception as e:
        print(f"❌ Eroare: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
