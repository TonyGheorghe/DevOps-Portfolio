# app/crud/user.py - Updated for Extended Roles
from sqlalchemy.orm import Session
from typing import List, Optional

from passlib.hash import bcrypt
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Returnează un utilizator după ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Returnează un utilizator după username."""
    return db.query(User).filter(User.username == username).first()


def list_users(db: Session, skip: int = 0, limit: int = 10) -> List[User]:
    """Returnează lista de utilizatori cu paginație."""
    return db.query(User).offset(skip).limit(limit).all()


def list_users_by_role(db: Session, role: str, skip: int = 0, limit: int = 10) -> List[User]:
    """Returnează lista de utilizatori cu un anumit rol."""
    return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()


def get_client_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Returnează doar utilizatorii cu rolul 'client' - util pentru assignment fonduri."""
    return db.query(User).filter(User.role == "client").offset(skip).limit(limit).all()


def create_user(db: Session, user_in: UserCreate) -> User:
    """Creează un nou utilizator cu parola hash-uită."""
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        password_hash=hashed_password,
        role=user_in.role,
        company_name=user_in.company_name,
        contact_email=user_in.contact_email,
        notes=user_in.notes
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    """Actualizează câmpurile unui utilizator existent."""
    if user_in.username is not None:
        db_user.username = user_in.username
    if user_in.password is not None:
        db_user.password_hash = get_password_hash(user_in.password)
    if user_in.role is not None:
        db_user.role = user_in.role
    if user_in.company_name is not None:
        db_user.company_name = user_in.company_name
    if user_in.contact_email is not None:
        db_user.contact_email = user_in.contact_email
    if user_in.notes is not None:
        db_user.notes = user_in.notes

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: User) -> None:
    """Șterge un utilizator din baza de date."""
    db.delete(db_user)
    db.commit()


def count_users_by_role(db: Session) -> dict:
    """Returnează numărul de utilizatori pe fiecare rol."""
    from sqlalchemy import func
    
    result = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    return {role: count for role, count in result}


def can_user_manage_user(current_user: User, target_user: User) -> bool:
    """
    Verifică dacă current_user poate gestiona target_user.
    
    Logica:
    - Admin: poate gestiona pe toată lumea
    - Audit/Client: nu pot gestiona pe nimeni altcineva
    - Nimeni nu se poate șterge pe sine (safety check)
    """
    if current_user.role != "admin":
        return False
    
    # Safety: admin nu se poate șterge pe sine
    if current_user.id == target_user.id:
        return False
        
    return True


def get_users_stats(db: Session) -> dict:
    """Returnează statistici despre utilizatori."""
    from sqlalchemy import func
    
    total_users = db.query(func.count(User.id)).scalar()
    
    role_counts = count_users_by_role(db)
    
    # Utilizatori cu fonduri (pentru clienți)
    clients_with_fonds = db.query(func.count(func.distinct(User.id))).join(
        User.owned_fonds
    ).filter(User.role == "client").scalar()
    
    return {
        "total_users": total_users,
        "role_distribution": role_counts,
        "clients_with_fonds": clients_with_fonds,
        "clients_without_fonds": role_counts.get("client", 0) - clients_with_fonds
    }
