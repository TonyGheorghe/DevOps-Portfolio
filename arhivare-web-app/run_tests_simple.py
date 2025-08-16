#!/usr/bin/env python3
# run_tests_simple.py - Simplified test runner pentru debugging

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description=""):
    """Execute a command and return success status."""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(cmd, text=True)
        success = result.returncode == 0
        
        print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: {description}")
        return success
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_environment():
    """Check if environment is ready for testing."""
    print("🔍 CHECKING ENVIRONMENT")
    print("=" * 60)
    
    # Check Python version
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check required directories
    required_dirs = ["app", "tests"]
    for dir_name in required_dirs:
        if Path(dir_name).exists():
            print(f"✅ Directory '{dir_name}' exists")
        else:
            print(f"❌ Directory '{dir_name}' missing!")
            return False
    
    # Check key files
    key_files = [
        "app/main.py",
        "app/models/user.py", 
        "app/models/fond.py",
        "tests/conftest.py",
        "pytest.ini"
    ]
    
    for file_path in key_files:
        if Path(file_path).exists():
            print(f"✅ File '{file_path}' exists")
        else:
            print(f"⚠️  File '{file_path}' missing")
    
    return True

def install_dependencies():
    """Install test dependencies."""
    print("\n📦 INSTALLING DEPENDENCIES")
    print("=" * 60)
    
    dependencies = [
        "pytest>=7.4.0",
        "pytest-asyncio>=0.21.0", 
        "httpx>=0.24.0"
    ]
    
    for dep in dependencies:
        success = run_command(
            [sys.executable, "-m", "pip", "install", dep],
            f"Installing {dep}"
        )
        
        if not success:
            print(f"❌ Failed to install {dep}")
            return False
    
    return True

def test_imports():
    """Test that we can import required modules."""
    print("\n🔬 TESTING IMPORTS")
    print("=" * 60)
    
    test_imports = [
        ("pytest", "pytest"),
        ("httpx", "httpx"),
        ("asyncio", "asyncio"),
        ("sqlalchemy", "sqlalchemy"),
        ("fastapi", "fastapi")
    ]
    
    for module_name, import_name in test_imports:
        try:
            __import__(import_name)
            print(f"✅ {module_name} import OK")
        except ImportError as e:
            print(f"❌ {module_name} import FAILED: {e}")
            return False
    
    return True

def run_individual_tests():
    """Run tests individually to isolate problems."""
    print("\n🧪 RUNNING INDIVIDUAL TESTS")
    print("=" * 60)
    
    # Test files in order of simplicity
    test_files = [
        ("test_health.py", "Health endpoint test - simplest"),
        ("test_auth.py", "Authentication tests"),
        ("test_search.py", "Search functionality tests"), 
        ("test_crud.py", "CRUD operations tests"),
        ("test_fonds_api.py", "Fonds API tests")
    ]
    
    results = []
    
    for test_file, description in test_files:
        test_path = Path(f"tests/{test_file}")
        
        if not test_path.exists():
            print(f"⏭️  Skipping {test_file} - file does not exist")
            results.append((test_file, "SKIP"))
            continue
        
        print(f"\n🔍 Testing {test_file}: {description}")
        print("-" * 40)
        
        # Run with maximum verbosity for debugging
        success = run_command(
            [
                sys.executable, "-m", "pytest", 
                str(test_path), 
                "-v", 
                "--tb=short",
                "--no-header",
                "-x"  # Stop on first failure
            ],
            f"Running {test_file}"
        )
        
        results.append((test_file, "PASS" if success else "FAIL"))
        
        if not success:
            print(f"\n🚨 {test_file} failed - stopping here for analysis")
            break
    
    return results

def main():
    """Main test runner function."""
    print("🚀 ARHIVARE WEB APP - SIMPLE TEST RUNNER")
    print("=" * 60)
    
    # Step 1: Check environment
    if not check_environment():
        print("❌ Environment check failed!")
        sys.exit(1)
    
    # Step 2: Install dependencies
    if not install_dependencies():
        print("❌ Dependencies installation failed!")
        sys.exit(1)
    
    # Step 3: Test imports
    if not test_imports():
        print("❌ Import tests failed!")
        sys.exit(1)
    
    # Step 4: Run individual tests
    results = run_individual_tests()
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST RESULTS SUMMARY")
    print(f"{'='*60}")
    
    for test_file, status in results:
        emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⏭️"
        print(f"{emoji} {test_file}: {status}")
    
    passed = sum(1 for _, status in results if status == "PASS")
    total = len([r for r in results if r[1] != "SKIP"])
    
    if passed == total and total > 0:
        print(f"\n🎉 ALL {total} TESTS PASSED!")
    elif passed > 0:
        print(f"\n⚠️  {passed}/{total} tests passed")
        print("   Some tests failed - check output above for details")
    else:
        print(f"\n🚨 ALL TESTS FAILED")
        print("   Check the detailed error messages above")
    
    print("\n💡 For more detailed debugging:")
    print("   pytest tests/test_health.py -v --tb=long -s")
    print("   pytest tests/ --collect-only  # See what tests are discovered")

if __name__ == "__main__":
    main()
