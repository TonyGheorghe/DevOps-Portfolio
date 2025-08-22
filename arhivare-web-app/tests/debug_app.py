#!/usr/bin/env python3
"""
Script pentru debugging rapid al aplicației Arhivare Web App.
Verifică toate componentele și identifică problemele.
"""

import asyncio
import sys
import subprocess
import requests
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def check_environment():
    """Verifică mediul de dezvoltare."""
    
    print("🔍 VERIFICARE MEDIU DE DEZVOLTARE")
    print("=" * 50)
    
    # Verifică directorul curent
    current_dir = Path.cwd()
    print(f"📁 Director curent: {current_dir}")
    
    # Verifică fișierele esențiale
    essential_files = [
        "app/main.py",
        "react-frontend/package.json", 
        ".env.example",
        "requirements.txt",
        "alembic.ini"
    ]
    
    for file_path in essential_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - LIPSEȘTE!")
    
    # Verifică .env
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file există")
        try:
            with open(env_file) as f:
                content = f.read()
                if "DATABASE_URL" in content:
                    print("✅ DATABASE_URL configurat")
                else:
                    print("❌ DATABASE_URL lipsește din .env")
        except Exception as e:
            print(f"❌ Eroare la citirea .env: {e}")
    else:
        print("❌ .env file lipsește!")
        print("💡 Copiază .env.example la .env și configurează-l")

def check_database():
    """Verifică conexiunea și starea bazei de date."""
    
    print("\n💾 VERIFICARE BAZA DE DATE")
    print("=" * 50)
    
    try:
        # Încearcă să importe și să configureze
        from app.core.config import settings
        from app.models.user import User
        from app.models.fond import Fond
        
        print(f"🔗 DATABASE_URL: {settings.DATABASE_URL[:50]}...")
        
        # Testează conexiunea
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        # Test simplu de conectivitate
        session.execute("SELECT 1")
        print("✅ Conexiunea la baza de date funcționează!")
        
        # Verifică tabelele
        try:
            users_count = session.query(User).count()
            fonds_count = session.query(Fond).count()
            admin_user = session.query(User).filter(User.username == "admin").first()
            
            print(f"👥 Utilizatori: {users_count}")
            print(f"📚 Fonduri: {fonds_count}")
            print(f"🔑 Admin user: {'✅ Există' if admin_user else '❌ Nu există'}")
            
            if not admin_user:
                print("💡 Rulează: python create_admin_user.py")
                
        except Exception as e:
            print(f"❌ Tabelele nu există sau sunt incomplete: {e}")
            print("💡 Rulează: python create_admin_user.py")
        
        session.close()
        
    except ImportError as e:
        print(f"❌ Eroare import: {e}")
        print("💡 Verifică că toate dependențele sunt instalate")
    except Exception as e:
        print(f"❌ Eroare baza de date: {e}")
        print("💡 Verifică că PostgreSQL rulează și .env este configurat corect")

def check_backend():
    """Verifică dacă backend-ul rulează."""
    
    print("\n⚙️ VERIFICARE BACKEND (FastAPI)")
    print("=" * 50)
    
    try:
        # Verifică health endpoint
        response = requests.get("http://localhost:8000/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend rulează! Status: {data.get('status')}")
            print(f"📱 Versiune: {data.get('version', 'N/A')}")
        else:
            print(f"❌ Backend returnează status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend nu rulează pe localhost:8000")
        print("💡 Pornește backend-ul cu: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Eroare la verificarea backend: {e}")
    
    # Verifică și alte endpoint-uri importante
    endpoints_to_check = [
        "/docs",
        "/search?query=test",
        "/auth/login"
    ]
    
    for endpoint in endpoints_to_check:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=3)
            status = "✅" if response.status_code in [200, 422] else "❌"
            print(f"{status} {endpoint} - {response.status_code}")
        except:
            print(f"❌ {endpoint} - Nu răspunde")

