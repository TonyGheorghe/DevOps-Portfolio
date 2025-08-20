# app/crud/fond.py - Updated with Ownership Logic
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional

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


def search_fonds(db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[Fond]:
    """
    Caută fonduri după numele companiei sau deținătorului (case-insensitive).
    Aceasta va fi folosită pentru public search endpoint.
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
                Fond.holder_name.ilike(search_pattern)
            )
        )
    )
    
    return query.offset(skip).limit(limit).all()


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
    """Actualizează un fond existent."""
    db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
    if not db_fond:
        return None
    
    # Actualizează doar câmpurile care nu sunt None
    update_data = fond_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_fond, field, value)
    
    db.commit()
    db.refresh(db_fond)
    return db_fond


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
                Fond.holder_name.ilike(search_pattern)
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


def get_unassigned_fonds(db: Session, skip: int = 0, limit: int = 100) -> List[Fond]:
    """Returnează fondurile care nu au owner (pentru admin să le poată asigna)."""
    return db.query(Fond).filter(Fond.owner_id.is_(None)).offset(skip).limit(limit).all()
