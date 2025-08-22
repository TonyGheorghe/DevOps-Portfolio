# app/crud/fond.py - ENHANCED with Auto-Reassignment Logic
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional, Dict, Tuple

from app.models.fond import Fond
from app.models.user import User
from app.schemas.fond import FondCreate, FondUpdate


def get_fond(db: Session, fond_id: int) -> Optional[Fond]:
    """Returnează un fond după ID."""
    return db.query(Fond).filter(Fond.id == fond_id).first()


def get_fonds(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """Returnează lista de fonduri cu paginație - pentru admin și audit."""
    query = db.query(Fond)
    if active_only:
        query = query.filter(Fond.active == True)
    return query.offset(skip).limit(limit).all()


def get_my_fonds(db: Session, user_id: int, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """
    Returnează fondurile care aparțin unui utilizator specific (pentru clienți).
    Doar fondurile unde owner_id = user_id.
    """
    query = db.query(Fond).filter(Fond.owner_id == user_id)
    if active_only:
        query = query.filter(Fond.active == True)
    return query.offset(skip).limit(limit).all()


def get_fonds_for_user(db: Session, user: User, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """
    Returnează fondurile pe care le poate vedea un utilizator, pe baza rolului său.
    
    - Admin: toate fondurile
    - Audit: toate fondurile  
    - Client: doar fondurile proprii
    """
    if user.role in ["admin", "audit"]:
        return get_fonds(db, skip, limit, active_only)
    elif user.role == "client":
        return get_my_fonds(db, user.id, skip, limit, active_only)
    else:
        return []


def search_fonds(db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[Fond]:
    """
    Caută fonduri după numele companiei sau deținătorului (case-insensitive).
    Aceasta va fi folosită pentru public search endpoint.
    DOAR fondurile active sunt vizibile public.
    """
    if not search_term.strip():
        return []
    
    search_pattern = f"%{search_term.lower()}%"
    
    query = db.query(Fond).filter(
        and_(
            Fond.active == True,  # Doar fondurile active sunt vizibile public
            or_(
                Fond.company_name.ilike(search_pattern),
                Fond.holder_name.ilike(search_pattern)
            )
        )
    )
    
    return query.offset(skip).limit(limit).all()


def search_my_fonds(db: Session, user_id: int, search_term: str, skip: int = 0, limit: int = 100) -> List[Fond]:
    """
    Caută în fondurile proprii ale unui client.
    """
    if not search_term.strip():
        return get_my_fonds(db, user_id, skip, limit)
    
    search_pattern = f"%{search_term.lower()}%"
    
    query = db.query(Fond).filter(
        and_(
            Fond.owner_id == user_id,
            or_(
                Fond.company_name.ilike(search_pattern),
                Fond.holder_name.ilike(search_pattern),
                Fond.address.ilike(search_pattern)
            )
        )
    )
    
    return query.offset(skip).limit(limit).all()


def search_all_fonds(db: Session, search_term: str, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """
    Caută în toate fondurile (pentru admin/audit).
    """
    if not search_term.strip():
        return get_fonds(db, skip, limit, active_only)
    
    search_pattern = f"%{search_term.lower()}%"
    
    query = db.query(Fond)
    if active_only:
        query = query.filter(Fond.active == True)
    
    query = query.filter(
        or_(
            Fond.company_name.ilike(search_pattern),
            Fond.holder_name.ilike(search_pattern),
            Fond.address.ilike(search_pattern)
        )
    )
    
    return query.offset(skip).limit(limit).all()


# NEW: Auto-reassignment logic
def find_potential_owners_for_holder(db: Session, holder_name: str, exclude_current_owner: Optional[int] = None) -> List[Dict]:
    """
    Găsește utilizatori client care ar putea fi owner-i pentru un holder_name dat.
    Returnează o listă cu potențiali owner-i sortați după similaritate.
    """
    if not holder_name:
        return []
    
    # Normalizează numele pentru căutare
    normalized_holder = holder_name.lower().strip()
    
    # Obține toți clienții
    clients_query = db.query(User).filter(User.role == "client")
    if exclude_current_owner:
        clients_query = clients_query.filter(User.id != exclude_current_owner)
    
    clients = clients_query.all()
    
    potential_owners = []
    
    for client in clients:
        if not client.company_name:
            continue
            
        similarity = calculate_company_similarity(holder_name, client.company_name)
        
        if similarity >= 0.6:  # Threshold pentru potențiali candidați
            potential_owners.append({
                "user_id": client.id,
                "username": client.username,
                "company_name": client.company_name,
                "contact_email": client.contact_email,
                "similarity": similarity,
                "match_type": get_match_type(similarity)
            })
    
    # Sortează după similaritate (descrescător)
    potential_owners.sort(key=lambda x: x["similarity"], reverse=True)
    
    return potential_owners


def calculate_company_similarity(holder_name: str, company_name: str) -> float:
    """
    Calculează similaritatea între holder_name și company_name.
    Returnează o valoare între 0.0 și 1.0.
    """
    def normalize_name(name: str) -> str:
        """Normalizează numele pentru comparație"""
        normalized = name.lower().strip()
        
        # Elimină prefixele/sufixele comune
        for suffix in [' srl', ' sa', ' sc', ' ltd', ' inc', ' corp', 'srl', 'sa', 'sc']:
            normalized = normalized.replace(suffix, '').strip()
        
        # Elimină caracterele speciale
        import re
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        
        # Înlocuiește spațiile multiple cu unul singur
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    norm_holder = normalize_name(holder_name)
    norm_company = normalize_name(company_name)
    
    # Exact match după normalizare
    if norm_holder == norm_company:
        return 1.0
    
    # Verifică dacă unul conține pe celălalt
    if norm_holder in norm_company or norm_company in norm_holder:
        # Calculează procentajul de overlap
        min_len = min(len(norm_holder), len(norm_company))
        max_len = max(len(norm_holder), len(norm_company))
        return min_len / max_len * 0.9  # Puțin mai puțin decât exact match
    
    # Matching pe cuvinte
    holder_words = set(word for word in norm_holder.split() if len(word) > 2)
    company_words = set(word for word in norm_company.split() if len(word) > 2)
    
    if not holder_words or not company_words:
        return 0.0
    
    # Calculează cuvintele comune
    common_words = holder_words.intersection(company_words)
    
    if not common_words:
        return 0.0
    
    # Similaritatea bazată pe cuvinte comune
    similarity = len(common_words) / max(len(holder_words), len(company_words))
    
    # Bonus pentru cuvinte importante (de exemplu, nume de orașe)
    important_words = ['brasov', 'brașov', 'cluj', 'bucuresti', 'bucurești', 'timisoara', 'timișoara', 'iasi', 'iași']
    for word in common_words:
        if word in important_words:
            similarity += 0.1  # Bonus pentru cuvinte importante
    
    return min(similarity, 1.0)  # Nu depășește 1.0


def get_match_type(similarity: float) -> str:
    """Returnează tipul de match bazat pe similaritate"""
    if similarity >= 0.95:
        return "exact"
    elif similarity >= 0.8:
        return "high"
    elif similarity >= 0.6:
        return "medium"
    else:
        return "low"


def create_fond(db: Session, fond: FondCreate, owner_id: Optional[int] = None) -> Fond:
    """Creează un nou fond cu owner opțional."""
    db_fond = Fond(
        company_name=fond.company_name,
        holder_name=fond.holder_name,
        address=fond.address,
        email=fond.email,
        phone=fond.phone,
        notes=fond.notes,
        source_url=fond.source_url,
        active=True,
        owner_id=owner_id  # Assignează ownership
    )
    db.add(db_fond)
    db.commit()
    db.refresh(db_fond)
    return db_fond


def update_fond(db: Session, fond_id: int, fond_update: FondUpdate) -> Optional[Fond]:
    """
    Actualizează un fond existent.
    ENHANCED: Detectează potențialele schimbări de ownership.
    """
    db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
    if not db_fond:
        return None
    
    # Salvează valorile vechi pentru comparație
    old_holder_name = db_fond.holder_name
    old_owner_id = db_fond.owner_id
    
    # Actualizează doar câmpurile care nu sunt None
    update_data = fond_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_fond, field, value)
    
    # Verifică dacă holder_name s-a schimbat și dacă există un owner curent
    new_holder_name = getattr(db_fond, 'holder_name', old_holder_name)
    
    if (old_holder_name != new_holder_name and 
        new_holder_name and 
        old_holder_name):  # Ambele trebuie să existe pentru a fi o schimbare reală
        
        print(f"🔄 Holder name changed from '{old_holder_name}' to '{new_holder_name}'")
        
        # Găsește potențiali owner-i noi
        potential_owners = find_potential_owners_for_holder(
            db, 
            new_holder_name, 
            exclude_current_owner=old_owner_id
        )
        
        if potential_owners:
            # Ia cel mai bun match (primul din listă)
            best_match = potential_owners[0]
            
            if best_match["similarity"] >= 0.8:  # High confidence threshold
                print(f"🎯 Auto-reassignment suggestion: {best_match['username']} ({best_match['similarity']:.2f} similarity)")
                
                # Pentru implementarea inițială, putem face auto-reassignment pentru match-uri foarte bune
                if best_match["similarity"] >= 0.95:  # Exact match
                    print(f"✅ Auto-reassigning to {best_match['username']} (exact match)")
                    db_fond.owner_id = best_match["user_id"]
    
    db.commit()
    db.refresh(db_fond)
    return db_fond


def get_reassignment_suggestions(db: Session, fond_id: int) -> Dict:
    """
    Returnează sugestii de reassignment pentru un fond dat.
    Folosit pentru a afișa sugestii în frontend înainte de actualizare.
    """
    fond = get_fond(db, fond_id)
    if not fond:
        return {"error": "Fond not found"}
    
    potential_owners = find_potential_owners_for_holder(
        db, 
        fond.holder_name, 
        exclude_current_owner=fond.owner_id
    )
    
    current_owner = None
    if fond.owner_id:
        current_owner = db.query(User).filter(User.id == fond.owner_id).first()
    
    return {
        "fond_id": fond_id,
        "fond_name": fond.company_name,
        "holder_name": fond.holder_name,
        "current_owner": {
            "id": current_owner.id if current_owner else None,
            "username": current_owner.username if current_owner else None,
            "company_name": current_owner.company_name if current_owner else None
        } if current_owner else None,
        "suggestions": potential_owners[:5],  # Top 5 suggestions
        "has_high_confidence_match": len([s for s in potential_owners if s["similarity"] >= 0.8]) > 0
    }


def apply_reassignment(db: Session, fond_id: int, new_owner_id: Optional[int], confirmed_by_admin: bool = False) -> bool:
    """
    Aplică un reassignment de fond către un nou owner.
    
    Args:
        fond_id: ID-ul fondului
        new_owner_id: ID-ul noului owner (None pentru unassign)
        confirmed_by_admin: True dacă admin-ul a confirmat reassignment-ul
    
    Returns:
        True dacă reassignment-ul a fost aplicat cu succes
    """
    fond = get_fond(db, fond_id)
    if not fond:
        return False
    
    # Verifică că noul owner este client valid (dacă nu e None)
    if new_owner_id:
        new_owner = db.query(User).filter(User.id == new_owner_id, User.role == "client").first()
        if not new_owner:
            return False
    
    # Aplică reassignment-ul
    fond.owner_id = new_owner_id
    
    try:
        db.commit()
        print(f"✅ Reassignment applied: Fond {fond_id} → Owner {new_owner_id}")
        return True
    except Exception as e:
        print(f"❌ Reassignment failed: {e}")
        db.rollback()
        return False


# Restul funcțiilor rămân la fel...
def can_user_edit_fond(db: Session, user: User, fond_id: int) -> bool:
    """
    Verifică dacă un utilizator poate edita un fond specific.
    
    Logica permisiunilor:
    - Admin: poate edita orice fond
    - Audit: nu poate edita nimic
    - Client: poate edita doar fondurile proprii (owner_id = user.id)
    """
    if user.role == "admin":
        return True
    
    if user.role == "audit":
        return False
    
    if user.role == "client":
        fond = get_fond(db, fond_id)
        return fond and fond.owner_id == user.id
    
    return False


def can_user_view_fond(db: Session, user: User, fond_id: int) -> bool:
    """
    Verifică dacă un utilizator poate vedea un fond specific.
    
    Logica permisiunilor:
    - Admin: poate vedea orice fond
    - Audit: poate vedea orice fond
    - Client: poate vedea doar fondurile proprii
    """
    if user.role in ["admin", "audit"]:
        return True
    
    if user.role == "client":
        fond = get_fond(db, fond_id)
        return fond and fond.owner_id == user.id
    
    return False


def validate_fond_access(db: Session, user: User, fond_id: int, action: str) -> tuple[bool, str]:
    """
    Validează accesul unui utilizator la un fond pentru o acțiune specifică.
    
    Returns:
        tuple[bool, str]: (is_allowed, error_message)
    """
    fond = get_fond(db, fond_id)
    if not fond:
        return False, "Fondul nu există"
    
    if action in ["view", "read"]:
        if not can_user_view_fond(db, user, fond_id):
            return False, "Nu ai permisiuni pentru a vizualiza acest fond"
    
    elif action in ["edit", "update", "delete"]:
        if not can_user_edit_fond(db, user, fond_id):
            if user.role == "audit":
                return False, "Utilizatorii audit au acces doar în modul citire"
            elif user.role == "client":
                return False, "Poți edita doar fondurile care îți aparțin"
            else:
                return False, "Nu ai permisiuni pentru această acțiune"
    
    return True, ""


def soft_delete_fond(db: Session, fond_id: int) -> bool:
    """
    Șterge un fond prin marcarea ca inactiv (soft delete).
    Returnează True dacă operația a avut succes.
    """
    db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
    if not db_fond:
        return False
    
    db_fond.active = False
    db.commit()
    return True


def permanently_delete_fond(db: Session, fond_id: int) -> bool:
    """
    Șterge definitiv un fond din baza de date (hard delete).
    Folosește cu atenție!
    """
    db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
    if not db_fond:
        return False
    
    db.delete(db_fond)
    db.commit()
    return True


def get_fonds_count(db: Session, active_only: bool = True) -> int:
    """Returnează numărul total de fonduri pentru paginație."""
    query = db.query(Fond)
    if active_only:
        query = query.filter(Fond.active == True)
    return query.count()


def get_my_fonds_count(db: Session, user_id: int, active_only: bool = True) -> int:
    """Returnează numărul de fonduri ale unui client."""
    query = db.query(Fond).filter(Fond.owner_id == user_id)
    if active_only:
        query = query.filter(Fond.active == True)
    return query.count()


def search_fonds_count(db: Session, search_term: str) -> int:
    """Returnează numărul de rezultate pentru o căutare publică."""
    if not search_term.strip():
        return 0
    
    search_pattern = f"%{search_term.lower()}%"
    
    return db.query(Fond).filter(
        and_(
            Fond.active == True,
            or_(
                Fond.company_name.ilike(search_pattern),
                Fond.holder_name.ilike(search_pattern)
            )
        )
    ).count()


def search_my_fonds_count(db: Session, user_id: int, search_term: str) -> int:
    """Returnează numărul de rezultate pentru căutarea în fondurile proprii."""
    if not search_term.strip():
        return get_my_fonds_count(db, user_id)
    
    search_pattern = f"%{search_term.lower()}%"
    
    return db.query(Fond).filter(
        and_(
            Fond.owner_id == user_id,
            or_(
                Fond.company_name.ilike(search_pattern),
                Fond.holder_name.ilike(search_pattern),
                Fond.address.ilike(search_pattern)
            )
        )
    ).count()


# Ownership management functions
def assign_fond_ownership(db: Session, fond_id: int, owner_id: int) -> bool:
    """Assignează un fond unui client."""
    fond = get_fond(db, fond_id)
    if not fond:
        return False
    
    fond.owner_id = owner_id
    db.commit()
    return True


def remove_fond_ownership(db: Session, fond_id: int) -> bool:
    """Elimină ownership-ul unui fond (îl face unassigned)."""
    fond = get_fond(db, fond_id)
    if not fond:
        return False
    
    fond.owner_id = None
    db.commit()
    return True


def transfer_fond_ownership(db: Session, fond_id: int, new_owner_id: int) -> bool:
    """Transferă ownership-ul unui fond către un alt client."""
    fond = get_fond(db, fond_id)
    if not fond:
        return False
    
    fond.owner_id = new_owner_id
    db.commit()
    return True


def bulk_assign_fonds(db: Session, fond_ids: List[int], client_id: int) -> dict:
    """Assignează mai multe fonduri unui client dintr-o dată."""
    results = {
        "successful": [],
        "failed": [],
        "already_assigned": []
    }
    
    for fond_id in fond_ids:
        fond = get_fond(db, fond_id)
        if not fond:
            results["failed"].append({"fond_id": fond_id, "reason": "Fond not found"})
            continue
        
        if fond.owner_id is not None:
            results["already_assigned"].append({
                "fond_id": fond_id, 
                "current_owner": fond.owner_id,
                "company_name": fond.company_name
            })
            continue
        
        fond.owner_id = client_id
        results["successful"].append({
            "fond_id": fond_id,
            "company_name": fond.company_name
        })
    
    if results["successful"]:
        db.commit()
    
    return results


def get_unassigned_fonds(db: Session, skip: int = 0, limit: int = 100) -> List[Fond]:
    """Returnează fondurile care nu au owner (pentru admin să le poată asigna)."""
    return db.query(Fond).filter(Fond.owner_id.is_(None)).offset(skip).limit(limit).all()


def get_unassigned_fonds_count(db: Session, active_only: bool = True) -> int:
    """Returnează numărul de fonduri neasignate."""
    query = db.query(Fond).filter(Fond.owner_id.is_(None))
    if active_only:
        query = query.filter(Fond.active == True)
    return query.count()


def get_fonds_by_client(db: Session, client_id: int, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """Returnează fondurile unui client specific (pentru admin/audit)."""
    query = db.query(Fond).filter(Fond.owner_id == client_id)
    if active_only:
        query = query.filter(Fond.active == True)
    return query.offset(skip).limit(limit).all()


def get_ownership_statistics(db: Session) -> dict:
    """Returnează statistici despre ownership fondurilor."""
    total_fonds = db.query(func.count(Fond.id)).scalar()
    active_fonds = db.query(func.count(Fond.id)).filter(Fond.active == True).scalar()
    assigned_fonds = db.query(func.count(Fond.id)).filter(Fond.owner_id.isnot(None)).scalar()
    unassigned_fonds = total_fonds - assigned_fonds
    
    # Assignment rate
    assignment_rate = (assigned_fonds / total_fonds * 100) if total_fonds > 0 else 0
    
    # Clients with fonds
    clients_with_fonds = db.query(func.count(func.distinct(Fond.owner_id))).filter(
        Fond.owner_id.isnot(None)
    ).scalar()
    
    # Client distribution
    client_distribution = db.query(
        User.username,
        User.company_name,
        func.count(Fond.id).label('fond_count')
    ).join(
        Fond, User.id == Fond.owner_id
    ).filter(
        User.role == "client"
    ).group_by(
        User.id, User.username, User.company_name
    ).order_by(
        func.count(Fond.id).desc()
    ).all()
    
    return {
        "total_fonds": total_fonds,
        "active_fonds": active_fonds,
        "assigned_fonds": assigned_fonds,
        "unassigned_fonds": unassigned_fonds,
        "assignment_rate": round(assignment_rate, 1),
        "clients_with_fonds": clients_with_fonds,
        "client_distribution": [
            {
                "username": row.username,
                "company_name": row.company_name,
                "fond_count": row.fond_count
            }
            for row in client_distribution
        ]
    }


def get_client_statistics(db: Session, client_id: int) -> dict:
    """Returnează statistici pentru un client specific."""
    total_fonds = db.query(func.count(Fond.id)).filter(Fond.owner_id == client_id).scalar()
    active_fonds = db.query(func.count(Fond.id)).filter(
        and_(Fond.owner_id == client_id, Fond.active == True)
    ).scalar()
    inactive_fonds = total_fonds - active_fonds
    
    # Completion rate (based on how many required fields are filled)
    fonds = db.query(Fond).filter(Fond.owner_id == client_id).all()
    
    if not fonds:
        completion_rate = 0
    else:
        total_fields = 0
        completed_fields = 0
        
        for fond in fonds:
            # Required fields: company_name, holder_name (always present)
            # Optional but important: address, email, phone
            total_fields += 5  # company_name, holder_name, address, email, phone
            
            completed_fields += 2  # company_name and holder_name are always present
            if fond.address and fond.address.strip():
                completed_fields += 1
            if fond.email and fond.email.strip():
                completed_fields += 1
            if fond.phone and fond.phone.strip():
                completed_fields += 1
        
        completion_rate = (completed_fields / total_fields * 100) if total_fields > 0 else 0
    
    # Last updated
    last_updated_fond = db.query(Fond).filter(Fond.owner_id == client_id).order_by(
        Fond.updated_at.desc()
    ).first()
    
    last_updated = last_updated_fond.updated_at if last_updated_fond else None
    
    return {
        "total_fonds": total_fonds,
        "active_fonds": active_fonds,
        "inactive_fonds": inactive_fonds,
        "completion_rate": round(completion_rate, 1),
        "last_updated": last_updated.isoformat() if last_updated else None
    }


def get_fonds_summary_for_user(db: Session, user: User) -> dict:
    """Returnează un rezumat al fondurilor pentru utilizatorul curent."""
    if user.role == "client":
        return get_client_statistics(db, user.id)
    else:
        # Pentru admin/audit, returnează statistici globale
        return get_ownership_statistics(db)
