from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.user import UserCreate, UserUpdate, UserRead
from app.crud import user as crud_user

router = APIRouter()

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Creează un nou utilizator (doar adminii au voie).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    existing_user = crud_user.get_user_by_username(db, user_in.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create_user(db, user_in)


@router.get("/", response_model=List[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează utilizatorii (doar adminii au voie).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud_user.list_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează un utilizator după ID (doar adminii au voie).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un utilizator (doar adminii au voie).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud_user.update_user(db, db_user, user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Șterge un utilizator (doar adminii au voie).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    crud_user.delete_user(db, db_user)
    return None

