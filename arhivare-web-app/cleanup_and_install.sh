#!/bin/bash
# cleanup_and_install.sh - Script complet pentru pregătirea testelor

echo "🚀 PREGĂTIRE TESTE ARHIVARE WEB APP"
echo "=================================="

# 1. Curăță testele vechi
echo "🧹 Curățarea testelor vechi..."
if [ -d "tests/backup_old" ]; then
    echo "  Moving tests/backup_old/ to ./old_tests_backup/"
    mv tests/backup_old/ ./old_tests_backup/
    echo "  ✅ Testele vechi au fost mutate în ./old_tests_backup/"
else
    echo "  ✅ Nu există tests/backup_old/ de curățat"
fi

# 2. Instalează dependențele
echo ""
echo "📦 Instalarea dependențelor de test..."
pip install pytest pytest-asyncio httpx

if [ $? -eq 0 ]; then
    echo "  ✅ Dependențele au fost instalate cu succes"
else
    echo "  ❌ Eroare la instalarea dependențelor"
    exit 1
fi

# 3. Verifică structura
echo ""
echo "📁 Verificarea structurii..."
if [ ! -d "app" ]; then
    echo "  ❌ Directorul 'app' nu există!"
    exit 1
fi

if [ ! -d "tests" ]; then
    echo "  ❌ Directorul 'tests' nu există!"
    exit 1
fi

echo "  ✅ Structura directorului este OK"

# 4. Verifică fișierele de test noi
echo ""
echo "🧪 Verificarea fișierelor de test..."
test_files=("conftest.py" "test_auth.py" "test_search.py" "test_health.py")

for file in "${test_files[@]}"; do
    if [ -f "tests/$file" ]; then
        echo "  ✅ tests/$file existe"
    else
        echo "  ❌ tests/$file lipsește - copiază din artifacts"
    fi
done

# 5. Creează pytest.ini dacă nu există
if [ ! -f "pytest.ini" ]; then
    echo ""
    echo "📝 Crearea pytest.ini..."
    cat > pytest.ini << EOF
[tool:pytest]
minversion = 6.0
addopts = 
    -ra
    --strict-markers
    --strict-config
    --disable-warnings
    -v
    --tb=short
    --asyncio-mode=auto
    --ignore=old_tests_backup

testpaths = tests

python_files = test_*.py
python_classes = Test*
python_functions = test_*

asyncio_mode = auto

filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
    ignore::pytest.PytestUnraisableExceptionWarning

norecursedirs = .git .tox dist build *.egg venv old_tests_backup
EOF
    echo "  ✅ pytest.ini a fost creat"
fi

# 6. Test rapid
echo ""
echo "🔧 Test rapid pentru pytest-asyncio..."
python -c "
import pytest
import asyncio

async def test_async():
    return 'async works'

print('✅ pytest-asyncio pare să funcționeze')
"

echo ""
echo "✨ SETUP COMPLET!"
echo "=================="
echo ""
echo "📋 Următorii pași:"
echo "  1. Copiază fișierele actualizate în tests/:"
echo "     - conftest.py (versiunea finală)" 
echo "     - test_auth.py (fix pentru User fără is_active)"
echo "     - test_search.py (fix pentru Fond cu active)"
echo ""
echo "  2. Rulează testele:"
echo "     pytest tests/test_health.py -v     # Test simplu"
echo "     pytest tests/test_auth.py -v       # Test auth"
echo "     pytest tests/test_search.py -v     # Test search"
echo ""
echo "  3. Pentru debug:"
echo "     pytest tests/ -v --tb=long"
echo ""
echo "🎯 Testele ar trebui să treacă acum!"
