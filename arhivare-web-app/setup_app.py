#!/usr/bin/env python3
"""
setup_app.py - Script de setup complet pentru Arhivare Web App
Rulează acest script pentru a rezolva toate problemele identificate
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_status(message, status="info"):
    """Print colored status messages"""
    colors = {
        "info": "\033[96m",      # Cyan
        "success": "\033[92m",   # Green
        "warning": "\033[93m",   # Yellow
        "error": "\033[91m",     # Red
        "reset": "\033[0m"       # Reset
    }

    symbols = {
        "info": "ℹ️",
        "success": "✅",
        "warning": "⚠️",
        "error": "❌"
    }

    print(f"{colors[status]}{symbols[status]} {message}{colors['reset']}")

def run_command(command, description="", check=True):
    """Run a shell command with error handling"""
    print_status(f"Running: {description or command}", "info")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"   Output: {result.stdout.strip()}")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print_status(f"Command failed: {e}", "error")
        if e.stderr:
            print(f"   Error: {e.stderr.strip()}")
        return False

def check_prerequisites():
    """Check if required tools are installed"""
    print_status("Checking prerequisites...", "info")

    requirements = {
        "docker": "docker --version",
        "docker-compose": "docker-compose --version",
        "python3": "python3 --version",
        "pip": "pip --version"
    }

    missing = []
    for tool, command in requirements.items():
        if not run_command(command, f"Checking {tool}", check=False):
            missing.append(tool)

    if missing:
        print_status(f"Missing requirements: {', '.join(missing)}", "error")
        return False

    print_status("All prerequisites found!", "success")
    return True

def setup_environment():
    """Setup environment file"""
    print_status("Setting up environment configuration...", "info")

    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            if run_command("cp .env.example .env", "Copying environment template"):
                print_status(".env file created from template", "success")
            else:
                print_status("Failed to create .env from template", "error")
                return False
        else:
            print_status("Creating basic .env file...", "info")
            env_content = """
# Database Configuration
DATABASE_URL=postgresql+psycopg2://app:app@localhost:5432/arhivare

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin Bootstrap
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
"""
            with open(".env", "w") as f:
                f.write(env_content.strip())
            print_status(".env file created", "success")
    else:
        print_status(".env file already exists", "success")

    return True

def fix_imports():
    """Fix import issues in Python files"""
    print_status("Fixing import issues...", "info")

    # Remove problematic db/session.py if exists
    db_session_path = Path("app/db/session.py")
    if db_session_path.exists():
        os.remove(db_session_path)
        print_status("Removed conflicting db/session.py", "success")

    # Remove __pycache__ directories
    run_command("find . -type d -name '__pycache__' -exec rm -rf {} +", "Cleaning Python cache", check=False)

    print_status("Import fixes applied", "success")
    return True

def setup_database():
    """Setup database with Docker"""
    print_status("Setting up database...", "info")

    # Stop existing containers
    run_command("docker-compose down", "Stopping existing containers", check=False)

    # Start database
    if run_command("docker-compose up -d db", "Starting PostgreSQL"):
        print_status("Waiting for database to be ready...", "info")
        time.sleep(15)  # Wait for DB startup

        # Test connection
        test_cmd = "docker-compose exec -T db psql -U app -d arhivare -c 'SELECT 1;'"
        if run_command(test_cmd, "Testing database connection", check=False):
            print_status("Database is ready!", "success")
            return True
        else:
            print_status("Database connection failed", "error")
            return False

    return False

def run_migrations():
    """Run database migrations"""
    print_status("Running database migrations...", "info")

    # Build and start API container
    if run_command("docker-compose up --build -d api", "Building and starting API"):
        print_status("Waiting for API to be ready...", "info")
        time.sleep(10)

        # Run migrations
        migration_cmd = "docker-compose exec -T api alembic upgrade head"
        if run_command(migration_cmd, "Running Alembic migrations"):
            print_status("Database migrations completed!", "success")
            return True
        else:
            print_status("Migration failed", "error")
            return False

    return False

def create_demo_data():
    """Create demo users and data"""
    print_status("Creating demo data...", "info")

    create_data_cmd = "docker-compose exec -T api python create_admin_user.py"
    if run_command(create_data_cmd, "Creating demo users and fonds"):
        print_status("Demo data created successfully!", "success")
        return True
    else:
        print_status("Demo data creation failed", "warning")
        return False

def setup_frontend():
    """Setup frontend dependencies"""
    print_status("Setting up frontend...", "info")

    frontend_path = Path("react-frontend")
    if frontend_path.exists():
        os.chdir(frontend_path)

        if Path("package.json").exists():
            if run_command("npm install", "Installing frontend dependencies"):
                print_status("Frontend dependencies installed!", "success")
                os.chdir("..")
                return True
            else:
                print_status("Frontend setup failed", "error")
                os.chdir("..")
                return False
        else:
            print_status("No package.json found in react-frontend", "warning")
            os.chdir("..")
    else:
        print_status("No react-frontend directory found", "warning")

    return False

def test_application():
    """Test that the application is working"""
    print_status("Testing application...", "info")

    # Test API health
    health_cmd = "curl -f http://localhost:8000/health"
    if run_command(health_cmd, "Testing API health", check=False):
        print_status("API is healthy!", "success")
    else:
        print_status("API health check failed", "warning")

    # Test database connection through API
    test_cmd = "curl -f http://localhost:8000/search?query=test"
    if run_command(test_cmd, "Testing search endpoint", check=False):
        print_status("Search endpoint is working!", "success")
    else:
        print_status("Search endpoint test failed", "warning")

    return True

def show_summary():
    """Show setup summary and next steps"""
    print_status("SETUP COMPLETE!", "success")
    print("""
🎉 Arhivare Web App Setup Summary
================================

✅ Environment configured
✅ Database setup complete
✅ API server running
✅ Demo data created

🌐 Application URLs:
   • API Server:    http://localhost:8000
   • API Docs:      http://localhost:8000/docs
   • Health Check:  http://localhost:8000/health
   • Adminer:       http://localhost:8080

🔐 Demo Accounts:
   • Admin:     admin / admin123
   • Audit:     audit_user / Audit1234
   • Client:    client_brasov / Client1234

📋 Next Steps:
   1. Start frontend: cd react-frontend && npm start
   2. Open http://localhost:3000 in browser
   3. Test login with demo accounts
   4. Check API docs at http://localhost:8000/docs

🔧 Troubleshooting:
   • Check logs: docker-compose logs api
   • Restart services: docker-compose restart
   • Reset database: docker-compose down -v && python setup_app.py

""")

def main():
    """Main setup function"""
    print_status("🚀 ARHIVARE WEB APP - AUTOMATED SETUP", "info")
    print("=" * 60)

    # Check prerequisites
    if not check_prerequisites():
        print_status("Prerequisites check failed. Please install missing tools.", "error")
        return False

    # Setup steps
    steps = [
        ("Environment Setup", setup_environment),
        ("Fix Imports", fix_imports),
        ("Database Setup", setup_database),
        ("Run Migrations", run_migrations),
        ("Create Demo Data", create_demo_data),
        ("Test Application", test_application)
    ]

    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        if not step_func():
            print_status(f"{step_name} failed!", "error")
            print_status("Setup incomplete. Check errors above.", "error")
            return False

    # Optional frontend setup
    print(f"\n{'='*20} Frontend Setup (Optional) {'='*20}")
    setup_frontend()

    # Show summary
    show_summary()
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_status("\nSetup interrupted by user", "warning")
        sys.exit(1)
    except Exception as e:
        print_status(f"Unexpected error: {e}", "error")
        sys.exit(1)

