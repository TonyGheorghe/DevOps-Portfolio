#!/bin/bash
# cleanup-app.sh - Script pentru curățarea aplicației Arhivare Web App

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}🧹 ARHIVARE WEB APP - CLEANUP SCRIPT${NC}"
echo "========================================="

# 1. Clean Python cache files
print_step "1. Cleaning Python cache files..."
find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find . -name '*.pyc' -delete 2>/dev/null || true
find . -name '*.pyo' -delete 2>/dev/null || true
find . -name '*.pyd' -delete 2>/dev/null || true
find . -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null || true
print_success "Python cache cleaned"

# 2. Remove duplicate/conflicting database files
print_step "2. Removing duplicate database configurations..."

# Check for conflicting db directory
if [ -d "app/db" ]; then
    print_warning "Found app/db/ directory (conflicts with app/database.py)"
    echo "Contents of app/db/:"
    ls -la app/db/ 2>/dev/null || true
    
    read -p "Remove app/db/ directory? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf app/db/
        print_success "Removed app/db/ directory"
    else
        print_warning "Kept app/db/ directory (may cause import conflicts)"
    fi
fi

# 3. Clean up old/backup files
print_step "3. Finding and removing backup/temporary files..."

# Remove backup files
find . -name "*.bak" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Remove old migration backups if they exist
if [ -d "alembic/versions/backup" ]; then
    print_warning "Found backup migration directory"
    ls -la alembic/versions/backup/ 2>/dev/null || true
    read -p "Remove backup migrations? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf alembic/versions/backup/
        print_success "Removed backup migrations"
    fi
fi

# 4. Check for unused/duplicate files
print_step "4. Identifying potentially unused files..."

# List potentially unused files
echo "Potentially unused files found:"

# Old test files that might not be needed
if [ -d "tests/backup_old" ]; then
    echo "  📁 tests/backup_old/ (old test backups)"
fi

# Debug/development files
if [ -f "debug_models.py" ]; then
    echo "  🐛 debug_models.py (debug script)"
fi

if [ -f "docker-fix-commands.sh" ]; then
    echo "  🔧 docker-fix-commands.sh (fix script)"
fi

# Development HTML files
if [ -f "frontend/index.html" ]; then
    echo "  🌐 frontend/index.html (simple frontend, superseded by React)"
fi

# Ask user what to clean
echo ""
print_warning "Select what to clean up:"

# 5. Clean unused development files
if [ -f "debug_models.py" ]; then
    read -p "Remove debug_models.py? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm debug_models.py
        print_success "Removed debug_models.py"
    fi
fi

if [ -f "docker-fix-commands.sh" ]; then
    read -p "Remove docker-fix-commands.sh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm docker-fix-commands.sh
        print_success "Removed docker-fix-commands.sh"
    fi
fi

# 6. Clean simple HTML frontend (superseded by React)
if [ -d "frontend" ]; then
    print_warning "Found simple HTML frontend (superseded by React frontend)"
    ls -la frontend/ 2>/dev/null || true
    read -p "Remove simple HTML frontend? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf frontend/
        print_success "Removed simple HTML frontend"
    fi
fi

# 7. Clean old test backups
if [ -d "tests/backup_old" ] || [ -d "tests/old_tests_backup" ]; then
    print_warning "Found old test backup directories"
    read -p "Remove old test backups? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf tests/backup_old/ tests/old_tests_backup/ 2>/dev/null || true
        print_success "Removed old test backups"
    fi
fi

# 8. Clean unnecessary setup scripts
if [ -f "setup_app.py" ]; then
    read -p "Remove setup_app.py (since app is now working)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm setup_app.py
        print_success "Removed setup_app.py"
    fi
fi

# 9. Clean Docker volumes and images (optional)
print_step "9. Docker cleanup options..."
read -p "Remove unused Docker images and volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -f
    print_success "Docker cleanup completed"
fi

# 10. Show final directory structure
print_step "10. Final directory structure:"
echo "📁 Current project structure:"
tree -I 'node_modules|__pycache__|*.pyc|.pytest_cache|build|dist' -L 3 2>/dev/null || \
find . -type d -name node_modules -prune -o -type d -name __pycache__ -prune -o -type f -print | head -20

print_success "🎉 Cleanup completed!"

# 11. Show important files that should remain
echo ""
echo -e "${BLUE}📋 IMPORTANT FILES REMAINING:${NC}"
echo "✅ Core Application:"
echo "   • app/ (backend Python code)"
echo "   • react-frontend/ (frontend React code)" 
echo "   • alembic/ (database migrations)"
echo "   • requirements.txt"
echo "   • docker-compose.yml"
echo "   • Dockerfile"
echo ""
echo "✅ Configuration:"
echo "   • .env (environment variables)"
echo "   • .gitignore"
echo "   • pytest.ini"
echo ""
echo "✅ Documentation:"
echo "   • README.md"
echo ""
echo "✅ Scripts:"
echo "   • create_admin_user.py (for demo data)"
echo "   • dev-setup.sh (development setup)"

# 12. Update .gitignore to prevent future clutter
print_step "12. Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Cleanup additions
*.bak
*.tmp
*~
.DS_Store
debug_*.py
fix_*.py
setup_app.py
docker-fix-*.sh

# Test backups
tests/backup_old/
tests/old_tests_backup/

# Development HTML (superseded by React)
frontend/

EOF

print_success ".gitignore updated"

echo ""
echo -e "${GREEN}🎉 CLEANUP COMPLETE!${NC}"
echo "Your application is now clean and organized."
echo ""
echo "Next steps:"
echo "1. Test that everything still works: docker compose up -d"
echo "2. Test frontend: cd react-frontend && npm start"
echo "3. Commit the cleaned version: git add . && git commit -m 'Clean up project structure'"
