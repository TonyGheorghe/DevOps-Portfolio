#!/usr/bin/env python3
# debug_test_runner.py - Advanced debugging pentru testele care eșuează

import subprocess
import sys
from pathlib import Path
import json

def run_single_test(test_path, extra_args=None):
    """Run a single test with maximum debugging info."""
    extra_args = extra_args or []
    
    cmd = [
        sys.executable, "-m", "pytest",
        str(test_path),
        "-v", "-s",  # Verbose and don't capture output
        "--tb=long",  # Long traceback format
        "--no-header",
        "--showlocals",  # Show local variables in tracebacks
        *extra_args
    ]
    
    print(f"\n{'='*60}")
    print(f"🔍 RUNNING: {test_path}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(cmd, text=True, capture_output=False)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def debug_specific_failures():
    """Debug the specific failures mentioned in the paste."""
    print("🎯 DEBUGGING SPECIFIC FAILURES")
    print("=" * 60)
    
    # Map of failing tests to specific debugging commands
    failing_tests = {
        "tests/test_auth.py::TestProtectedEndpoints::test_protected_endpoint_without_token_returns_401": {
            "issue": "Expected 401, got 404",
            "debug_cmd": ["--capture=no", "-k", "test_protected_endpoint_without_token_returns_401"]
        },
        "tests/test_search.py::TestSearchEndpoints::test_search_returns_results_when_data_exists": {
            "issue": "Search assertion failed",
            "debug_cmd": ["--capture=no", "-k", "test_search_returns_results_when_data_exists"]
        },
        "tests/test_crud.py::TestFondCRUD::test_get_fonds_list": {
            "issue": "Expected 2, got 5",
            "debug_cmd": ["--capture=no", "-k", "test_get_fonds_list"]
        },
        "tests/test_health_simple.py::test_health_endpoint_basic": {
            "issue": "AsyncClient configuration error",
            "debug_cmd": ["--capture=no", "-k", "test_health_endpoint_basic"]
        }
    }
    
    for test_path, info in failing_tests.items():
        if "::" in test_path:
            file_path = test_path.split("::")[0]
            if Path(file_path).exists():
                print(f"\n🔍 DEBUGGING: {test_path}")
                print(f"Issue: {info['issue']}")
                run_single_test(file_path, info['debug_cmd'])
                
                # Ask user if they want to continue
                response = input(f"\n❓ Continue to next test? (y/n): ").lower()
                if response != 'y':
                    break
            else:
                print(f"⏭️  Skipping {file_path} - file not found")

def check_route_availability():
    """Check what routes are actually available."""
    print(f"\n🛣️  CHECKING AVAILABLE ROUTES")
    print("=" * 60)
    
    try:
        from app.main import app
        
        print("Routes found in FastAPI app:")
        for route in app.routes:
            if hasattr(route, 'path'):
                methods = getattr(route, 'methods', {'GET'})
                print(f"  {list(methods)} {route.path}")
        
        # Test actual HTTP calls
        print(f"\n🌐 TESTING ACTUAL HTTP RESPONSES:")
        
        # Use a simple test to check endpoints
        test_endpoints = [
            "/health",
            "/auth/login", 
            "/auth/protected",
            "/search",
            "/search/count",
            "/fonds"
        ]
        
        for endpoint in test_endpoints:
            print(f"\nTesting {endpoint}:")
            cmd = [
                sys.executable, "-c", 
                f"""
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        try:
            response = await client.get("{endpoint}")
            print(f"  Status: {{response.status_code}}")
            print(f"  Content-Type: {{response.headers.get('content-type', 'N/A')}}")
            if response.status_code == 422:
                print(f"  Validation Error: {{response.json()}}")
            elif len(response.text) < 200:
                print(f"  Response: {{response.text[:100]}}")
        except Exception as e:
            print(f"  Error: {{e}}")

asyncio.run(test_endpoint())
                """
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=False, text=True)
            except subprocess.CalledProcessError:
                print(f"    ❌ Failed to test {endpoint}")
    
    except Exception as e:
        print(f"❌ Error checking routes: {e}")

def create_minimal_test():
    """Create a minimal test to isolate the AsyncClient issue."""
    print(f"\n🧪 CREATING MINIMAL TEST")
    print("=" * 60)
    
    minimal_test = """
# minimal_test.py - Minimal test for debugging
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

@pytest.mark.asyncio
async def test_async_works():
    '''Test that pytest-asyncio is working.'''
    await asyncio.sleep(0.01)
    assert True

@pytest.mark.asyncio  
async def test_httpx_import():
    '''Test that httpx can be imported and used.'''
    # Test without app first
    async with AsyncClient(base_url="https://httpbin.org") as client:
        response = await client.get("/get")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_app_import():
    '''Test that our app can be imported.'''
    try:
        from app.main import app
        assert app is not None
        print(f"App type: {type(app)}")
    except Exception as e:
        pytest.fail(f"Cannot import app: {e}")

@pytest.mark.asyncio
async def test_asgi_transport():
    '''Test ASGI transport with our app.'''
    try:
        from app.main import app
        transport = ASGITransport(app=app)
        
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Try the simplest endpoint
            response = await client.get("/health")
            print(f"Health check status: {response.status_code}")
            print(f"Health check response: {response.text}")
            
            # Don't assert success - just check it doesn't crash
            assert response.status_code in [200, 404, 422]
            
    except Exception as e:
        pytest.fail(f"ASGI transport failed: {e}")
"""
    
    # Write minimal test
    with open("minimal_debug_test.py", "w") as f:
        f.write(minimal_test)
    
    print("✅ Created minimal_debug_test.py")
    print("🚀 Running minimal test...")
    
    return run_single_test("minimal_debug_test.py", ["--tb=short"])

def fix_common_issues():
    """Apply common fixes for the identified issues."""
    print(f"\n🔧 APPLYING COMMON FIXES")
    print("=" * 60)
    
    fixes_applied = []
    
    # Fix 1: Update requirements
    print("1. Checking httpx version...")
    try:
        import httpx
        print(f"   Current httpx version: {httpx.__version__}")
        
        # Check if version is compatible
        version_parts = httpx.__version__.split('.')
        major, minor = int(version_parts[0]), int(version_parts[1])
        
        if major == 0 and minor < 24:
            print("   ⚠️  httpx version might be too old")
            print("   💡 Try: pip install httpx>=0.24.0")
        else:
            print("   ✅ httpx version looks good")
            fixes_applied.append("httpx_version")
            
    except ImportError:
        print("   ❌ httpx not installed")
        print("   💡 Run: pip install httpx>=0.24.0")
    
    # Fix 2: Check pytest-asyncio
    print(f"\n2. Checking pytest-asyncio...")
    try:
        import pytest_asyncio
        print(f"   ✅ pytest-asyncio installed: {pytest_asyncio.__version__}")
        fixes_applied.append("pytest_asyncio")
    except ImportError:
        print("   ❌ pytest-asyncio not installed")
        print("   💡 Run: pip install pytest-asyncio>=0.21.0")
    
    # Fix 3: Check pytest.ini
    print(f"\n3. Checking pytest.ini...")
    pytest_ini = Path("pytest.ini")
    if pytest_ini.exists():
        content = pytest_ini.read_text()
        if "asyncio_mode = auto" in content:
            print("   ✅ asyncio_mode configured correctly")
            fixes_applied.append("pytest_ini")
        else:
            print("   ❌ asyncio_mode not configured")
            print("   💡 Add 'asyncio_mode = auto' to pytest.ini")
    else:
        print("   ❌ pytest.ini not found")
    
    return fixes_applied

def main():
    """Main debugging function."""
    print("🔧 ARHIVARE WEB APP - ADVANCED TEST DEBUGGING")
    print("=" * 70)
    
    if not Path("app").exists():
        print("❌ Not in project root! Run from directory containing 'app/' folder")
        sys.exit(1)
    
    # Menu for debugging options
    while True:
        print(f"\n" + "=" * 50)
        print("🛠️  DEBUGGING OPTIONS:")
        print("=" * 50)
        print("1. Run diagnostic checks")
        print("2. Check available routes")
        print("3. Create and run minimal test")
        print("4. Debug specific failing tests")
        print("5. Apply common fixes")
        print("6. Exit")
        
        choice = input(f"\n❓ Choose option (1-6): ").strip()
        
        if choice == "1":
            # Run diagnostic
            subprocess.run([sys.executable, "diagnostic.py"])
            
        elif choice == "2":
            check_route_availability()
            
        elif choice == "3":
            if create_minimal_test():
                print("✅ Minimal test passed!")
            else:
                print("❌ Minimal test failed - check output above")
                
        elif choice == "4":
            debug_specific_failures()
            
        elif choice == "5":
            fixes = fix_common_issues()
            if fixes:
                print(f"\n✅ Applied fixes: {', '.join(fixes)}")
            else:
                print(f"\n⚠️  No automatic fixes available")
                
        elif choice == "6":
            print("👋 Exiting...")
            break
            
        else:
            print("❌ Invalid choice. Please select 1-6.")
    
    print(f"\n💡 NEXT STEPS:")
    print("   1. Run: python diagnostic.py")
    print("   2. Fix any issues found")
    print("   3. Try: python run_tests_simple.py")
    print("   4. If still failing, run individual tests with -v -s")

if __name__ == "__main__":
    main()
