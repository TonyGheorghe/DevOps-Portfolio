#!/usr/bin/env python3
# run_tests.py - Script pentru rularea testelor în mod organizat

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description=""):
    """Execute a command and return success status."""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    print(f"Comanda: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        success = result.returncode == 0
        
        print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: {description}")
        return success
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Run tests in organized manner."""
    print("🚀 Arhivare Web App - Test Suite")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("app").exists() or not Path("tests").exists():
        print("❌ Rulează din directorul root al proiectului!")
        print("   Asigură-te că ai directoarele 'app' și 'tests'")
        sys.exit(1)
    
    # Install test requirements if needed
    print("📦 Verificare dependențe test...")
    try:
        import pytest
        import httpx
        print("✅ Dependențele de test sunt instalate")
    except ImportError:
        print("📦 Instalare dependențe test...")
        if not run_command([sys.executable, "-m", "pip", "install", "-r", "requirements-test.txt"], 
                          "Instalare dependențe test"):
            print("❌ Nu s-au putut instala dependențele de test")
            print("   Rulează manual: pip install pytest pytest-asyncio httpx")
            sys.exit(1)
    
    # Test categories to run
    test_categories = [
        {
            "name": "Import Tests",
            "description": "Verifică că toate modulele se importă corect",
            "file": "tests/test_imports.py",
            "critical": True
        },
        {
            "name": "Health Check",
            "description": "Testează endpoint-ul de health check",
            "file": "tests/test_health.py", 
            "critical": True
        },
        {
            "name": "Authentication",
            "description": "Testează login și autorizare",
            "file": "tests/test_auth.py",
            "critical": True
        },
        {
            "name": "Search Functionality", 
            "description": "Testează căutarea fondurilor",
            "file": "tests/test_search.py",
            "critical": True
        },
        {
            "name": "CRUD Operations",
            "description": "Testează operațiunile de bază (Create, Read, Update, Delete)",
            "file": "tests/test_crud.py",
            "critical": False
        },
        {
            "name": "Fonds API",
            "description": "Testează API-ul pentru management fonduri",
            "file": "tests/test_fonds_api.py", 
            "critical": False
        }
    ]
    
    # Run tests by category
    results = []
    critical_failed = False
    
    for category in test_categories:
        test_file = Path(category["file"])
        
        if not test_file.exists():
            print(f"⚠️  Fișierul {category['file']} nu există - skip")
            results.append((category["name"], "SKIP"))
            continue
        
        success = run_command(
            ["python", "-m", "pytest", str(test_file), "-v"],
            f"{category['name']}: {category['description']}"
        )
        
        results.append((category["name"], "PASS" if success else "FAIL"))
        
        if not success and category["critical"]:
            critical_failed = True
            print(f"\n🚨 CRITICAL TEST FAILED: {category['name']}")
            break
    
    # Print summary
    print(f"\n{'='*60}")
    print("📊 SUMAR REZULTATE TESTE")
    print(f"{'='*60}")
    
    for test_name, status in results:
        emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⏭️"
        print(f"{emoji} {test_name}: {status}")
    
    print(f"\n{'='*60}")
    
    if critical_failed:
        print("🚨 TESTE CRITICE AU EȘUAT!")
        print("   Rezolvă problemele de mai sus înainte de a continua.")
        print("\n💡 Sugestii:")
        print("   1. Verifică că serverul nu rulează (oprește uvicorn)")
        print("   2. Verifică că baza de date PostgreSQL este disponibilă")
        print("   3. Verifică că toate dependențele sunt instalate")
        print("   4. Rulează testele individual cu: pytest tests/test_file.py -v")
        sys.exit(1)
    else:
        passed = sum(1 for _, status in results if status == "PASS")
        total = len(results)
        print(f"🎉 TESTE COMPLETE: {passed}/{total} au trecut cu succes!")
        
        if passed < total:
            print("⚠️  Unele teste au eșuat, dar nu sunt critice")
            print("   Revizuiește erorile de mai sus pentru îmbunătățiri")
    
    print("\n🔧 Pentru debugging avansat:")
    print("   pytest tests/ -v --tb=long")
    print("   pytest tests/test_specific.py::test_function -s")
    print("   pytest tests/ --lf  # rulează doar testele care au eșuat ultima dată")

if __name__ == "__main__":
    main()
