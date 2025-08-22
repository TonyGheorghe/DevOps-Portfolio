# app/api/routes/fonds.py - FIXED with Auto Assignment and Owner Display
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

def find_client_by_company_name(db: Session, holder_name: str) -> Optional[UserModel]:
    """
    Găsește un client pe baza numelui din holder_name.
    Încearcă să facă match între holder_name și company_name din profil client.
    """
    if not holder_name:
        return None
    
    # Normalizează numele pentru căutare
    normalized_holder = holder_name.lower().strip()
    
    print(f"🔍 Căutare client pentru holder_name: '{holder_name}' (normalized: '{normalized_holder}')")
    
    # Obține toți clienții
    clients = db.query(UserModel).filter(UserModel.role == "client").all()
    
    print(f"📋 Găsiți {len(clients)} clienți în total")
    
    # Strategie 1: Exact match pe company_name
    for client in clients:
        if client.company_name:
            normalized_company = client.company_name.lower().strip()
            print(f"  🔸 Verificare client '{client.username}' cu companie '{client.company_name}'")
            
            if normalized_company == normalized_holder:
                print(f"✅ Match exact găsit: {client.username} - {client.company_name}")
                return client
    
    # Strategie 2: Verifică dacă holder_name conține company_name sau invers
    for client in clients:
        if client.company_name:
            normalized_company = client.company_name.lower().strip()
            
            # Elimină sufixe comune pentru match mai bun
            holder_clean = normalized_holder
            company_clean = normalized_company
            
            for suffix in [' srl', ' sa', ' sc', ' ltd', ' inc', ' corp', 'srl', 'sa', 'sc']:
                holder_clean = holder_clean.replace(suffix, '').strip()
                company_clean = company_clean.replace(suffix, '').strip()
            
            # Check inclusion în ambele direcții
            if (holder_clean in company_clean or company_clean in holder_clean) and len(holder_clean) > 3:
                print(f"✅ Match parțial găsit: {client.username} - {client.company_name}")
                return client
    
    # Strategie 3: Matching pe cuvinte cheie
    holder_words = set(word for word in normalized_holder.split() if len(word) > 2)
    
    for client in clients:
        if client.company_name and len(holder_words) >= 2:
            company_words = set(word for word in client.company_name.lower().split() if len(word) > 2)
            
            # Verifică dacă au cel puțin 50% cuvinte comune
            if company_words and holder_words:
                common_words = holder_words.intersection(company_words)
                similarity = len(common_words) / max(len(holder_words), len(company_words))
                
                if similarity >= 0.5:  # 50% similaritate
                    print(f"✅ Match pe cuvinte găsit: {client.username} - {client.company_name} (similaritate: {similarity:.2f})")
                    return client
    
    print(f"❌ Nu s-a găsit client pentru holder_name: '{holder_name}'")
    return None
