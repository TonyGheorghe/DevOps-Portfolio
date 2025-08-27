# Arhivare Web App - Test Suite Documentation 🧪

Comprehensive testing framework for the Arhivare Web App with automated repair tools and step-by-step debugging.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Repair Tools](#repair-tools)
5. [Running Tests](#running-tests)
6. [Troubleshooting](#troubleshooting)
7. [Test Categories](#test-categories)
8. [Fixtures and Utilities](#fixtures-and-utilities)
9. [CI/CD Integration](#cicd-integration)

## 🚀 Overview

This test suite provides comprehensive testing for the Arhivare Web App, including:

- **Unit Tests** - Individual component testing
- **Integration Tests** - API endpoint testing  
- **Authentication Tests** - JWT and role-based access
- **Database Tests** - CRUD operations and data integrity
- **Search Tests** - Public search functionality
- **Automated Repairs** - Self-healing test environment

### Key Features

- 🔧 **Auto-repair tools** for common test failures
- 📊 **Step-by-step execution** with detailed reporting
- 🎯 **Modular test structure** for easy maintenance
- 🔍 **Comprehensive diagnostics** for quick debugging
- ⚡ **Fast feedback loops** with optimized test ordering

## ⚡ Quick Start

### 1. Environment Setup

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx pytest-cov

# Verify installation
python -c "import pytest, httpx; print('✅ Dependencies OK')"
```

### 2. Auto-Repair (Recommended)

If tests are failing, run the auto-repair tool first:

```bash
# Run comprehensive repair
python tests/test_repair_script.py

# Run diagnostic
python tests/test_diagnostic_tool.py
```

### 3. Quick Test Run

```bash
# Step-by-step testing (recommended for first run)
python tests/run_tests_step_by_step.py

# Or run all tests directly
pytest tests/ -v
```

### 4. Verify Everything Works

```bash
# Basic connectivity test
pytest tests/test_basic.py -v

# Health check
pytest tests/test_health_simple.py -v

# If both pass, run full suite:
pytest tests/ -v --tb=short
```

## 🏗️ Test Structure

### Directory Layout

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and configuration
├── pytest.ini              # pytest configuration
│
├── test_basic.py           # Basic functionality tests
├── test_health.py          # Health endpoint tests
├── test_auth.py            # Authentication and JWT tests
├── test_search.py          # Public search functionality
├── test_crud.py            # Database CRUD operations
├── test_fonds_api.py       # Fonds management API
├── test_user_creation.py   # User management functionality
│
├── test_repair_script.py       # Auto-repair tool
├── test_diagnostic_tool.py     # Diagnostic utilities
├── run_tests_step_by_step.py   # Interactive test runner
└── debug_test_runner.py        # Advanced debugging tools
```

### Test Categories by Priority

1. **Critical Tests** 🚨
   - Basic Python functionality
   - App imports and initialization
   - Health endpoint connectivity

2. **Core Tests** ⚙️
   - Authentication (login/JWT)
   - Database operations
   - User management

3. **Feature Tests** 🔍
   - Search functionality
   - CRUD operations
   - API endpoints

4. **Integration Tests** 🔗
   - End-to-end workflows
   - Role-based access control
   - Data consistency

## 🔧 Repair Tools

### Automatic Repair Script

The repair script fixes common issues automatically:

```bash
python tests/test_repair_script.py
```

**What it fixes:**
- UNIQUE constraint errors in test fixtures
- AsyncClient configuration issues  
- Outdated user model references
- Missing pytest.ini configuration
- Route definition problems
- Database fixture issues

### Diagnostic Tool

Comprehensive environment analysis:

```bash
python tests/test_diagnostic_tool.py
```

**What it checks:**
- Project structure integrity
- Dependencies and versions
- Import resolution
- Database model consistency  
- Test configuration validity
- Route availability

### Manual Debugging

For complex issues:

```bash
python tests/debug_test_runner.py
```

**Features:**
- Interactive test selection
- Detailed error analysis
- Route inspection
- Fixture debugging

## 🏃‍♂️ Running Tests

### Interactive Runner (Recommended)

```bash
python tests/run_tests_step_by_step.py
```

**Menu Options:**
1. **Check prerequisites** - Verify environment
2. **Run step-by-step tests** - Ordered execution with stopping on critical failures
3. **Run single test** - Interactive file/test selection
4. **Run all tests** - Standard pytest execution
5. **Run with coverage** - Generate coverage reports

### Direct pytest Commands

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test function
pytest tests/test_auth.py::TestAuthEndpoints::test_login_success_returns_token -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Stop on first failure
pytest tests/ -x

# Show local variables on failure
pytest tests/ --tb=long --showlocals

# Run only failed tests from last run
pytest tests/ --lf
```

### Test Selection

```bash
# Run only critical tests
pytest tests/ -m critical -v

# Skip slow tests  
pytest tests/ -m "not slow" -v

# Run integration tests only
pytest tests/ -m integration -v
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. AsyncClient Configuration Error

**Error:** `TypeError: ASGITransport() missing required argument`

**Solution:**
```bash
# Auto-fix
python tests/test_repair_script.py

# Manual fix in conftest.py:
from httpx import AsyncClient, ASGITransport

async with AsyncClient(
    transport=ASGITransport(app=app),
    base_url="http://testserver"
) as client:
```

#### 2. UNIQUE Constraint Violations

**Error:** `UNIQUE constraint failed: users.username`

**Solution:**
```bash
# Auto-fix (recommended)
python tests/test_repair_script.py

# Manual fix - add unique identifiers:
import uuid
username = f"testuser_{str(uuid.uuid4())[:8]}"
```

#### 3. Route Not Found (404 instead of 401)

**Error:** Test expects 401 but gets 404

**Solution:**
```bash
# Debug available routes
python -c "
from app.main import app
for route in app.routes:
    if hasattr(route, 'path'):
        print(f'{route.methods} {route.path}')
"

# Update test to use correct route
```

#### 4. Database Model Issues

**Error:** `AttributeError: 'User' object has no attribute 'is_active'`

**Solution:**
```bash
# Auto-fix role references
python tests/test_repair_script.py

# Manual: Update test to use correct model structure
```

#### 5. Import Errors

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
# Run from project root directory
cd /path/to/arhivare-web-app

# Verify project structure
ls -la  # Should show 'app/' and 'tests/' directories

# Add to PYTHONPATH if needed
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Debug Workflow

When tests fail, follow this systematic approach:

1. **Run Repair Tool**
   ```bash
   python tests/test_repair_script.py
   ```

2. **Check Prerequisites**
   ```bash
   python tests/run_tests_step_by_step.py
   # Select option 1: Check prerequisites
   ```

3. **Run Basic Tests**
   ```bash
   pytest tests/test_basic.py -v
   ```

4. **Isolate the Problem**
   ```bash
   # Run single failing test with maximum detail
   pytest tests/test_failing.py::test_function -v -s --tb=long
   ```

5. **Check Environment**
   ```bash
   # Verify app can start
   python -c "from app.main import app; print('App loads OK')"
   
   # Check database connection
   python tests/create_admin_user.py check
   ```

## 📊 Test Categories

### Authentication Tests (`test_auth.py`)

Tests JWT authentication, login/logout, and protected endpoints.

**Key Test Cases:**
- Login with valid/invalid credentials
- JWT token generation and validation
- Protected endpoint access control
- Role-based authorization
- Token expiration handling

**Fixtures Used:** `admin_user`, `auth_headers`, `client`

**Example:**
```python
@pytest.mark.asyncio
async def test_login_success(client, admin_user):
    response = await client.post("/auth/login", json={
        "username": admin_user.username,
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Search Tests (`test_search.py`)

Tests public search functionality without authentication.

**Key Test Cases:**
- Search with various query parameters
- Pagination and limiting
- Case-insensitive search
- Active/inactive fond filtering
- Search count accuracy

**Fixtures Used:** `sample_fonds`, `client`

**Example:**
```python
@pytest.mark.asyncio
async def test_search_returns_results(client, sample_fonds):
    response = await client.get("/search", params={"query": "brașov"})
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) >= 1
```

### CRUD Tests (`test_crud.py`)

Tests database operations directly using CRUD functions.

**Key Test Cases:**
- Create, read, update, delete operations
- Data validation and constraints
- Relationship handling
- Pagination and filtering
- Soft delete functionality

**Fixtures Used:** `db_session`, `sample_fonds`, `admin_user`

### API Tests (`test_fonds_api.py`)

Tests full HTTP API endpoints for fond management.

**Key Test Cases:**
- CRUD operations via HTTP
- Authentication requirements
- Input validation
- Error handling
- Response format consistency

**Fixtures Used:** `client`, `auth_headers`, `sample_fonds`

### Health Tests (`test_health.py`)

Tests basic application health and connectivity.

**Key Test Cases:**
- Health endpoint accessibility
- Database connectivity
- Response format validation
- No authentication required

**Fixtures Used:** `client`

## 🔧 Fixtures and Utilities

### Core Fixtures (defined in `conftest.py`)

#### Database Fixtures

```python
@pytest.fixture(scope="function")
def db_session():
    """Provides clean database session for each test."""
    # Creates isolated SQLite in-memory database
    # Auto-cleaned after each test

@pytest.fixture(scope="function")
def empty_db(db_session):
    """Explicitly empty database for specific tests."""
```

#### User Fixtures

```python
@pytest.fixture(scope="function")
def admin_user(db_session):
    """Creates unique admin user with random suffix."""
    # Uses uuid to prevent UNIQUE constraint violations
    
@pytest.fixture(scope="function") 
def regular_user(db_session):
    """Creates unique client user with random suffix."""
```

#### Data Fixtures

```python
@pytest.fixture(scope="function")
def sample_fonds(db_session):
    """Creates realistic Romanian company data."""
    # Includes both active and inactive fonds
    # Covers various business types and locations
```

#### HTTP Client Fixtures

```python
@pytest.fixture(scope="function")
async def client():
    """Provides configured AsyncClient for HTTP testing."""
    # Uses ASGITransport for proper FastAPI integration
    # Configured with testserver base URL

@pytest.fixture(scope="function")
async def auth_headers(client, admin_user):
    """Provides authentication headers for protected endpoints."""
    # Performs login and returns Bearer token headers
```

### Utility Functions

#### Database Helpers

```python
def create_test_user(db_session, username=None, role="client"):
    """Helper to create users with unique identifiers."""

def create_test_fond(db_session, owner_id=None):
    """Helper to create fonds with realistic data."""
```

#### Authentication Helpers

```python
async def get_auth_token(client, username, password):
    """Helper to get JWT token for testing."""

def verify_token_structure(token_data):
    """Helper to validate JWT response format."""
```

## 📈 Coverage and Reporting

### Generate Coverage Report

```bash
# Install coverage tools
pip install pytest-cov

# Run tests with coverage
pytest tests/ --cov=app --cov-report=html --cov-report=term

# Open HTML report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Coverage Configuration

Add to `pytest.ini`:

```ini
[tool:pytest]
addopts = --cov=app --cov-report=term-missing --cov-fail-under=80
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_arhivare
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-asyncio httpx pytest-cov
    
    - name: Run repair tools
      run: python tests/test_repair_script.py
    
    - name: Run tests
      run: |
        export DATABASE_URL="postgresql://postgres:postgres@localhost/test_arhivare"
        pytest tests/ -v --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

#### Docker Testing

```dockerfile
# Dockerfile.test
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install pytest pytest-asyncio httpx pytest-cov

COPY . .
RUN python tests/test_repair_script.py
CMD ["pytest", "tests/", "-v", "--cov=app"]
```

## 🎯 Best Practices

### Writing New Tests

1. **Use Descriptive Names**
   ```python
   # Good
   def test_login_with_invalid_credentials_returns_401():
   
   # Bad  
   def test_login_fail():
   ```

2. **Follow AAA Pattern**
   ```python
   def test_create_fond_success(client, auth_headers):
       # Arrange
       fond_data = {"company_name": "Test Corp", "holder_name": "Test Archive"}
       
       # Act
       response = await client.post("/fonds/", json=fond_data, headers=auth_headers)
       
       # Assert
       assert response.status_code == 201
       assert response.json()["company_name"] == fond_data["company_name"]
   ```

3. **Use Fixtures for Common Setup**
   ```python
   @pytest.fixture
   def sample_fond_data():
       return {
           "company_name": "Test Company",
           "holder_name": "Test Holder",
           "address": "Test Address"
       }
   ```

4. **Test Edge Cases**
   ```python
   @pytest.mark.parametrize("invalid_email", [
       "not-an-email",
       "@missing-local.com", 
       "missing-at-sign.com",
       ""
   ])
   def test_invalid_email_validation(invalid_email):
       # Test various invalid email formats
   ```

### Debugging Failed Tests

1. **Use Print Debugging**
   ```python
   def test_something(client):
       response = await client.get("/endpoint")
       print(f"Status: {response.status_code}")
       print(f"Response: {response.text}")
       assert response.status_code == 200
   ```

2. **Run with Output Capture Disabled**
   ```bash
   pytest tests/test_file.py::test_function -s -v
   ```

3. **Use Debugger**
   ```python
   def test_something():
       import pdb; pdb.set_trace()  # Add breakpoint
       # Test code here
   ```

### Test Data Management

1. **Use Factories for Complex Data**
   ```python
   def create_fond_data(**overrides):
       defaults = {
           "company_name": "Default Corp",
           "holder_name": "Default Archive", 
           "address": "Default Address"
       }
       defaults.update(overrides)
       return defaults
   ```

2. **Isolate Test Data**
   ```python
   # Each test gets its own data
   @pytest.fixture(scope="function")  # Not "session"
   def test_user(db_session):
       return create_unique_user()
   ```

## 🚀 Advanced Usage

### Custom Markers

Add to `pytest.ini`:

```ini
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    auth: marks tests related to authentication
    database: marks tests that require database
    api: marks tests for API endpoints
```

Usage:

```python
@pytest.mark.slow
@pytest.mark.integration
def test_full_user_workflow():
    # Complex integration test
```

Run specific markers:

```bash
# Run only auth tests
pytest -m auth -v

# Skip slow tests
pytest -m "not slow" -v

# Run auth and database tests
pytest -m "auth or database" -v
```

### Parametrized Tests

```python
@pytest.mark.parametrize("username,password,expected_status", [
    ("admin", "admin123", 200),
    ("admin", "wrong", 401),
    ("nonexistent", "password", 401),
    ("", "", 422),
])
def test_login_scenarios(client, username, password, expected_status):
    response = await client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert response.status_code == expected_status
```

### Mock External Dependencies

```python
from unittest.mock import patch, MagicMock

@patch('app.services.external_api.call_external_service')
def test_with_mocked_external_call(mock_external):
    mock_external.return_value = {"status": "success"}
    # Test code that uses external service
```

### Async Testing Patterns

```python
@pytest.mark.asyncio
async def test_concurrent_requests(client):
    # Test handling of concurrent requests
    import asyncio
    
    tasks = [
        client.get("/search", params={"query": f"test{i}"})
        for i in range(10)
    ]
    
    responses = await asyncio.gather(*tasks)
    
    for response in responses:
        assert response.status_code == 200
```

## 📚 Resources and References

### Documentation Links

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Plugin](https://pytest-asyncio.readthedocs.io/)
- [HTTPX Testing](https://www.python-httpx.org/advanced/#testing)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

### Useful Commands Reference

```bash
# Test discovery and collection
pytest --collect-only                    # Show all tests without running
pytest tests/ -k "auth"                  # Run tests with "auth" in name
pytest tests/ --durations=10             # Show 10 slowest tests

# Debugging and output
pytest --tb=short                        # Short traceback format
pytest --tb=long --showlocals           # Detailed output with variables
pytest -v -s                            # Verbose with output capture disabled
pytest --pdb                            # Drop into debugger on failure

# Coverage and reporting
pytest --cov=app                        # Show coverage
pytest --cov=app --cov-report=html      # Generate HTML coverage report
pytest --cov-fail-under=80              # Fail if coverage below 80%

# Test selection
pytest -x                               # Stop on first failure
pytest --lf                             # Run last failed tests only
pytest --ff                             # Run failures first, then rest
pytest -m "not slow"                    # Skip tests marked as slow
```

### Environment Variables for Testing

```bash
# Set test database URL
export DATABASE_URL="postgresql://user:pass@localhost/test_db"

# Disable logging during tests
export LOG_LEVEL="ERROR"

# Use test configuration
export ENVIRONMENT="test"

# Speed up password hashing in tests
export BCRYPT_ROUNDS=4
```

## 🤝 Contributing to Tests

### Adding New Tests

1. **Create test file** following naming convention `test_*.py`
2. **Add appropriate fixtures** in `conftest.py` if needed
3. **Use existing patterns** from similar test files
4. **Add markers** for categorization
5. **Update this README** if adding new test categories

### Test Code Review Checklist

- [ ] Tests have descriptive names
- [ ] Tests are isolated and don't depend on each other
- [ ] Tests clean up after themselves
- [ ] Tests cover both happy path and edge cases
- [ ] Tests use appropriate fixtures
- [ ] Tests include assertions with meaningful messages
- [ ] Tests are properly categorized with markers
- [ ] Tests run reliably (no flaky tests)

### Reporting Issues

When reporting test failures:

1. **Run diagnostic tool** and include output
2. **Provide minimal reproduction** steps
3. **Include environment details** (OS, Python version, dependencies)
4. **Show full error traceback** with `--tb=long`
5. **Mention if issue is intermittent** or consistent

---

**Happy Testing! 🧪✨**

*For additional support, check the main project README or open an issue with the `testing` label.*
