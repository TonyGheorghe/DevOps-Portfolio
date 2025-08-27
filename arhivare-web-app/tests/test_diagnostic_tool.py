#!/usr/bin/env python3
"""
Test Diagnostic and Repair Tool pentru Arhivare Web App
Identifică și repară problemele cu testele
"""

import sys
import subprocess
import json
from pathlib import Path
import importlib.util
import traceback

class TestDiagnostic:
    """Diagnostic tool pentru testele Arhivare Web App."""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.issues = []
        self.fixes_applied = []
    
    def run_full_diagnostic(self):
        """Rulează diagnosticul complet."""
        print("🔧 ARHIVARE TEST DIAGNOSTIC TOOL")
        print("=" * 60)
        
        checks = [
            ("Project Structure", self.check_project_structure),
            ("Dependencies", self.check_dependencies),
            ("Import Issues", self.check_imports),
            ("Database Models", self.check_models),
            ("Test Configuration", self.check_test_config),
            ("Fixtures", self.check_fixtures),
            ("Route Availability", self.check_routes),
        ]
        
        results = {}
        
        for check_name, check_func in checks:
            print(f"\n🔍 Checking {check_name}...")
            try:
                result = check_func()
                results[check_name] = result
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"   {status}")
            except Exception as e:
                print(f"   ❌ ERROR: {e}")
                results[check_name] = False
                self.issues.append(f"{check_name}: {e}")
        
        self.print_summary(results)
        self.suggest_fixes()
        
        return results
    
    def check_project_structure(self):
        """Verifică structura proiectului."""
        required_files = [
            "app/main.py",
            "app/models/user.py", 
            "app/models/fond.py",
            "tests/conftest.py",
            "tests/test_health.py",
            "pytest.ini"
        ]
        
        missing = []
        for file_path in required_files:
            if not (self.project_root / file_path).exists():
                missing.append(file_path)
        
        if missing:
            self.issues.append(f"Missing files: {', '.join(missing)}")
            return False
        
        return True
    
    def check_dependencies(self):
        """Verifică dependențele necesare."""
        required_packages = [
            "pytest",
            "pytest-asyncio", 
            "httpx",
            "fastapi",
            "sqlalchemy",
            "pydantic"
        ]
        
        missing = []
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                missing.append(package)
        
        if missing:
            self.issues.append(f"Missing packages: {', '.join(missing)}")
            return False
        
        # Check versions
        try:
            import httpx
            import pytest_asyncio
            
            # HTTPX should be >= 0.24.0 for AsyncClient compatibility
            httpx_version = httpx.__version__
            if tuple(map(int, httpx_version.split('.')[:2])) < (0, 24):
                self.issues.append(f"httpx version {httpx_version} too old, need >= 0.24.0")
                return False
                
        except Exception as e:
            self.issues.append(f"Version check failed: {e}")
            return False
        
        return True
    
    def check_imports(self):
        """Verifică că toate modulele se pot importa."""
        modules_to_test = [
            "app.main",
            "app.models.user",
            "app.models.fond", 
            "app.api.auth",
            "app.crud.user",
            "app.crud.fond"
        ]
        
        failed_imports = []
        for module_name in modules_to_test:
            try:
                spec = importlib.util.find_spec(module_name)
                if spec is None:
                    failed_imports.append(f"{module_name} - module not found")
                    continue
                    
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
            except Exception as e:
                failed_imports.append(f"{module_name} - {str(e)}")
        
        if failed_imports:
            self.issues.extend(failed_imports)
            return False
        
        return True
    
    def check_models(self):
        """Verifică modelele de date."""
        try:
            from app.models.user import User
            from app.models.fond import Fond
            from app.database import Base
            
            # Check că modelele au toate câmpurile necesare
            user_fields = ['id', 'username', 'password_hash', 'role', 'created_at']
            fond_fields = ['id', 'company_name', 'holder_name', 'active', 'created_at']
            
            for field in user_fields:
                if not hasattr(User, field):
                    self.issues.append(f"User model missing field: {field}")
                    return False
            
            for field in fond_fields:
                if not hasattr(Fond, field):
                    self.issues.append(f"Fond model missing field: {field}")
                    return False
            
            # Test că se pot crea tabele
            from sqlalchemy import create_engine
            engine = create_engine("sqlite:///:memory:")
            Base.metadata.create_all(bind=engine)
            
            return True
            
        except Exception as e:
            self.issues.append(f"Model check failed: {e}")
            return False
    
    def check_test_config(self):
        """Verifică configurația testelor."""
        # Check pytest.ini
        pytest_ini = self.project_root / "pytest.ini"
        if not pytest_ini.exists():
            self.issues.append("pytest.ini missing")
            return False
        
        content = pytest_ini.read_text()
        if "asyncio_mode = auto" not in content:
            self.issues.append("pytest.ini missing asyncio_mode = auto")
            return False
        
        # Check conftest.py
        conftest = self.project_root / "tests" / "conftest.py"
        if not conftest.exists():
            self.issues.append("tests/conftest.py missing")
            return False
        
        try:
            # Try importing conftest
            sys.path.insert(0, str(self.project_root))
            from tests.conftest import client, admin_user
            return True
        except Exception as e:
            self.issues.append(f"conftest.py import failed: {e}")
            return False
    
    def check_fixtures(self):
        """Verifică fixture-urile de test."""
        try:
            # Import și verifică că fixture-urile există
            from tests.conftest import client, admin_user, sample_fonds, auth_headers
            
            # Check pentru probleme cunoscute
            conftest_content = (self.project_root / "tests" / "conftest.py").read_text()
            
            # Check pentru UNIQUE constraint issues
            if "uuid.uuid4()" not in conftest_content:
                self.issues.append("Fixtures don't use unique IDs - will cause UNIQUE constraint errors")
                return False
            
            # Check pentru AsyncClient configuration
            if "ASGITransport" not in conftest_content:
                self.issues.append("AsyncClient not properly configured with ASGITransport")
                return False
            
            return True
            
        except Exception as e:
            self.issues.append(f"Fixture check failed: {e}")
            return False
    
    def check_routes(self):
        """Verifică că rutele necesare există."""
        try:
            from app.main import app
            
            # Extract all routes
            routes = []
            for route in app.routes:
                if hasattr(route, 'path'):
                    routes.append(route.path)
            
            required_routes = [
                "/health",
                "/auth/login",
                "/auth/me", 
                "/auth/protected",
                "/search",
                "/search/count",
                "/fonds/"
            ]
            
            missing_routes = []
            for route in required_routes:
                # Check exact match or similar
                if not any(route in r or r in route for r in routes):
                    missing_routes.append(route)
            
            if missing_routes:
                self.issues.append(f"Missing routes: {', '.join(missing_routes)}")
                return False
            
            return True
            
        except Exception as e:
            self.issues.append(f"Route check failed: {e}")
            return False
    
    def print_summary(self, results):
        """Printează rezumatul diagnosticului."""
        print(f"\n" + "=" * 60)
        print("📊 DIAGNOSTIC SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for check, status in results.items():
            emoji = "✅" if status else "❌"
            print(f"{emoji} {check}")
        
        print(f"\nOverall: {passed}/{total} checks passed")
        
        if self.issues:
            print(f"\n🚨 ISSUES FOUND ({len(self.issues)}):")
            for i, issue in enumerate(self.issues, 1):
                print(f"  {i}. {issue}")
    
    def suggest_fixes(self):
        """Sugerează fix-uri pentru problemele găsite."""
        print(f"\n" + "=" * 60)
        print("🔧 SUGGESTED FIXES")
        print("=" * 60)
        
        if not self.issues:
            print("🎉 No issues found!")
            return
        
        # Group fixes by type
        fixes = {
            "Dependencies": [],
            "Configuration": [],
            "Code Issues": [],
            "Structure": []
        }
        
        for issue in self.issues:
            if "Missing packages" in issue:
                packages = issue.split(": ")[1]
                fixes["Dependencies"].append(f"pip install {packages}")
            
            elif "pytest.ini" in issue:
                fixes["Configuration"].append("Create/fix pytest.ini with asyncio_mode = auto")
            
            elif "AsyncClient" in issue:
                fixes["Code Issues"].append("Update conftest.py to use ASGITransport")
            
            elif "UNIQUE constraint" in issue:
                fixes["Code Issues"].append("Add uuid.uuid4() to fixture usernames")
            
            elif "Missing files" in issue:
                files = issue.split(": ")[1]
                fixes["Structure"].append(f"Create missing files: {files}")
            
            elif "httpx version" in issue:
                fixes["Dependencies"].append("pip install --upgrade httpx>=0.24.0")
            
            else:
                fixes["Code Issues"].append(issue)
        
        for category, fix_list in fixes.items():
            if fix_list:
                print(f"\n{category}:")
                for fix in fix_list:
                    print(f"  • {fix}")
    
    def apply_automatic_fixes(self):
        """Aplică fix-urile automate."""
        print(f"\n🔧 APPLYING AUTOMATIC FIXES")
        print("=" * 60)
        
        # Fix 1: Update pytest.ini
        self.fix_pytest_ini()
        
        # Fix 2: Fix conftest.py issues
        self.fix_conftest()
        
        # Fix 3: Create missing test files
        self.create_missing_test_files()
        
        print(f"\n✅ Applied {len(self.fixes_applied)} automatic fixes")
        if self.fixes_applied:
            for fix in self.fixes_applied:
                print(f"  • {fix}")
    
    def fix_pytest_ini(self):
        """Repară pytest.ini."""
        pytest_ini_path = self.project_root / "pytest.ini"
        
        content = """[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
asyncio_mode = auto
filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
"""
        
        pytest_ini_path.write_text(content)
        self.fixes_applied.append("Created/updated pytest.ini")
    
    def fix_conftest(self):
        """Repară conftest.py pentru probleme cunoscute."""
        conftest_path = self.project_root / "tests" / "conftest.py"
        
        if not conftest_path.exists():
            return
        
        content = conftest_path.read_text()
        
        # Fix unique username issue
        if "uuid.uuid4()" not in content:
            content = content.replace(
                'username=f"testadmin"',
                'username=f"testadmin_{str(uuid.uuid4())[:8]}"'
            )
            content = content.replace(
                'username=f"testuser"', 
                'username=f"testuser_{str(uuid.uuid4())[:8]}"'
            )
            
            # Add uuid import
            if "import uuid" not in content:
                content = "import uuid\n" + content
        
        # Fix ASGITransport issue
        if "ASGITransport" not in content:
            content = content.replace(
                "from httpx import AsyncClient",
                "from httpx import AsyncClient, ASGITransport"
            )
            
            content = content.replace(
                "async with AsyncClient(app=app",
                "async with AsyncClient(transport=ASGITransport(app=app)"
            )
        
        conftest_path.write_text(content)
        self.fixes_applied.append("Fixed conftest.py issues")
    
    def create_missing_test_files(self):
        """Creează fișierele de test lipsă."""
        test_templates = {
            "test_health_simple.py": '''"""Simple health check test."""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test basic health endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
''',
            
            "test_imports.py": '''"""Test all imports work correctly."""
import pytest

def test_app_imports():
    """Test that main app components can be imported."""
    from app.main import app
    from app.models.user import User
    from app.models.fond import Fond
    assert app is not None

def test_crud_imports():
    """Test CRUD imports."""
    from app.crud.user import get_user_by_id
    from app.crud.fond import get_fond
    assert get_user_by_id is not None
    assert get_fond is not None
'''
        }
        
        tests_dir = self.project_root / "tests"
        tests_dir.mkdir(exist_ok=True)
        
        for filename, content in test_templates.items():
            test_file = tests_dir / filename
            if not test_file.exists():
                test_file.write_text(content)
                self.fixes_applied.append(f"Created {filename}")


def main():
    """Main function."""
    if not Path("app").exists():
        print("❌ Run this script from the project root directory!")
        sys.exit(1)
    
    diagnostic = TestDiagnostic()
    
    # Show menu
    while True:
        print(f"\n" + "=" * 50)
        print("🛠️  ARHIVARE TEST REPAIR MENU")
        print("=" * 50)
        print("1. Run full diagnostic")
        print("2. Apply automatic fixes")
        print("3. Run simple test")
        print("4. Show test status")
        print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == "1":
            results = diagnostic.run_full_diagnostic()
            
        elif choice == "2":
            diagnostic.apply_automatic_fixes()
            print("\n💡 After applying fixes, run diagnostic again to verify")
            
        elif choice == "3":
            print("\n🧪 Running simple test...")
            try:
                result = subprocess.run([
                    sys.executable, "-m", "pytest", 
                    "tests/test_health_simple.py", "-v"
                ], capture_output=True, text=True)
                
                print(f"Exit code: {result.returncode}")
                if result.stdout:
                    print("STDOUT:")
                    print(result.stdout)
                if result.stderr:
                    print("STDERR:")
                    print(result.stderr)
                    
            except Exception as e:
                print(f"❌ Error running test: {e}")
        
        elif choice == "4":
            print("\n📊 Current test status:")
            try:
                result = subprocess.run([
                    sys.executable, "-m", "pytest", 
                    "tests/", "--collect-only", "-q"
                ], capture_output=True, text=True)
                
                print(result.stdout)
                if result.stderr:
                    print("Issues found:")
                    print(result.stderr)
                    
            except Exception as e:
                print(f"❌ Error checking tests: {e}")
        
        elif choice == "5":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice!")


if __name__ == "__main__":
    main()
