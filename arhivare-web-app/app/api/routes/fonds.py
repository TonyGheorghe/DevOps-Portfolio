# app/api/routes/fonds.py - ENHANCED with Auto-Reassignment Endpoints
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.fond import Fond
from app.schemas.fond import FondCreate, FondUpdate, FondResponse
from app.crud import fond as crud_fond, user as crud_user

router = APIRouter()

# NEW: Schema pentru reassignment suggestions
from pydantic import BaseModel

class ReassignmentSuggestion(BaseModel):
    user_id: int
    username: str
    company_name: str
    similarity: float
    match_type: str
    confidence: str

class ReassignmentResponse(BaseModel):
    fond_id: int
    fond_name: str
    old_holder_name: str
    new_holder_name: str
    current_owner: Optional[dict]
    suggestions: List[ReassignmentSuggestion]
    best_match: ReassignmentSuggestion
    requires_confirmation: bool

class ConfirmReassignmentRequest(BaseModel):
    fond_id: int
    new_owner_id: Optional[int]
    confirmed: bool = True


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
            fonds = crud_fond.search_all_fonds(db, search, skip=skip, limit=limit, active_only=active_only)
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


def find_client_by_company_name(db: Session, company_name: str) -> Optional[UserModel]:
    """
    Găsește un client pe baza numelui companiei din holder_name.
    Încearcă mai multe strategii de matching.
    """
    if not company_name:
        return None
    
    # Normalizează numele pentru căutare
    normalized_name = company_name.lower().strip()
    
    # Strategie 1: Exact match
    client = db.query(UserModel).filter(
        UserModel.role == "client",
        func.lower(UserModel.company_name) == normalized_name
    ).first()
    
    if client:
        return client
    
    # Strategie 2: Caută dacă company_name conține holder_name
    clients = db.query(UserModel).filter(UserModel.role == "client").all()
    for client in clients:
        if client.company_name:
            client_name_normalized = client.company_name.lower().strip()
            # Verifică dacă holder_name conține numele companiei clientului
            if client_name_normalized in normalized_name or normalized_name in client_name_normalized:
                return client
    
    # Strategie 3: Matching parțial pe cuvinte cheie
    # Elimină prefixe comune (SRL, SA, etc.)
    for prefix in ['srl', 'sa', 'sc', 'ltd', 'inc', 'corp']:
        normalized_name = normalized_name.replace(f' {prefix}', '').replace(f'{prefix} ', '')
    
    for client in clients:
        if client.company_name:
            client_name_clean = client.company_name.lower().strip()
            for prefix in ['srl', 'sa', 'sc', 'ltd', 'inc', 'corp']:
                client_name_clean = client_name_clean.replace(f' {prefix}', '').replace(f'{prefix} ', '')
            
            # Split în cuvinte și verifică overlap
            holder_words = set(normalized_name.split())
            client_words = set(client_name_clean.split())
            
            # Dacă au cel puțin 50% cuvinte comune și cel puțin 2 cuvinte
            if len(holder_words) >= 2 and len(client_words) >= 2:
                common_words = holder_words.intersection(client_words)
                if len(common_words) >= max(1, min(len(holder_words), len(client_words)) // 2):
                    return client
    
    return None


@router.post("/", response_model=FondResponse, status_code=status.HTTP_201_CREATED)
def create_fond(
    fond_in: FondCreate,
    owner_id: Optional[int] = Query(None, description="ID-ul clientului care va deține fondul"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Creează un nou fond arhivistic cu auto-assignment inteligent.
    
    - Admin: poate crea fonduri și le poate asigna unui client
    - Client: poate crea fonduri doar pentru sine (owner_id va fi automat user.id)
    - Audit: nu poate crea fonduri
    
    AUTO-ASSIGNMENT: Dacă nu se specifică owner_id, sistemul va încerca să găsească
    automat un client pe baza numelui din holder_name.
    """
    if current_user.role == "audit":
        raise HTTPException(status_code=403, detail="Audit users cannot create fonds")
    
    # Determină owner_id pe baza rolului
    final_owner_id = None
    
    if current_user.role == "admin":
        if owner_id:
            # Admin a specificat explicit un owner
            final_owner_id = owner_id
        else:
            # AUTO-ASSIGNMENT: Încearcă să găsești client pe baza holder_name
            potential_client = find_client_by_company_name(db, fond_in.holder_name)
            if potential_client:
                final_owner_id = potential_client.id
                print(f"🤖 AUTO-ASSIGNMENT: Fond '{fond_in.company_name}' assignat automat la {potential_client.username} ({potential_client.company_name})")
            else:
                # Rămâne unassigned dacă nu găsește client potrivit
                print(f"⚠️  No matching client found for holder_name: '{fond_in.holder_name}'")
                
    elif current_user.role == "client":
        # Client poate crea fonduri doar pentru sine
        final_owner_id = current_user.id
        if owner_id and owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Nu poți crea fonduri pentru alți utilizatori")
    else:
        raise HTTPException(status_code=403, detail="Invalid user role")
    
    # Validează owner_id dacă este specificat
    if final_owner_id:
        owner = crud_user.get_user_by_id(db, final_owner_id)
        if not owner or owner.role != "client":
            raise HTTPException(status_code=400, detail="Owner must be a client user")
    
    return crud_fond.create_fond(db, fond_in, owner_id=final_owner_id)


# NEW: Enhanced update endpoint with reassignment detection
@router.put("/{fond_id}", response_model=dict)
def update_fond(
    fond_id: int,
    fond_in: FondUpdate,
    auto_reassign: bool = Query(False, description="Aplică automat reassignment pentru match-uri exacte"),
    confirmed_owner_id: Optional[int] = Query(None, description="ID-ul noului owner confirmat de admin"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un fond existent cu detectarea reassignment-ului.
    
    ENHANCED: Detectează automat schimbările de holder_name și sugerează reassignment.
    
    Query Parameters:
    - auto_reassign: Dacă True, aplică automat reassignment pentru match-uri exacte (>=95% similaritate)
    - confirmed_owner_id: ID-ul noului owner confirmat de admin (None pentru a nu schimba ownership-ul)
    
    Returns:
    - fond: Fondul actualizat
    - reassignment_suggestions: Sugestii de reassignment (dacă există)
    """
    # Verifică dacă utilizatorul poate edita acest fond
    if not crud_fond.can_user_edit_fond(db, current_user, fond_id):
        if current_user.role == "audit":
            raise HTTPException(status_code=403, detail="Audit users have read-only access")
        elif current_user.role == "client":
            raise HTTPException(status_code=403, detail="Poți edita doar fondurile care îți aparțin")
        else:
            raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a edita acest fond")
    
    # NEW: Folosește funcția enhanced pentru detectarea reassignment-ului
    db_fond, reassignment_suggestions = crud_fond.update_fond_with_reassignment_detection(
        db, 
        fond_id, 
        fond_in,
        auto_reassign=auto_reassign,
        confirmed_new_owner_id=confirmed_owner_id
    )
    
    if not db_fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    # Construiește răspunsul
    response = {
        "fond": db_fond,
        "reassignment_applied": confirmed_owner_id is not None,
        "auto_reassignment_applied": auto_reassign and reassignment_suggestions is None
    }
    
    # Adaugă sugestii de reassignment dacă există
    if reassignment_suggestions:
        response["reassignment_suggestions"] = reassignment_suggestions
        response["message"] = f"Fond actualizat cu succes. Detectate {len(reassignment_suggestions['suggestions'])} sugestii de reassignment."
    else:
        response["message"] = "Fond actualizat cu succes."
    
    return response


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


# NEW: Reassignment endpoints pentru admin
@router.get("/{fond_id}/reassignment-suggestions")
def get_reassignment_suggestions(
    fond_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează sugestii de reassignment pentru un fond dat (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can get reassignment suggestions")
    
    suggestions = crud_fond.get_reassignment_suggestions(db, fond_id)
    
    if "error" in suggestions:
        raise HTTPException(status_code=404, detail=suggestions["error"])
    
    return suggestions


@router.post("/{fond_id}/confirm-reassignment")
def confirm_reassignment(
    fond_id: int,
    request: ConfirmReassignmentRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Confirmă reassignment-ul unui fond către un nou owner (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can confirm reassignments")
    
    if request.fond_id != fond_id:
        raise HTTPException(status_code=400, detail="Fond ID mismatch")
    
    if not request.confirmed:
        raise HTTPException(status_code=400, detail="Reassignment not confirmed")
    
    # Verifică că fondul există
    fond = crud_fond.get_fond(db, fond_id)
    if not fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    # Verifică că noul owner este valid (dacă nu e None)
    if request.new_owner_id:
        new_owner = crud_user.get_user_by_id(db, request.new_owner_id)
        if not new_owner or new_owner.role != "client":
            raise HTTPException(status_code=400, detail="Invalid client user")
    
    # Aplică reassignment-ul
    success = crud_fond.apply_reassignment(db, fond_id, request.new_owner_id, confirmed_by_admin=True)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to apply reassignment")
    
    # Obține informații despre reassignment pentru răspuns
    updated_fond = crud_fond.get_fond(db, fond_id)
    new_owner_info = None
    if request.new_owner_id:
        new_owner = crud_user.get_user_by_id(db, request.new_owner_id)
        new_owner_info = {
            "id": new_owner.id,
            "username": new_owner.username,
            "company_name": new_owner.company_name
        }
    
    return {
        "message": "Reassignment confirmed and applied successfully",
        "fond_id": fond_id,
        "fond_name": updated_fond.company_name,
        "new_owner": new_owner_info,
        "reassignment_type": "unassigned" if request.new_owner_id is None else "assigned"
    }


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
    owner = crud_user.get_user_by_id(db, owner_id)
    if not owner or owner.role != "client":
        raise HTTPException(status_code=400, detail="Owner must be a client user")
    
    success = crud_fond.assign_fond_ownership(db, fond_id, owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    return {
        "message": f"Fond {fond_id} assigned to user {owner.username}",
        "fond_id": fond_id,
        "owner_id": owner_id,
        "owner_username": owner.username,
        "owner_company": owner.company_name
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


@router.get("/ownership/suggestions")
def get_ownership_suggestions(
    holder_name: str = Query(..., description="Numele deținătorului pentru căutarea sugestiilor"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează sugestii de clienți pentru un holder_name dat (pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can get ownership suggestions")
    
    # Găsește clientul potrivit
    suggested_client = find_client_by_company_name(db, holder_name)
    
    # Returnează și toți clienții disponibili
    all_clients = crud_user.get_client_users(db)
    
    return {
        "holder_name": holder_name,
        "suggested_client": {
            "id": suggested_client.id,
            "username": suggested_client.username,
            "company_name": suggested_client.company_name,
            "match_confidence": "high" if suggested_client else None
        } if suggested_client else None,
        "all_clients": [
            {
                "id": client.id,
                "username": client.username,
                "company_name": client.company_name
            }
            for client in all_clients
        ]
    }


# NEW: Bulk reassignment endpoint pentru testare
@router.post("/bulk-check-reassignments")
def bulk_check_reassignments(
    apply_automatic: bool = Query(False, description="Aplică automat reassignment-urile cu confidence mare"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Verifică toate fondurile pentru posibile reassignment-uri (doar pentru admin).
    Util pentru a detecta fonduri care au nevoie de reassignment în masa.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can perform bulk reassignment checks")
    
    # Obține toate fondurile active
    all_fonds = crud_fond.get_fonds(db, skip=0, limit=1000, active_only=True)
    
    reassignment_candidates = []
    automatic_reassignments = []
    
    for fond in all_fonds:
        # Găsește potențiali owner-i pentru fiecare fond
        potential_owners = crud_fond.find_potential_owners_for_holder(
            db, fond.holder_name, exclude_current_owner=fond.owner_id
        )
        
        if potential_owners:
            best_match = potential_owners[0]
            
            # Dacă similaritatea este foarte mare și apply_automatic=True
            if apply_automatic and best_match["similarity"] >= 0.95:
                success = crud_fond.apply_reassignment(
                    db, fond.id, best_match["user_id"], confirmed_by_admin=True
                )
                if success:
                    automatic_reassignments.append({
                        "fond_id": fond.id,
                        "fond_name": fond.company_name,
                        "holder_name": fond.holder_name,
                        "old_owner_id": fond.owner_id,
                        "new_owner_id": best_match["user_id"],
                        "new_owner_username": best_match["username"],
                        "similarity": best_match["similarity"]
                    })
            
            # Adaugă la candidații pentru reassignment manual
            elif best_match["similarity"] >= 0.7:
                current_owner = None
                if fond.owner_id:
                    current_owner = crud_user.get_user_by_id(db, fond.owner_id)
                
                reassignment_candidates.append({
                    "fond_id": fond.id,
                    "fond_name": fond.company_name,
                    "holder_name": fond.holder_name,
                    "current_owner": {
                        "id": current_owner.id if current_owner else None,
                        "username": current_owner.username if current_owner else None,
                        "company_name": current_owner.company_name if current_owner else None
                    } if current_owner else None,
                    "suggested_owner": {
                        "id": best_match["user_id"],
                        "username": best_match["username"],
                        "company_name": best_match["company_name"],
                        "similarity": best_match["similarity"],
                        "confidence": best_match["confidence"]
                    }
                })
    
    return {
        "total_fonds_checked": len(all_fonds),
        "automatic_reassignments_applied": len(automatic_reassignments),
        "manual_reassignment_candidates": len(reassignment_candidates),
        "automatic_reassignments": automatic_reassignments,
        "reassignment_candidates": reassignment_candidates,
        "apply_automatic_was_enabled": apply_automatic
    }
