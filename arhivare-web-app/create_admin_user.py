#!/usr/bin/env python3
"""
Script pentru crearea utilizatorilor cu roluri extinse și demo data.
Suportă admin, audit, și client roles.
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond
from app.core.security import get_password_hash

# Database setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all database tables."""
    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created!")

def create_demo_users(db):
    """Create demo users with different roles."""
    print("\n👥 Creating demo users...")
    
    demo_users = [
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
            "notes": "Utilizator audit pentru monitorizare și rapoarte"
        },
        {
            "username": "client_brasov",
            "password": "Client1234",
            "role": "client",
            "company_name": "Tractorul Brașov Heritage SRL",
            "contact_email": "contact@tractorul-heritage.ro",
            "notes": "Client pentru fondurile Tractorul Brașov"
        },
        {
            "username": "client_cluj",
            "password": "Client1234",
            "role": "client", 
            "company_name": "Cluj Archives Research SRL",
            "contact_email": "research@cluj-archives.ro",
            "notes": "Client pentru fondurile din zona Cluj"
        },
        {
            "username": "client_bucuresti",
            "password": "Client1234",
            "role": "client",
            "company_name": "Bucharest Historical Documents SRL", 
            "contact_email": "docs@bucuresti-historical.ro",
            "notes": "Client pentru fondurile din zona București"
        }
    ]
    
    created_users = []
    
    for user_data in demo_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        
        if existing_user:
            print(f"  ⏭️  User {user_data['username']} already exists, skipping...")
            created_users.append(existing_user)
            continue
        
        try:
            new_user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                company_name=user_data["company_name"],
                contact_email=user_data["contact_email"],
                notes=user_data["notes"]
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            print(f"  ✅ Created {user_data['role']} user: {user_data['username']}")
            created_users.append(new_user)
            
        except IntegrityError as e:
            db.rollback()
            print(f"  ❌ Error creating user {user_data['username']}: {e}")
    
    print(f"\n📊 Users summary:")
    print(f"   • Total users created/found: {len(created_users)}")
    role_counts = {}
    for user in created_users:
        role_counts[user.role] = role_counts.get(user.role, 0) + 1
    for role, count in role_counts.items():
        print(f"   • {role.capitalize()}: {count}")
    
    return created_users

