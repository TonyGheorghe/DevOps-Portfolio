# app/api/routes/fonds.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.fond import FondCreate, FondUpdate, FondResponse
from app.crud import fond as crud_fond

router = APIRouter()


@router.get("/", response_model=List[FondResponse])
def list_fonds(
    skip: int = Query(0, ge=0, description="Numărul de înregistrări de sărit"),
    limit: int = Query(50, ge=1, le=100, description="Numărul maxim de înregistrări returnate"),
    active_only: bool = Query(True, description="Afișează doar fondurile active"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează toate fondurile (doar pentru admin).
    Suportă paginație și filtrare după status activ.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    fonds = crud_fond.get_fonds(db, skip=skip, limit=limit, active_only=active_only)
    return fonds


@router.get("/{fond_id}", response_model=FondResponse)
def get_fond(
    fond_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează detaliile unui fond după ID (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_fond = crud_fond.get_fond(db, fond_id)
    if not db_fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return db_fond


@router.post("/", response_model=FondResponse, status_code=status.HTTP_201_CREATED)
def create_fond(
    fond_in: FondCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Creează un nou fond arhivistic (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return crud_fond.create_fond(db, fond_in)


@router.put("/{fond_id}", response_model=FondResponse)
def update_fond(
    fond_id: int,
    fond_in: FondUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un fond existent (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_fond = crud_fond.update_fond(db, fond_id, fond_in)
    if not db_fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return db_fond


@router.delete("/{fond_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fond(
    fond_id: int,
    permanent: bool = Query(False, description="Dacă True, șterge definitiv fondul"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Șterge un fond (doar pentru admin).
    - permanent=False: soft delete (marchează ca inactiv)
    - permanent=True: hard delete (șterge definitiv)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if permanent:
        success = crud_fond.permanently_delete_fond(db, fond_id)
    else:
        success = crud_fond.soft_delete_fond(db, fond_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return None


@router.get("/stats/count")
def get_fonds_stats(
    active_only: bool = Query(True, description="Contorizează doar fondurile active"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează statistici despre fonduri (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_count = crud_fond.get_fonds_count(db, active_only=active_only)
    return {
        "total_fonds": total_count,
        "active_only": active_only
    }
