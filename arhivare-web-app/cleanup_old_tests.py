#!/usr/bin/env python3
# cleanup_old_tests.py - Curăță fișierele de test vechi care cauzează probleme

import os
from pathlib import Path

def main():
    """Clean up old test files that might cause conflicts."""
    print("🧹 Curățarea fișierelor de test problematice...")
    
    # Files that should be removed or renamed
    problematic_files = [
        "tests/complete_debug_test.py",
        "tests/debug_search_error.py", 
        "tests/populate_sample_fonds.py",
        "tests/create_admin_user.py",
        "tests/test_api_endpoints.py",  # Uses requests instead of httpx
        "tests/test_auth_smoke.py",     # Incomplete
        "tests/test_crud_user.py",      # Uses direct DB connection
        "tests/test_fonds_crud.py",     # Uses direct DB connection
        "tests/test_minimal_app.py",    # Creates separate FastAPI app
        "tests/test_imports.py",        # Has main() instead of proper tests
    ]
    
    # Directories to clean
    backup_dir = Path("tests/backup_old")
    backup_dir.mkdir(exist_ok=True)
    
    moved_files = []
    missing_files = []
    
    for file_path in problematic_files:
        path = Path(file_path)
        
        if path.exists():
            # Move to backup directory instead of deleting
            backup_path = backup_dir / path.name
            
            try:
                path.rename(backup_path)
                moved_files.append(file_path)
                print(f"✅ Moved {file_path} → {backup_path}")
            except Exception as e:
                print(f"❌ Could not move {file_path}: {e}")
        else:
            missing_files.append(file_path)
    
    print(f"\n📊 Rezultate:")
    print(f"   - Fișiere mutate în backup: {len(moved_files)}")
    print(f"   - Fișiere care nu existau: {len(missing_files)}")
    
    if moved_files:
        print(f"\n📁 Fișierele au fost mutate în: {backup_dir}")
        print("   Poți să le ștergi permanent dacă nu mai sunt necesare")
    
    # Create proper __init__.py files if missing
    init_files = [
        "tests/__init__.py",
    ]
    
    for init_file in init_files:
        init_path = Path(init_file)
        if not init_path.exists():
            init_path.write_text("# Test package\n")
            print(f"✅ Created {init_file}")
    
    # Check remaining test files
    remaining_tests = list(Path("tests").glob("test_*.py"))
    print(f"\n🧪 Fișiere de test rămase: {len(remaining_tests)}")
    for test_file in remaining_tests:
        print(f"   - {test_file.name}")
    
    print(f"\n✨ Cleanup complet! Acum poți rula testele cu:")
    print(f"   python run_tests.py")
    print(f"   sau")
    print(f"   pytest tests/ -v")

if __name__ == "__main__":
    main()