def create_demo_fonds(db, users):
    """Create demo fonds and assign some to clients."""
    print("\n📚 Creating demo fonds...")
    
    demo_fonds = [
        {
            "company_name": "Tractorul Brașov SA",
            "holder_name": "Arhiva Națională Brașov",
            "address": "Str. Industriei 15, Brașov, 500269",
            "email": "contact@arhiva-brasov.ro",
            "phone": "+40 268 123 456",
            "notes": "Fond arhivistic principal pentru uzina Tractorul Brașov",
            "source_url": "https://arhiva-brasov.ro/fonduri/tractorul",
            "assign_to": "client_brasov"
        },
        {
            "company_name": "Steagul Roșu Brașov SA",
            "holder_name": "Muzeul Județean Brașov",
            "address": "Piața Sfatului 30, Brașov, 500025",
            "email": "arhiva@muzeul-brasov.ro",
            "phone": "+40 268 789 012",
            "notes": "Documentele Steagul Roșu păstrate la muzeul județean",
            "assign_to": "client_brasov"
        },
        {
            "company_name": "Fabrica de Textile Cluj SRL",
            "holder_name": "Arhiva de Stat Cluj",
            "address": "Str. Memorandumului 21, Cluj-Napoca, 400114",
            "email": "textile@arhiva-cluj.ro",
            "phone": "+40 264 555 777",
            "notes": "Arhiva fabricii de textile din perioada 1960-1990",
            "source_url": "https://arhiva-cluj.ro/textile",
            "assign_to": "client_cluj"
        },
        {
            "company_name": "Industria Sârmei Câmpia Turzii SA",
            "holder_name": "Arhiva de Stat Cluj",
            "address": "Str. Memorandumului 21, Cluj-Napoca, 400114", 
            "email": "sarma@arhiva-cluj.ro",
            "phone": "+40 264 555 777",
            "notes": "Documente privind producția de sârmă",
            "assign_to": "client_cluj"
        },
        {
            "company_name": "Combinatul Siderurgic Galați SA",
            "holder_name": "Arhiva Națională București",
            "address": "Bd. Regina Elisabeta 49, București, 030016",
            "email": "siderurgie@arhiva-nationala.ro", 
            "phone": "+40 21 314 1950",
            "notes": "Fond pentru cel mai mare combinat siderurgic",
            "source_url": "https://arhiva-nationala.ro/siderurgie",
            "assign_to": "client_bucuresti"
        },
        {
            "company_name": "Uzina Mecanică București SA",
            "holder_name": "Arhiva Municipiului București",
            "address": "Calea Victoriei 155, București, 010073",
            "email": "mecanica@arhiva-bucuresti.ro",
            "phone": "+40 21 212 1000",
            "notes": "Uzină mecanică din sectorul 1",
            "assign_to": "client_bucuresti"
        },
        {
            "company_name": "Fabrica de Mobilă Reghin SA",
            "holder_name": "Arhiva de Stat Mureș",
            "address": "Str. Victoriei 2, Târgu Mureș, 540009",
            "email": "mobila@arhiva-mures.ro",
            "phone": "+40 265 123 789",
            "notes": "Renumită fabrică de mobilă din Reghin",
            "assign_to": None  # Unassigned fond
        },
        {
            "company_name": "Combinatul de Îngrășăminte Turnu Măgurele SA",
            "holder_name": "Arhiva de Stat Teleorman",
            "address": "Str. Libertății 45, Alexandria, 140004",
            "email": "ingrasaminte@arhiva-teleorman.ro", 
            "phone": "+40 247 311 200",
            "notes": "Combinat chimico-industrial major",
            "assign_to": None  # Unassigned fond
        },
        {
            "company_name": "Închisă Textila Iași SRL",
            "holder_name": "Arhiva de Stat Iași",
            "address": "Str. Arcu 4, Iași, 700126",
            "email": "textila@arhiva-iasi.ro",
            "phone": "+40 232 123 456",
            "notes": "Companie închisă în anii 2000",
            "active": False,  # Inactive fond
            "assign_to": None
        }
    ]
    
    # Create user mapping for easier assignment
    user_map = {user.username: user for user in users}
    
    created_fonds = []
    
    for fond_data in demo_fonds:
        # Check if fond already exists
        existing_fond = db.query(Fond).filter(
            Fond.company_name == fond_data["company_name"]
        ).first()
        
        if existing_fond:
            print(f"  ⏭️  Fond {fond_data['company_name']} already exists, skipping...")
            created_fonds.append(existing_fond)
            continue
        
        try:
            # Determine owner_id
            owner_id = None
            if fond_data.get("assign_to") and fond_data["assign_to"] in user_map:
                owner_id = user_map[fond_data["assign_to"]].id
            
            new_fond = Fond(
                company_name=fond_data["company_name"],
                holder_name=fond_data["holder_name"],
                address=fond_data["address"],
                email=fond_data["email"],
                phone=fond_data["phone"],
                notes=fond_data["notes"],
                source_url=fond_data.get("source_url"),
                active=fond_data.get("active", True),
                owner_id=owner_id
            )
            
            db.add(new_fond)
            db.commit()
            db.refresh(new_fond)
            
            assignment_info = ""
            if owner_id:
                owner = user_map[fond_data["assign_to"]]
                assignment_info = f" → assigned to {owner.username}"
            
            status = "active" if new_fond.active else "inactive"
            print(f"  ✅ Created {status} fond: {fond_data['company_name']}{assignment_info}")
            created_fonds.append(new_fond)
            
        except Exception as e:
            db.rollback()
            print(f"  ❌ Error creating fond {fond_data['company_name']}: {e}")
    
    print(f"\n📊 Fonds summary:")
    print(f"   • Total fonds: {len(created_fonds)}")
    
    active_count = sum(1 for f in created_fonds if f.active)
    assigned_count = sum(1 for f in created_fonds if f.owner_id is not None)
    
    print(f"   • Active: {active_count}")
    print(f"   • Inactive: {len(created_fonds) - active_count}")
    print(f"   • Assigned: {assigned_count}")
    print(f"   • Unassigned: {len(created_fonds) - assigned_count}")
    
    return created_fonds

