# app/crud/fond.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional

from app.models.fond import Fond
from app.schemas.fond import FondCreate, FondUpdate


def get_fond(db: Session, fond_id: int) -> Optional[Fond]:
    """Returnează un fond după ID."""
    return db.query(Fond).filter(Fond.id == fond_id).first()


def get_fonds(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """Returnează lista de fonduri cu paginație."""
    query = db.query(Fond)
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


def create_fond(db: Session, fond: FondCreate) -> Fond:
    """Creează un nou fond."""
    db_fond = Fond(
        company_name=fond.company_name,
        holder_name=fond.holder_name,
        address=fond.address,
        email=fond.email,
        phone=fond.phone,
        notes=fond.notes,
        source_url=fond.source_url,
        active=True  # Nou creat = activ
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


def search_fonds_count(db: Session, search_term: str) -> int:
    """Returnează numărul de rezultate pentru o căutare."""
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
