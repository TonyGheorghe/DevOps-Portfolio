# app/api/routes/client_fonds.py - New Client-Specific Endpoints
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.fond import FondCreate, FondUpdate, FondResponse
from app.crud import fond as crud_fond

router = APIRouter()


@router.get("/my-fonds", response_model=List[FondResponse])
def get_my_fonds(
    skip: int = Query(0, ge=0, description="Numărul de înregistrări de sărit"),
    limit: int = Query(50, ge=1, le=100, description="Numărul maxim de înregistrări returnate"),
    active_only: bool = Query(True, description="Afișează doar fondurile active"),
    search: Optional[str] = Query(None, description="Termenul de căutare"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Endpoint specific pentru clienți - returnează doar fondurile proprii.
    Poate fi folosit de toți utilizatorii, dar va returna rezultate diferite pe baza rolului.
    """
    if current_user.role == "client":
        if search:
            fonds = crud_fond.search_my_fonds(db, current_user.id, search, skip=skip, limit=limit)
        else:
            fonds = crud_fond.get_my_fonds(db, current_user.id, skip=skip, limit=limit, active_only=active_only)
    else:
        # Pentru admin și audit, my-fonds = toate fondurile
        if search:
            fonds = crud_fond.search_all_fonds(db, search, skip=skip, limit=limit, active_only=active_only)
        else:
            fonds = crud_fond.get_fonds(db, skip=skip, limit=limit, active_only=active_only)
    
    return fonds


@router.get("/my-fonds/stats")
def get_my_fonds_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează statistici pentru fondurile clientului.
    """
    if current_user.role == "client":
        stats = crud_fond.get_client_statistics(db, current_user.id)
        return {
            **stats,
            "user_role": current_user.role,
            "username": current_user.username,
            "company_name": current_user.company_name
        }
    else:
        # Pentru admin/audit returnează statistici globale
        stats = crud_fond.get_ownership_statistics(db)
        return {
            **stats,
            "user_role": current_user.role
        }


@router.get("/my-fonds/summary")
def get_my_fonds_summary(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează un rezumat al fondurilor pentru utilizatorul curent.
    """
    summary = crud_fond.get_fonds_summary_for_user(db, current_user)
    summary["username"] = current_user.username
    return summary


@router.post("/my-fonds", response_model=FondResponse, status_code=status.HTTP_201_CREATED)
def create_my_fond(
    fond_in: FondCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Creează un fond nou și îl assignează automat clientului curent.
    Doar clienții pot folosi acest endpoint.
    """
    if current_user.role != "client":
        raise HTTPException(
            status_code=403, 
            detail="Only client users can create fonds using this endpoint"
        )
    
    # Creează fondul și îl assignează automat clientului
    return crud_fond.create_fond(db, fond_in, owner_id=current_user.id)


@router.put("/my-fonds/{fond_id}", response_model=FondResponse)
def update_my_fond(
    fond_id: int,
    fond_in: FondUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un fond din lista clientului.
    Verifică automat că fondul aparține clientului.
    """
    # Verifică permisiunile
    is_allowed, error_msg = crud_fond.validate_fond_access(db, current_user, fond_id, "edit")
    if not is_allowed:
        raise HTTPException(status_code=403, detail=error_msg)
    
    db_fond = crud_fond.update_fond(db, fond_id, fond_in)
    if not db_fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return db_fond


@router.delete("/my-fonds/{fond_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_fond(
    fond_id: int,
    permanent: bool = Query(False, description="Dacă True, șterge definitiv fondul"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Șterge un fond din lista clientului.
    Doar clienții pot șterge fondurile proprii.
    """
    # Verifică permisiunile
    is_allowed, error_msg = crud_fond.validate_fond_access(db, current_user, fond_id, "delete")
    if not is_allowed:
        raise HTTPException(status_code=403, detail=error_msg)
    
    if permanent:
        success = crud_fond.permanently_delete_fond(db, fond_id)
    else:
        success = crud_fond.soft_delete_fond(db, fond_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return None


@router.get("/my-fonds/count")
def count_my_fonds(
    active_only: bool = Query(True, description="Contorizează doar fondurile active"),
    search: Optional[str] = Query(None, description="Termenul de căutare"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează numărul de fonduri ale clientului (cu opțiune de căutare).
    """
    if current_user.role == "client":
        if search:
            count = crud_fond.search_my_fonds_count(db, current_user.id, search)
        else:
            count = crud_fond.get_my_fonds_count(db, current_user.id, active_only=active_only)
        
        return {
            "count": count,
            "user_role": current_user.role,
            "active_only": active_only,
            "search_term": search
        }
    else:
        # Pentru admin/audit
        if search:
            fonds = crud_fond.search_all_fonds(db, search, active_only=active_only)
            count = len(fonds)
        else:
            count = crud_fond.get_fonds_count(db, active_only=active_only)
        
        return {
            "count": count,
            "user_role": current_user.role,
            "active_only": active_only,
            "search_term": search
        }
