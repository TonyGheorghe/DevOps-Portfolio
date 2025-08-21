# app/api/routes/users.py - FIXED VERSION with Proper Roles
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
        raise HTTPException(status_code=403, detail="Doar administratorii pot crea utilizatori")
    
    # Verifică că username-ul nu există deja
    existing_user = crud_user.get_user_by_username(db, user_in.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username-ul este deja folosit")
    
    # Verifică că rolul este valid
    valid_roles = ["admin", "audit", "client"]
    if user_in.role not in valid_roles:
        raise HTTPException(
            status_code=400, 
            detail=f"Rol invalid. Rolurile permise sunt: {', '.join(valid_roles)}"
        )
    
    # Pentru clienți, verifică că company_name este prezent
    if user_in.role == "client":
        if not user_in.company_name or not user_in.company_name.strip():
            raise HTTPException(
                status_code=400, 
                detail="Numele companiei este obligatoriu pentru clienți"
            )
    
    try:
        return crud_user.create_user(db, user_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Eroare la crearea utilizatorului: {str(e)}")


@router.get("/", response_model=List[UserRead])
def list_users(
    skip: int = Query(0, ge=0, description="Numărul de utilizatori de sărit"),
    limit: int = Query(100, ge=1, le=1000, description="Numărul maxim de utilizatori"),
    role_filter: str = Query(None, description="Filtru după rol (admin, audit, client)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează utilizatorii cu posibilitate de filtrare.
    - Admin: vede toți utilizatorii
    - Audit: vede toți utilizatorii (read-only)
    - Client: nu are acces
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a vedea lista utilizatorilor")
    
    if role_filter:
        valid_roles = ["admin", "audit", "client"]
        if role_filter not in valid_roles:
            raise HTTPException(
                status_code=400, 
                detail=f"Filtru rol invalid. Rolurile permise sunt: {', '.join(valid_roles)}"
            )
        return crud_user.list_users_by_role(db, role_filter, skip=skip, limit=limit)
    
    return crud_user.list_users(db, skip=skip, limit=limit)


@router.get("/clients", response_model=List[UserRead])
def list_client_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează doar utilizatorii cu rolul 'client' - util pentru assignment fonduri.
    Doar admin poate accesa această funcție.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Doar administratorii au acces la această funcție")
    
    return crud_user.get_client_users(db, skip=skip, limit=limit)


@router.get("/stats")
def get_users_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează statistici despre utilizatori.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru a vedea statisticile")
    
    try:
        stats = crud_user.get_users_stats(db)
        return {
            **stats,
            "generated_by": current_user.username,
            "user_role": current_user.role
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la calcularea statisticilor: {str(e)}")


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează un utilizator după ID.
    - Admin: poate vedea orice utilizator
    - Audit: poate vedea orice utilizator
    - Client: poate vedea doar profilul propriu
    """
    # Verifică permisiunile
    if current_user.role == "client":
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Poți vedea doar profilul tău")
    elif current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru această acțiune")
    
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    
    return db_user


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Actualizează un utilizator.
    - Admin: poate actualiza orice utilizator
    - Client: poate actualiza doar profilul propriu (cu limitări)
    - Audit: nu poate actualiza nimic
    """
    # Verifică permisiunile
    if current_user.role == "audit":
        raise HTTPException(status_code=403, detail="Utilizatorii audit nu pot modifica date")
    
    if current_user.role == "client":
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Poți actualiza doar profilul tău")
        
        # Clienții nu pot schimba rolul sau username-ul
        if user_in.role is not None and user_in.role != current_user.role:
            raise HTTPException(status_code=403, detail="Nu poți schimba rolul propriului cont")
        
        if user_in.username is not None and user_in.username != current_user.username:
            raise HTTPException(status_code=403, detail="Nu poți schimba username-ul propriului cont")
    
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru această acțiune")
    
    # Obține utilizatorul de actualizat
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    
    # Safety check - nu poți șterge ultimul admin
    if (user_in.role is not None and 
        user_in.role != "admin" and 
        db_user.role == "admin"):
        
        admin_count = crud_user.count_users_by_role(db).get("admin", 0)
        if admin_count <= 1:
            raise HTTPException(
                status_code=400, 
                detail="Nu poți schimba rolul ultimului administrator"
            )
    
    # Verifică rolul actualizat
    if user_in.role is not None:
        valid_roles = ["admin", "audit", "client"]
        if user_in.role not in valid_roles:
            raise HTTPException(
                status_code=400, 
                detail=f"Rol invalid. Rolurile permise sunt: {', '.join(valid_roles)}"
            )
    
    # Pentru clienți, verifică company_name
    final_role = user_in.role if user_in.role is not None else db_user.role
    if final_role == "client":
        final_company_name = user_in.company_name if user_in.company_name is not None else db_user.company_name
        if not final_company_name or not final_company_name.strip():
            raise HTTPException(
                status_code=400, 
                detail="Numele companiei este obligatoriu pentru clienți"
            )
    
    # Verifică username duplicat
    if user_in.username is not None:
        existing_user = crud_user.get_user_by_username(db, user_in.username)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Username-ul este deja folosit")
    
    try:
        return crud_user.update_user(db, db_user, user_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Eroare la actualizarea utilizatorului: {str(e)}")


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
        raise HTTPException(status_code=403, detail="Doar administratorii pot șterge utilizatori")
    
    # Nu poți șterge ultimul admin
    if db_user.role == "admin":
        admin_count = crud_user.count_users_by_role(db).get("admin", 0)
        if admin_count <= 1:
            raise HTTPException(
                status_code=400, 
                detail="Nu poți șterge ultimul administrator din sistem"
            )
    
    # Verifică dacă utilizatorul are fonduri assignate
    if db_user.role == "client":
        from app.crud.fond import get_my_fonds_count
        fond_count = get_my_fonds_count(db, user_id, active_only=False)
        if fond_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Nu poți șterge un client care are {fond_count} fonduri assignate. "
                       f"Reassignează fondurile către alt client înainte de ștergere."
            )
    
    try:
        crud_user.delete_user(db, db_user)
        return None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Eroare la ștergerea utilizatorului: {str(e)}")


@router.post("/validate-username")
def validate_username(
    username: str = Query(..., min_length=3, max_length=64),
    exclude_user_id: int = Query(None, description="ID utilizator de exclus din verificare"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Validează disponibilitatea unui username.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru această acțiune")
    
    # Verifică formatul username-ului
    import re
    if not re.match(r'^[a-zA-Z0-9_.-]+ să te ștergi pe tine însuți
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Nu te poți șterge pe tine însuți")
    
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    
    # Nu poți, username):
        return {
            "available": False,
            "reason": "Username-ul poate conține doar litere, cifre, underscore, cratimă și punct"
        }
    
    # Verifică dacă este disponibil
    existing_user = crud_user.get_user_by_username(db, username)
    
    if existing_user:
        if exclude_user_id and existing_user.id == exclude_user_id:
            return {"available": True, "reason": "Username-ul este al utilizatorului curent"}
        else:
            return {
                "available": False, 
                "reason": f"Username-ul este folosit de {existing_user.role} (ID: {existing_user.id})"
            }
    
    return {"available": True, "reason": "Username-ul este disponibil"}


@router.get("/roles/info")
def get_roles_info(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează informații despre rolurile disponibile în sistem.
    """
    from app.schemas.user import UserRoleInfo
    
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Nu ai permisiuni pentru această acțiune")
    
    roles_info = []
    valid_roles = ["admin", "audit", "client"]
    
    for role in valid_roles:
        role_info = UserRoleInfo.get_role_info(role)
        roles_info.append(role_info.model_dump())
    
    # Adaugă statistici despre utilizatori pe rol
    role_stats = crud_user.count_users_by_role(db)
    
    return {
        "roles": roles_info,
        "current_distribution": role_stats,
        "total_users": sum(role_stats.values()),
        "can_create_users": current_user.role == "admin",
        "can_modify_users": current_user.role == "admin"
    } să te ștergi pe tine însuți
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Nu te poți șterge pe tine însuți")
    
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    
    # Nu poți