def check_frontend():
    """Verifică dacă frontend-ul rulează."""
    
    print("\n🌐 VERIFICARE FRONTEND (React)")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        
        if response.status_code == 200:
            print("✅ Frontend rulează pe localhost:3000")
            
            # Verifică dacă conține elementele React
            content = response.text
            if "React" in content or "root" in content:
                print("✅ Aplicația React se încarcă")
            else:
                print("⚠️  Frontend se încarcă dar poate să nu fie React app")
        else:
            print(f"❌ Frontend returnează status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend nu rulează pe localhost:3000")
        print("💡 Pornește frontend-ul cu:")
        print("   cd react-frontend && npm start")
    except Exception as e:
        print(f"❌ Eroare la verificarea frontend: {e}")
    
    # Verifică package.json
    package_json = Path("react-frontend/package.json")
    if package_json.exists():
        print("✅ package.json există")
        try:
            import json
            with open(package_json) as f:
                data = json.load(f)
                print(f"📦 Nume: {data.get('name', 'N/A')}")
                print(f"🔧 React version: {data.get('dependencies', {}).get('react', 'N/A')}")
        except Exception as e:
            print(f"⚠️  Nu pot citi package.json: {e}")
    else:
        print("❌ react-frontend/package.json lipsește!")

def test_login_flow():
    """Testează flow-ul de login prin API."""
    
    print("\n🔐 TESTARE FLOW LOGIN")
    print("=" * 50)
    
    try:
        # Încearcă login cu credentialele default
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(
            "http://localhost:8000/auth/login",
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login reușit!")
            print(f"👤 User: {data.get('user', {}).get('username')}")
            print(f"🔑 Role: {data.get('user', {}).get('role')}")
            print(f"🎫 Token: {data.get('access_token', '')[:30]}...")
            
            # Testează un endpoint protejat
            token = data.get('access_token')
            headers = {"Authorization": f"Bearer {token}"}
            
            protected_response = requests.get(
                "http://localhost:8000/auth/protected",
                headers=headers,
                timeout=5
            )
            
            if protected_response.status_code == 200:
                print("✅ Endpoint protejat funcționează!")
            else:
                print(f"❌ Endpoint protejat returnează: {protected_response.status_code}")
                
        elif response.status_code == 401:
            print("❌ Login failed - credentiale greșite!")
            print("💡 Verifică că utilizatorul admin există în baza de date")
            print("💡 Rulează: python create_admin_user.py")
        else:
            print(f"❌ Login failed cu status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Nu pot testa login - backend nu rulează")
    except Exception as e:
        print(f"❌ Eroare la testarea login: {e}")

def suggest_solutions():
    """Sugerează soluții pentru problemele comune."""
    
    print("\n💡 SOLUȚII PENTRU PROBLEME COMUNE")
    print("=" * 50)
    
    print("\n🔧 Dacă backend nu pornește:")
    print("   1. Verifică că PostgreSQL rulează")
    print("   2. Verifică .env file și DATABASE_URL")
    print("   3. Instalează dependențele: pip install -r requirements.txt")
    print("   4. Pornește cu: uvicorn app.main:app --reload")
    
    print("\n🌐 Dacă frontend nu pornește:")
    print("   1. cd react-frontend")
    print("   2. npm install")
    print("   3. npm start")
    
    print("\n🔐 Dacă login nu funcționează:")
    print("   1. python create_admin_user.py")
    print("   2. Verifică că backend rulează pe localhost:8000")
    print("   3. Verifică logs-urile backend pentru erori")
    
    print("\n💾 Dacă baza de date are probleme:")
    print("   1. python create_admin_user.py check")
    print("   2. python create_admin_user.py reset (ATENȚIE: șterge tot!)")
    print("   3. Verifică că PostgreSQL rulează pe portul corect")
    
    print("\n🚀 Pentru o resetare completă:")
    print("   1. Oprește backend și frontend")
    print("   2. python create_admin_user.py reset")
    print("   3. uvicorn app.main:app --reload")
    print("   4. cd react-frontend && npm start")

def run_full_diagnostic():
    """Rulează diagnosticul complet."""
    
    print("🔧 ARHIVARE WEB APP - DIAGNOSTIC COMPLET")
    print("=" * 60)
    
    check_environment()
    check_database()
    check_backend()
    check_frontend()
    test_login_flow()
    suggest_solutions()
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNOSTIC FINALIZAT!")
    print("=" * 60)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "env":
            check_environment()
        elif command == "db":
            check_database()
        elif command == "backend":
            check_backend()
        elif command == "frontend":
            check_frontend()
        elif command == "login":
            test_login_flow()
        else:
            print("❌ Comandă necunoscută!")
            print("Utilizare:")
            print("  python debug_app.py           # Diagnostic complet")
            print("  python debug_app.py env       # Verifică mediul")
            print("  python debug_app.py db        # Verifică baza de date")
            print("  python debug_app.py backend   # Verifică backend")
            print("  python debug_app.py frontend  # Verifică frontend")
            print("  python debug_app.py login     # Testează login")
    else:
        run_full_diagnostic()
