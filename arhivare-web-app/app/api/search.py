# app/api/search.py - FIXED VERSION
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.fond import FondResponse
from app.crud import fond as crud_fond

# FIXED: Remove prefix from here since it's included without prefix in main.py
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
    
    **Exemplu de utilizare:**
    - `/search?query=Tractorul` - caută toate companiile care conțin "Tractorul"
    - `/search?query=Brașov&limit=10` - caută cu limită de 10 rezultate
    
    **Returnează:** Lista cu contactele deținătorilor arhivelor pentru companiile găsite.
    
    **Nota:** Căutarea este case-insensitive și caută în numele companiei și deținătorul arhivei.
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
    
    Util pentru implementarea paginației în frontend.
    """
    if not query.strip():
        raise HTTPException(
            status_code=400, 
            detail="Query parameter cannot be empty"
        )
    
    total_results = crud_fond.search_fonds_count(db, query.strip())
    
    return {
        "query": query,
        "total_results": total_results
    }
