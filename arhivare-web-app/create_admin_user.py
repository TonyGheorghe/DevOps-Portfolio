#!/usr/bin/env python3
"""
create_admin_user.py - FIXED VERSION
Create demo users and sample data for Arhivare Web App
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond

def create_database_engine():
    """Create database engine with proper error handling"""
    try:
        engine = create_engine(settings.DATABASE_URL, echo=False)
        return engine
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print(f"Database URL: {settings.DATABASE_URL}")
        return None

def create_users(session):
    """Create demo users with all roles"""
    print("👥 Creating demo users...")
    
    users_data = [
        {
            "username": "admin",
            "password": "admin123",
            "role": "admin",
            "company_name": None,
            "contact_email": "admin@arhivare.ro",
            "notes": "Administrator principal al sistemului"
        },
        {
            "username": "audit_user",
            "password": "Audit1234",
            "role": "audit",
            "company_name": None,
            "contact_email": "audit@arhivare.ro", 
            "notes": "Utilizator pentru monitorizare și rapoarte"
        },
        {
            "username": "client_brasov",
            "password": "Client1234",
            "role": "client",
            "company_name": "Tractorul Brașov Heritage SRL",
            "contact_email": "contact@tractorul-brasov.ro",
            "notes": "Client pentru fondurile din zona Brașov"
        },
        {
            "username": "client_cluj",
            "password": "Client1234", 
            "role": "client",
            "company_name": "Archive Solutions Cluj SRL",
            "contact_email": "info@archive-cluj.ro",
            "notes": "Client pentru fondurile din zona Cluj"
        },
        {
            "username": "client_bucuresti",
            "password": "Client1234",
            "role": "client", 
            "company_name": "Patrimony Bucuresti SA",
            "contact_email": "office@patrimony-bucuresti.ro",
            "notes": "Client pentru fondurile din zona București"
        }
    ]
    
    created_users = {}
    
    for user_data in users_data:
        try:
            # Check if user already exists
            existing_user = session.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                print(f"  ⚠️  User '{user_data['username']}' already exists, skipping...")
                created_users[user_data["username"]] = existing_user
                continue
            
            # Create new user
            user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                company_name=user_data["company_name"],
                contact_email=user_data["contact_email"],
                notes=user_data["notes"]
            )
            
            session.add(user)
            session.flush()  # Get the ID without committing
            created_users[user_data["username"]] = user
            
            print(f"  ✅ Created {user_data['role']} user: {user_data['username']}")
            
        except Exception as e:
            print(f"  ❌ Error creating user {user_data['username']}: {e}")
            session.rollback()
            continue
    
    try:
        session.commit()
        print(f"✅ Successfully created {len(created_users)} users")
    except Exception as e:
        print(f"❌ Error committing users: {e}")
        session.rollback()
    
    return created_users

def create_sample_fonds(session, users):
    """Create sample fonds with proper ownership"""
    print("📁 Creating sample fonds...")
    
    # Get client users for ownership assignment
    client_brasov = users.get("client_brasov")
    client_cluj = users.get("client_cluj") 
    client_bucuresti = users.get("client_bucuresti")
    
    fonds_data = [
        # Brașov area fonds - assigned to client_brasov
        {
            "company_name": "Tractorul Brașov SA",
            "holder_name": "Arhiva Națională Brașov",
            "address": "Str. Gh. Barițiu nr. 34, Brașov, 500025",
            "email": "arhiva@brv.ro",
            "phone": "+40 268 418 063",
            "notes": "Fond principal al fostei fabrici Tractorul Brașov, conține documente din perioada 1925-2007",
            "source_url": "https://arhive.gov.ro/brasov",
            "active": True,
            "owner_id": client_brasov.id if client_brasov else None
        },
        {
            "company_name": "Steagul Roșu Brașov SA", 
            "holder_name": "Arhiva Națională Brașov",
            "address": "Str. Gh. Barițiu nr. 34, Brașov, 500025",
            "email": "arhiva@brv.ro",
            "phone": "+40 268 418 063", 
            "notes": "Documentele fabricii de textile Steagul Roșu, perioada 1921-2006",
            "source_url": "https://arhive.gov.ro/brasov",
            "active": True,
            "owner_id": client_brasov.id if client_brasov else None
        },
        {
            "company_name": "Rulmentul Brașov SA",
            "holder_name": "Arhiva Națională Brașov", 
            "address": "Str. Gh. Barițiu nr. 34, Brașov, 500025",
            "email": "arhiva@brv.ro",
            "phone": "+40 268 418 063",
            "notes": "Arhiva fabricii de rulmenți, documnte tehnice și administrative 1960-2010",
            "source_url": "https://arhive.gov.ro/brasov",
            "active": True,
            "owner_id": client_brasov.id if client_brasov else None
        },
        
        # Cluj area fonds - assigned to client_cluj
        {
            "company_name": "Carbochim Cluj SA",
            "holder_name": "Arhiva Națională Cluj",
            "address": "Str. Daicoviciu nr. 9-11, Cluj-Napoca, 400020", 
            "email": "arhiva@cj.ro",
            "phone": "+40 264 595 299",
            "notes": "Fond al fostei întreprinderi chimice, documente 1950-2005",
            "source_url": "https://arhive.gov.ro/cluj",
            "active": True,
            "owner_id": client_cluj.id if client_cluj else None
        },
        {
            "company_name": "Tehnofrig Cluj SA",
            "holder_name": "Arhiva Națională Cluj",
            "address": "Str. Daicoviciu nr. 9-11, Cluj-Napoca, 400020",
            "email": "arhiva@cj.ro", 
            "phone": "+40 264 595 299",
            "notes": "Arhiva fabricii de utilaje frigorifice, perioada 1965-2008",
            "source_url": "https://arhive.gov.ro/cluj",
            "active": True,
            "owner_id": client_cluj.id if client_cluj else None
        },
        
        # București area fonds - assigned to client_bucuresti  
        {
            "company_name": "Grivița Roșie București SA",
            "holder_name": "Arhiva Națională București",
            "address": "Bd. Regina Elisabeta nr. 49, București, 030018",
            "email": "secretariat@arhivelenationale.ro",
            "phone": "+40 21 314 0508",
            "notes": "Fond al fostelor ateliere CFR Grivița, documente 1869-2007",
            "source_url": "https://arhive.gov.ro/bucuresti", 
            "active": True,
            "owner_id": client_bucuresti.id if client_bucuresti else None
        },
        {
            "company_name": "Faur București SA",
            "holder_name": "Arhiva Națională București",
            "address": "Bd. Regina Elisabeta nr. 49, București, 030018",
            "email": "secretariat@arhivelenationale.ro",
            "phone": "+40 21 314 0508",
            "notes": "Arhiva fabricii de material rulant, perioada 1920-2006",
            "source_url": "https://arhive.gov.ro/bucuresti",
            "active": True,
            "owner_id": client_bucuresti.id if client_bucuresti else None
        },
        
        # Unassigned fonds for testing admin assignment functionality
        {
            "company_name": "Chimcomplex Borzești SA",
            "holder_name": "Arhiva Națională Bacău",
            "address": "Str. Vasile Alecsandri nr. 10, Bacău, 600114",
            "email": "arhiva@bc.ro",
            "phone": "+40 234 512 345",
            "notes": "Fond neasignat, disponibil pentru assignment către client",
            "source_url": "https://arhive.gov.ro/bacau",
            "active": True,
            "owner_id": None  # Unassigned
        },
        {
            "company_name": "Oltchim Râmnicu Vâlcea SA", 
            "holder_name": "Arhiva Națională Vâlcea",
            "address": "Str. Traian nr. 9, Râmnicu Vâlcea, 240076",
            "email": "arhiva@vl.ro", 
            "phone": "+40 250 733 456",
            "notes": "Fond important, urmează să fie assignat unui client specializat",
            "source_url": "https://arhive.gov.ro/valcea",
            "active": True,
            "owner_id": None  # Unassigned
        },
        
        # Some inactive fonds for testing
        {
            "company_name": "Dacia Mioveni SA (arhivă temporar indisponibilă)",
            "holder_name": "Arhiva Națională Argeș", 
            "address": "Str. Negru Vodă nr. 5, Pitești, 110123",
            "email": "arhiva@ag.ro",
            "phone": "+40 248 222 333",
            "notes": "Fond temporar inactiv din cauza reorganizării arhivei",
            "source_url": "https://arhive.gov.ro/arges",
            "active": False,  # Inactive
            "owner_id": None
        }
    ]
    
    created_count = 0
    
    for fond_data in fonds_data:
        try:
            # Check if fond already exists
            existing_fond = session.query(Fond).filter(
                Fond.company_name == fond_data["company_name"]
            ).first()
            
            if existing_fond:
                print(f"  ⚠️  Fond '{fond_data['company_name']}' already exists, skipping...")
                continue
            
            # Create new fond
            fond = Fond(**fond_data)
            session.add(fond)
            created_count += 1
            
            # Show assignment info
            if fond_data["owner_id"]:
                owner_username = next(
                    (username for username, user in users.items() if user.id == fond_data["owner_id"]), 
                    "Unknown"
                )
                print(f"  ✅ Created fond: {fond_data['company_name']} → assigned to {owner_username}")
            else:
                print(f"  📝 Created fond: {fond_data['company_name']} → unassigned")
            
        except Exception as e:
            print(f"  ❌ Error creating fond {fond_data['company_name']}: {e}")
            session.rollback()
            continue
    
    try:
        session.commit()
        print(f"✅ Successfully created {created_count} fonds")
    except Exception as e:
        print(f"❌ Error committing fonds: {e}")
        session.rollback()

def show_summary(session):
    """Show summary of created data"""
    print("\n" + "="*60)
    print("📊 DEMO DATA SUMMARY")
    print("="*60)
    
    try:
        # Count users by role
        admin_count = session.query(User).filter(User.role == "admin").count()
        audit_count = session.query(User).filter(User.role == "audit").count() 
        client_count = session.query(User).filter(User.role == "client").count()
        
        print(f"👥 Users created:")
        print(f"   • Administrators: {admin_count}")
        print(f"   • Audit users: {audit_count}")
        print(f"   • Client users: {client_count}")
        print(f"   • Total users: {admin_count + audit_count + client_count}")
        
        # Count fonds
        total_fonds = session.query(Fond).count()
        active_fonds = session.query(Fond).filter(Fond.active == True).count()
        assigned_fonds = session.query(Fond).filter(Fond.owner_id != None).count()
        unassigned_fonds = session.query(Fond).filter(Fond.owner_id == None).count()
        
        print(f"\n📁 Fonds created:")
        print(f"   • Total fonds: {total_fonds}")
        print(f"   • Active fonds: {active_fonds}")
        print(f"   • Assigned fonds: {assigned_fonds}")
        print(f"   • Unassigned fonds: {unassigned_fonds}")
        
        # Show assignment distribution
        assignment_stats = session.execute(text("""
            SELECT u.username, u.company_name, COUNT(f.id) as fond_count
            FROM users u
            LEFT JOIN fonds f ON u.id = f.owner_id
            WHERE u.role = 'client'
            GROUP BY u.id, u.username, u.company_name
            ORDER BY fond_count DESC
        """)).fetchall()
        
        if assignment_stats:
            print(f"\n📋 Assignment distribution:")
            for stat in assignment_stats:
                username, company, count = stat
                print(f"   • {username} ({company}): {count} fonds")
        
        print(f"\n🔐 Demo login credentials:")
        print(f"   • Admin: admin / admin123")
        print(f"   • Audit: audit_user / Audit1234") 
        print(f"   • Client (Brașov): client_brasov / Client1234")
        print(f"   • Client (Cluj): client_cluj / Client1234")
        print(f"   • Client (București): client_bucuresti / Client1234")
        
        print(f"\n🌐 Access URLs:")
        print(f"   • Homepage: http://localhost:3000")
        print(f"   • API Docs: http://localhost:8000/docs")
        print(f"   • Adminer: http://localhost:8080")
        
    except Exception as e:
        print(f"❌ Error generating summary: {e}")
    
    print("="*60)

def main():
    """Main function"""
    print("🚀 Arhivare Web App - Demo Data Creator")
    print("="*60)
    
    # Create database engine
    engine = create_database_engine()
    if not engine:
        sys.exit(1)
    
    try:
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Create session
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        # Create users
        users = create_users(session)
        
        # Create sample fonds
        create_sample_fonds(session, users)
        
        # Show summary
        show_summary(session)
        
        print("\n✅ Demo data creation completed successfully!")
        print("🎉 Your Arhivare Web App is ready to use!")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        session.rollback()
        sys.exit(1)
    
    finally:
        session.close()

if __name__ == "__main__":
    main()
