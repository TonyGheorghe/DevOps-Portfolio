# app/crud/user.py
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


def create_user(db: Session, user_in: UserCreate) -> User:
    """Creează un nou utilizator cu parola hash-uită."""
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        password_hash=hashed_password,
        role=user_in.role
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
        db_user.password_hash = bcrypt.hash(user_in.password)
    if user_in.role is not None:
        db_user.role = user_in.role

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: User) -> None:
    """Șterge un utilizator din baza de date."""
    db.delete(db_user)
    db.commit()