def show_demo_accounts():
    """Display demo account information."""
    print("\n" + "="*60)
    print("🔐 DEMO ACCOUNTS INFORMATION")
    print("="*60)
    
    accounts = [
        {
            "role": "Admin",
            "username": "admin",
            "password": "admin123",
            "description": "Administrator complet - management utilizatori și fonduri",
            "dashboard": "/admin"
        },
        {
            "role": "Audit",
            "username": "audit_user", 
            "password": "Audit1234",
            "description": "Vizualizare toate datele, export, rapoarte (read-only)",
            "dashboard": "/audit"
        },
        {
            "role": "Client",
            "username": "client_brasov",
            "password": "Client1234",
            "description": "Management fonduri assignate (Tractorul, Steagul Roșu)",
            "dashboard": "/client"
        },
        {
            "role": "Client",
            "username": "client_cluj",
            "password": "Client1234", 
            "description": "Management fonduri assignate (Textile Cluj, Sârma)",
            "dashboard": "/client"
        },
        {
            "role": "Client",
            "username": "client_bucuresti",
            "password": "Client1234",
            "description": "Management fonduri assignate (Siderurgie, Uzina Mecanică)",
            "dashboard": "/client"
        }
    ]
    
    for account in accounts:
        print(f"\n🔑 {account['role']} Account:")
        print(f"   Username: {account['username']}")
        print(f"   Password: {account['password']}")
        print(f"   Dashboard: {account['dashboard']}")
        print(f"   Access: {account['description']}")
    
    print(f"\n🌐 Frontend URLs:")
    print(f"   • Homepage: http://localhost:3000")
    print(f"   • Login: http://localhost:3000/login")
    print(f"   • Admin Dashboard: http://localhost:3000/admin")
    print(f"   • Audit Dashboard: http://localhost:3000/audit")
    print(f"   • Client Dashboard: http://localhost:3000/client")
    
    print(f"\n🔧 Backend URLs:")
    print(f"   • API Docs: http://localhost:8000/docs")
    print(f"   • Health Check: http://localhost:8000/health")
    print(f"   • Public Search: http://localhost:8000/search?query=tractorul")

def check_database_connection():
    """Test database connection."""
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).fetchone()
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def reset_database():
    """Reset the entire database (dangerous!)."""
    print("⚠️  RESETTING DATABASE - THIS WILL DELETE ALL DATA!")
    
    confirmation = input("Type 'RESET' to confirm: ")
    if confirmation != 'RESET':
        print("❌ Reset cancelled.")
        return False
    
    try:
        print("🗄️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        
        print("🔧 Recreating tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database reset complete!")
        return True
        
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        return False

def main():
    """Main function."""
    print("🚀 ARHIVARE WEB APP - USER SETUP SCRIPT")
    print("="*60)
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "check":
            print("🔍 Checking database connection...")
            if check_database_connection():
                print("✅ Database connection successful!")
            else:
                print("❌ Database connection failed!")
            return
            
        elif command == "reset":
            if reset_database():
                print("✅ Database reset successful!")
            return
            
        elif command == "help":
            print("Available commands:")
            print("  python create_admin_user.py        # Setup demo users and data")
            print("  python create_admin_user.py check  # Check database connection")
            print("  python create_admin_user.py reset  # Reset database (DANGEROUS!)")
            print("  python create_admin_user.py help   # Show this help")
            return
    
    # Check database connection first
    print("🔍 Checking database connection...")
    if not check_database_connection():
        print("❌ Cannot connect to database. Please check your configuration.")
        print("💡 Make sure PostgreSQL is running and .env is configured correctly.")
        return
    
    print("✅ Database connection successful!")
    
    # Create tables
    create_tables()
    
    # Create demo data
    db = SessionLocal()
    try:
        users = create_demo_users(db)
        fonds = create_demo_fonds(db, users)
        
        print("\n🎉 SETUP COMPLETE!")
        print(f"✅ Created {len(users)} users")
        print(f"✅ Created {len(fonds)} fonds")
        
        show_demo_accounts()
        
        print("\n" + "="*60)
        print("🚀 NEXT STEPS:")
        print("="*60)
        print("1. Start the backend:")
        print("   uvicorn app.main:app --reload")
        print("2. Start the frontend:")
        print("   cd react-frontend && npm start")
        print("3. Open http://localhost:3000 in your browser")
        print("4. Login with any of the accounts above")
        print("5. Test the role-based access control!")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
