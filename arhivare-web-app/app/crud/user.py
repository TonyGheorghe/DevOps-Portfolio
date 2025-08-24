# app/crud/user.py - CRUD USER REPARAT
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from passlib.hash import bcrypt
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()

def list_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """List users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()

def list_users_by_role(db: Session, role: str, skip: int = 0, limit: int = 100) -> List[User]:
    """List users by role"""
    valid_roles = ["admin", "audit", "client"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role. Valid roles are: {', '.join(valid_roles)}")
    
    return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()

def get_client_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get only client users"""
    return db.query(User).filter(User.role == "client").offset(skip).limit(limit).all()

def create_user(db: Session, user_in: UserCreate) -> User:
    """Create a new user"""
    # Validate role
    valid_roles = ["admin", "audit", "client"]
    if user_in.role not in valid_roles:
        raise ValueError(f"Invalid role '{user_in.role}'. Valid roles are: {', '.join(valid_roles)}")
    
    # Validate client-specific requirements
    if user_in.role == "client":
        if not user_in.company_name or not user_in.company_name.strip():
            raise ValueError("Company name is required for client users")
    
    # Create user with hashed password
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        password_hash=hashed_password,  # CONSISTENT field name
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
    """Update user"""
    # Track role changes
    old_role = db_user.role
    new_role = user_in.role if user_in.role is not None else old_role
    
    # Validate new role
    if user_in.role is not None:
        valid_roles = ["admin", "audit", "client"]
        if user_in.role not in valid_roles:
            raise ValueError(f"Invalid role '{user_in.role}'. Valid roles are: {', '.join(valid_roles)}")
    
    # Update fields
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

    # Validate client requirements
    if new_role == "client":
        final_company_name = user_in.company_name if user_in.company_name is not None else db_user.company_name
        if not final_company_name or not final_company_name.strip():
            raise ValueError("Company name is required for client users")

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, db_user: User) -> None:
    """Delete user"""
    # Safety checks
    if db_user.role == "admin":
        admin_count = count_users_by_role(db).get("admin", 0)
        if admin_count <= 1:
            raise ValueError("Cannot delete the last administrator")
    
    # Check if client has assigned fonds
    if db_user.role == "client":
        from app.models.fond import Fond
        fond_count = db.query(func.count(Fond.id)).filter(Fond.owner_id == db_user.id).scalar()
        if fond_count > 0:
            raise ValueError(f"Cannot delete client with {fond_count} assigned fonds")
    
    db.delete(db_user)
    db.commit()

def count_users_by_role(db: Session) -> dict:
    """Count users by role"""
    result = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Ensure all roles are represented
    role_counts = {"admin": 0, "audit": 0, "client": 0}
    for role, count in result:
        role_counts[role] = count
    
    return role_counts

def get_users_stats(db: Session) -> dict:
    """Get comprehensive user statistics"""
    total_users = db.query(func.count(User.id)).scalar()
    role_counts = count_users_by_role(db)
    
    return {
        "total_users": total_users,
        "role_distribution": role_counts,
        "admin_count": role_counts.get("admin", 0),
        "audit_count": role_counts.get("audit", 0),
        "client_count": role_counts.get("client", 0)
    }
