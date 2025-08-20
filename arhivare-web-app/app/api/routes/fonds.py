# app/api/routes/fonds.py - Updated with Ownership Logic
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
    Listează fondurile pe care utilizatorul le poate vedea, pe baza rolului său.
    
    - Admin: toate fondurile
    - Audit: toate fondurile (read-only)
    - Client: doar fondurile proprii
    """
    fonds = crud_fond.get_fonds_for_user(db, current_user, skip=skip, limit=limit, active_only=active_only)
    return fonds


@router.get("/my-fonds", response_model=List[FondResponse])
def list_my_fonds(
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
            fonds = crud_fond.search_fonds(db, search, skip=skip, limit=limit) if active_only else []
        else:
            fonds = crud_fond.get_fonds(db, skip=skip, limit=limit, active_only=active_only)
    
    return fonds


@router.get("/unassigned", response_model=List[FondResponse])
def list_unassigned_fonds(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează fondurile care nu au owner (doar pentru admin).
    Utile pentru assignment către clienți.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view unassigned fonds")
    
    fonds = crud_fond.get_unassigned_fonds(db, skip=skip, limit=limit)
    return fonds


@router.get("/{fond_id}", response_model=FondResponse)
def get_fond(
    fond_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează detaliile unui fond după ID.
    Verifică permisiunile de vizualizare pe baza rolului.
    """
    # Verifică dacă utilizatorul poate vedea acest fond
    if not crud_fond.can_user_view_fond(db, current_user, fond_id):
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a vedea acest fond")
    
    db_fond = crud_fond.get_fond(db, fond_id)
    if not db_fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return db_fond


@router.post("/", response_model=FondResponse, status_code=status.HTTP_201_CREATED)
def create_fond(
    fond_in: FondCreate,
    owner_id: Optional[int] = Query(None, description="ID-ul clientului care va deține fondul"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Creează un nou fond arhivistic.
    
    - Admin: poate crea fonduri și le poate asigna unui client
    - Client: poate crea fonduri doar pentru sine (owner_id va fi automat user.id)
    - Audit: nu poate crea fonduri
    """
    if current_user.role == "audit":
        raise HTTPException(status_code=403, detail="Audit users cannot create fonds")
    
    # Determină owner_id pe baza rolului
    if current_user.role == "admin":
        # Admin poate specifica owner_id sau să lase NULL (unassigned)
        final_owner_id = owner_id
    elif current_user.role == "client":
        # Client poate crea fonduri doar pentru sine
        final_owner_id = current_user.id
        if owner_id and owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Nu poți crea fonduri pentru alți utilizatori")
    else:
        raise HTTPException(status_code=403, detail="Invalid user role")
    
    return crud_fond.create_fond(db, fond_in, owner_id=final_owner_id)


@router.put("/{fond_id}", response_model=FondResponse)
def update_fond(
    fond_id: int,
    fond_in: FondUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un fond existent.
    Verifică permisiunile de editare pe baza rolului și ownership-ului.
    """
    # Verifică dacă utilizatorul poate edita acest fond
    if not crud_fond.can_user_edit_fond(db, current_user, fond_id):
        if current_user.role == "audit":
            raise HTTPException(status_code=403, detail="Audit users have read-only access")
        elif current_user.role == "client":
            raise HTTPException(status_code=403, detail="Poți edita doar fondurile care îți aparțin")
        else:
            raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a edita acest fond")
    
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
    Șterge un fond.
    
    - Admin: poate șterge orice fond
    - Client: poate șterge doar fondurile proprii  
    - Audit: nu poate șterge nimic
    """
    if current_user.role == "audit":
        raise HTTPException(status_code=403, detail="Audit users cannot delete fonds")
    
    # Verifică permisiunile de editare (delete = edit permission)
    if not crud_fond.can_user_edit_fond(db, current_user, fond_id):
        if current_user.role == "client":
            raise HTTPException(status_code=403, detail="Poți șterge doar fondurile care îți aparțin")
        else:
            raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a șterge acest fond")
    
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
    Returnează statistici despre fonduri pe baza rolului utilizatorului.
    """
    if current_user.role in ["admin", "audit"]:
        total_count = crud_fond.get_fonds_count(db, active_only=active_only)
        return {
            "total_fonds": total_count,
            "active_only": active_only,
            "user_role": current_user.role
        }
    elif current_user.role == "client":
        my_count = crud_fond.get_my_fonds_count(db, current_user.id, active_only=active_only)
        return {
            "my_fonds": my_count,
            "active_only": active_only,
            "user_role": current_user.role
        }
    else:
        raise HTTPException(status_code=403, detail="Invalid user role")


# Admin-only ownership management endpoints
@router.post("/{fond_id}/assign-owner")
def assign_fond_owner(
    fond_id: int,
    owner_id: int = Query(..., description="ID-ul clientului căruia îi assignezi fondul"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Assignează un fond unui client (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can assign fond ownership")
    
    # Verifică că owner-ul este un client valid
    from app.crud.user import get_user_by_id
    owner = get_user_by_id(db, owner_id)
    if not owner or owner.role != "client":
        raise HTTPException(status_code=400, detail="Owner must be a client user")
    
    success = crud_fond.assign_fond_ownership(db, fond_id, owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return {
        "message": f"Fond {fond_id} assigned to user {owner.username}",
        "fond_id": fond_id,
        "owner_id": owner_id,
        "owner_username": owner.username
    }


@router.delete("/{fond_id}/remove-owner")
def remove_fond_owner(
    fond_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Elimină ownership-ul unui fond (îl face unassigned) - doar pentru admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can remove fond ownership")
    
    success = crud_fond.remove_fond_ownership(db, fond_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return {
        "message": f"Ownership removed from fond {fond_id}",
        "fond_id": fond_id
    }
