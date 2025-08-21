# app/crud/user.py - FIXED VERSION with Extended Roles
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    # Validate role
    valid_roles = ["admin", "audit", "client"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role. Valid roles are: {', '.join(valid_roles)}")
    
    return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()


def get_client_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Returnează doar utilizatorii cu rolul 'client' - util pentru assignment fonduri."""
    return db.query(User).filter(User.role == "client").offset(skip).limit(limit).all()


def get_admin_users(db: Session) -> List[User]:
    """Returnează toți administratorii - util pentru verificări de securitate."""
    return db.query(User).filter(User.role == "admin").all()


def create_user(db: Session, user_in: UserCreate) -> User:
    """Creează un nou utilizator cu parola hash-uită și validări extinse."""
    # Validate role
    valid_roles = ["admin", "audit", "client"]
    if user_in.role not in valid_roles:
        raise ValueError(f"Invalid role '{user_in.role}'. Valid roles are: {', '.join(valid_roles)}")
    
    # Validate client-specific requirements
    if user_in.role == "client":
        if not user_in.company_name or not user_in.company_name.strip():
            raise ValueError("Company name is required for client users")
    
    # Create user
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
    """Actualizează câmpurile unui utilizator existent cu validări."""
    # Track if we're changing the role
    old_role = db_user.role
    new_role = user_in.role if user_in.role is not None else old_role
    
    # Validate new role if provided
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

    # Validate client requirements after update
    if new_role == "client":
        final_company_name = user_in.company_name if user_in.company_name is not None else db_user.company_name
        if not final_company_name or not final_company_name.strip():
            raise ValueError("Company name is required for client users")
    
    # Clear company name if user is no longer a client
    if new_role != "client" and old_role == "client":
        db_user.company_name = None

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: User) -> None:
    """Șterge un utilizator din baza de date cu validări de securitate."""
    # Check if this is the last admin
    if db_user.role == "admin":
        admin_count = count_users_by_role(db).get("admin", 0)
        if admin_count <= 1:
            raise ValueError("Cannot delete the last administrator")
    
    # Check if client has assigned fonds
    if db_user.role == "client":
        from app.models.fond import Fond
        fond_count = db.query(func.count(Fond.id)).filter(Fond.owner_id == db_user.id).scalar()
        if fond_count > 0:
            raise ValueError(f"Cannot delete client with {fond_count} assigned fonds. Reassign fonds first.")
    
    db.delete(db_user)
    db.commit()


def count_users_by_role(db: Session) -> dict:
    """Returnează numărul de utilizatori pe fiecare rol."""
    result = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Ensure all roles are represented
    role_counts = {"admin": 0, "audit": 0, "client": 0}
    for role, count in result:
        role_counts[role] = count
    
    return role_counts


def can_user_manage_user(current_user: User, target_user: User) -> bool:
    """
    Verifică dacă current_user poate gestiona target_user.
    
    Logica:
    - Admin: poate gestiona pe toată lumea (dar nu pe sine pentru delete)
    - Audit/Client: nu pot gestiona pe nimeni altcineva
    """
    if current_user.role != "admin":
        return False
    
    # Admin-ii nu se pot șterge pe sine (safety check pentru delete operations)
    if current_user.id == target_user.id:
        return False
        
    return True


def can_user_view_user(current_user: User, target_user: User) -> bool:
    """
    Verifică dacă current_user poate vedea target_user.
    
    Logica:
    - Admin: poate vedea pe toată lumea
    - Audit: poate vedea pe toată lumea (read-only)
    - Client: poate vedea doar profilul propriu
    """
    if current_user.role in ["admin", "audit"]:
        return True
    
    if current_user.role == "client":
        return current_user.id == target_user.id
    
    return False


def can_user_edit_user(current_user: User, target_user: User) -> bool:
    """
    Verifică dacă current_user poate edita target_user.
    
    Logica:
    - Admin: poate edita pe toată lumea
    - Audit: nu poate edita pe nimeni (read-only)
    - Client: poate edita doar profilul propriu (cu limitări)
    """
    if current_user.role == "admin":
        return True
    
    if current_user.role == "audit":
        return False
    
    if current_user.role == "client":
        return current_user.id == target_user.id
    
    return False


def get_users_stats(db: Session) -> dict:
    """Returnează statistici despre utilizatori."""
    total_users = db.query(func.count(User.id)).scalar()
    
    role_counts = count_users_by_role(db)
    
    # Clienți cu fonduri
    from app.models.fond import Fond
    clients_with_fonds = db.query(func.count(func.distinct(User.id))).join(
        Fond, User.id == Fond.owner_id
    ).filter(User.role == "client").scalar()
    
    # Clienți fără fonduri
    total_clients = role_counts.get("client", 0)
    clients_without_fonds = total_clients - clients_with_fonds
    
    # Recent user registrations (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_users = db.query(func.count(User.id)).filter(
        User.created_at >= thirty_days_ago
    ).scalar()
    
    return {
        "total_users": total_users,
        "role_distribution": role_counts,
        "clients_with_fonds": clients_with_fonds,
        "clients_without_fonds": clients_without_fonds,
        "recent_registrations": recent_users,
        "client_utilization_rate": round(
            (clients_with_fonds / total_clients * 100) if total_clients > 0 else 0, 1
        )
    }


def search_users(db: Session, search_term: str, role_filter: Optional[str] = None, 
                skip: int = 0, limit: int = 100) -> List[User]:
    """Caută utilizatori după username, company_name sau email."""
    if not search_term.strip():
        return list_users(db, skip, limit)
    
    search_pattern = f"%{search_term.lower()}%"
    
    query = db.query(User).filter(
        User.username.ilike(search_pattern) |
        User.company_name.ilike(search_pattern) |
        User.contact_email.ilike(search_pattern)
    )
    
    if role_filter:
        valid_roles = ["admin", "audit", "client"]
        if role_filter in valid_roles:
            query = query.filter(User.role == role_filter)
    
    return query.offset(skip).limit(limit).all()


def get_clients_with_company_info(db: Session) -> List[dict]:
    """Returnează lista clienților cu informații despre companie - util pentru assignment."""
    clients = db.query(User).filter(User.role == "client").all()
    
    result = []
    for client in clients:
        # Count assigned fonds
        from app.models.fond import Fond
        fond_count = db.query(func.count(Fond.id)).filter(Fond.owner_id == client.id).scalar()
        
        result.append({
            "id": client.id,
            "username": client.username,
            "company_name": client.company_name,
            "contact_email": client.contact_email,
            "fond_count": fond_count,
            "created_at": client.created_at,
            "notes": client.notes
        })
    
    # Sort by company name
    result.sort(key=lambda x: x["company_name"] or x["username"])
    return result


def validate_user_data(user_data: UserCreate) -> List[str]:
    """Validează datele utilizatorului și returnează lista de erori."""
    errors = []
    
    # Username validation
    if not user_data.username or len(user_data.username.strip()) < 3:
        errors.append("Username-ul trebuie să aibă cel puțin 3 caractere")
    
    import re
    if not re.match(r'^[a-zA-Z0-9_.-]+$', user_data.username):
        errors.append("Username-ul poate conține doar litere, cifre, underscore, cratimă și punct")
    
    # Password validation
    if not user_data.password or len(user_data.password) < 8:
        errors.append("Parola trebuie să aibă cel puțin 8 caractere")
    
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', user_data.password):
        errors.append("Parola trebuie să conțină cel puțin o literă mică, o literă mare și o cifră")
    
    # Role validation
    valid_roles = ["admin", "audit", "client"]
    if user_data.role not in valid_roles:
        errors.append(f"Rolul trebuie să fie unul dintre: {', '.join(valid_roles)}")
    
    # Client-specific validation
    if user_data.role == "client":
        if not user_data.company_name or not user_data.company_name.strip():
            errors.append("Numele companiei este obligatoriu pentru clienți")
    
    # Email validation
    if user_data.contact_email and user_data.contact_email.strip():
        email_pattern = r'^[^@]+@[^@]+\.[^@]+$'
        if not re.match(email_pattern, user_data.contact_email):
            errors.append("Adresa de email nu este validă")
    
    return errors


def migrate_user_role(db: Session, user_id: int, new_role: str) -> User:
    """Migrează rolul unui utilizator cu toate validările necesare."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    old_role = user.role
    
    # Validate new role
    valid_roles = ["admin", "audit", "client"]
    if new_role not in valid_roles:
        raise ValueError(f"Invalid role. Valid roles are: {', '.join(valid_roles)}")
    
    # Check admin constraints
    if old_role == "admin" and new_role != "admin":
        admin_count = count_users_by_role(db).get("admin", 0)
        if admin_count <= 1:
            raise ValueError("Cannot change role of the last administrator")
    
    # Check client constraints
    if old_role == "client":
        from app.models.fond import Fond
        fond_count = db.query(func.count(Fond.id)).filter(Fond.owner_id == user_id).scalar()
        if fond_count > 0 and new_role != "client":
            raise ValueError(f"Cannot change role of client with {fond_count} assigned fonds")
    
    # Update role
    user.role = new_role
    
    # Handle role-specific fields
    if new_role == "client" and not user.company_name:
        user.company_name = f"{user.username.title()} Company SRL"
    elif new_role != "client":
        user.company_name = None
    
    db.commit()
    db.refresh(user)
    return user
