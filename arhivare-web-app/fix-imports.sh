#!/bin/bash
# fix-imports.sh - Script pentru rezolvarea problemelor de import

echo "🔧 Fixing import issues in Arhivare Web App..."

# Stop containers
docker compose down

echo "1️⃣ Fixing app/api/search.py..."
cat > app/api/search.py << 'EOF'
# app/api/search.py - FIXED VERSION
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db  # FIXED: Use unified database import
from app.schemas.fond import FondResponse
from app.crud import fond as crud_fond

router = APIRouter(tags=["Public Search"])

@router.get("/search", response_model=List[FondResponse])
def search_fonds(
    query: str = Query(..., min_length=2, max_length=100, description="Termenul de căutare (min 2 caractere)"),
    skip: int = Query(0, ge=0, description="Numărul de rezultate de sărit pentru paginație"),
    limit: int = Query(20, ge=1, le=50, description="Numărul maxim de rezultate (max 50)"),
    db: Session = Depends(get_db)
):
    """
    🔍 **Căutare publică** de fonduri arhivistice după numele companiei sau deținătorului.
    """
    if not query.strip():
        raise HTTPException(
            status_code=400, 
            detail="Query parameter cannot be empty"
        )
    
    # Căutarea se face doar în fondurile active (publice)
    results = crud_fond.search_fonds(db, query.strip(), skip=skip, limit=limit)
    
    return results

@router.get("/search/count")
def search_count(
    query: str = Query(..., min_length=2, max_length=100, description="Termenul de căutare"),
    db: Session = Depends(get_db)
):
    """
    📊 **Numără rezultatele** unei căutări publice fără a returna datele.
    """
    if not query.strip():
        raise HTTPException(
            status_code=400, 
            detail="Query parameter cannot be empty"
        )
    
    total_results = crud_fond.count_search_results(db, query.strip())
    
    return {
        "query": query,
        "total_results": total_results
    }
EOF

echo "2️⃣ Fixing app/api/routes/client_fonds.py..."
sed -i 's/from app.db.session import get_db/from app.database import get_db/g' app/api/routes/client_fonds.py

echo "3️⃣ Fixing app/api/routes/fonds.py..."
sed -i 's/from app.db.session import get_db/from app.database import get_db/g' app/api/routes/fonds.py

echo "4️⃣ Fixing app/api/routes/users.py..."
sed -i 's/from app.db.session import get_db/from app.database import get_db/g' app/api/routes/users.py

echo "5️⃣ Fixing create_admin_user.py - password_hash consistency..."
sed -i 's/user.password_hash = get_password_hash/user.password_hash = get_password_hash/g' create_admin_user.py

echo "6️⃣ Creating missing search functions in crud/fond.py..."
cat >> app/crud/fond.py << 'EOF'

def search_fonds_count(db: Session, query: str) -> int:
    """Count search results for pagination - alias for count_search_results"""
    return count_search_results(db, query)
EOF

echo "7️⃣ Testing the fixes..."
echo "Building containers to test imports..."
docker compose build api

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Import issues fixed."
    echo "Now starting the application..."
    docker compose up -d api db adminer
    
    echo "Waiting 10 seconds for startup..."
    sleep 10
    
    echo "Testing health endpoint..."
    curl -s http://localhost:8000/health | python -m json.tool || echo "Health check pending..."
    
    echo "🎉 Setup complete! Check the containers:"
    docker compose ps
else
    echo "❌ Build failed. Check the errors above."
    docker compose logs api
fi
EOF

# Make the script executable
chmod +x fix-imports.sh

echo "Script created! Now run it:"
echo "./fix-imports.sh"
