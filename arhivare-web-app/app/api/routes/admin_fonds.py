# app/api/routes/admin_fonds.py - Enhanced Admin Endpoints with Ownership Management
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.fond import FondCreate, FondUpdate, FondResponse
from app.schemas.user import FondAssignment, FondAssignmentResponse, ClientStats
from app.crud import fond as crud_fond, user as crud_user

router = APIRouter()


# === CORE ADMIN OPERATIONS ===
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


@router.get("/by-client/{client_id}", response_model=List[FondResponse])
def list_fonds_by_client(
    client_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează toate fondurile unui client specific (pentru admin/audit).
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can view fonds by client")
    
    # Verifică că client_id este valid și este client
    client = crud_user.get_user_by_id(db, client_id)
    if not client or client.role != "client":
        raise HTTPException(status_code=404, detail="Client not found")
    
    fonds = crud_fond.get_fonds_by_client(db, client_id, skip=skip, limit=limit, active_only=active_only)
    return fonds


# === OWNERSHIP MANAGEMENT ===
@router.post("/assign", response_model=FondAssignmentResponse)
def assign_fond_to_client(
    assignment: FondAssignment,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Assignează un fond unui client (doar pentru admin).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can assign fond ownership")
    
    # Verifică că client-ul este valid
    client = crud_user.get_user_by_id(db, assignment.client_id)
    if not client or client.role != "client":
        raise HTTPException(status_code=400, detail="Invalid client user")
    
    # Verifică că fondul există
    fond = crud_fond.get_fond(db, assignment.fond_id)
    if not fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    # Assignează fondul
    success = crud_fond.assign_fond_ownership(db, assignment.fond_id, assignment.client_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign fond")
    
    return FondAssignmentResponse(
        message=f"Fond '{fond.company_name}' assigned to {client.username}",
        fond_id=assignment.fond_id,
        client_id=assignment.client_id,
        client_username=client.username,
        fond_company_name=fond.company_name
    )


@router.post("/bulk-assign")
def bulk_assign_fonds_to_client(
    client_id: int,
    fond_ids: List[int],
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Assignează mai multe fonduri la un client dintr-o dată.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can bulk assign fonds")
    
    # Verifică că client-ul este valid
    client = crud_user.get_user_by_id(db, client_id)
    if not client or client.role != "client":
        raise HTTPException(status_code=400, detail="Invalid client user")
    
    # Execută bulk assignment
    results = crud_fond.bulk_assign_fonds(db, fond_ids, client_id)
    
    return {
        "message": f"Bulk assignment completed for {client.username}",
        "client_username": client.username,
        "results": results
    }


@router.delete("/unassign/{fond_id}")
def unassign_fond(
    fond_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Elimină ownership-ul unui fond (îl face unassigned) - doar pentru admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can remove fond ownership")
    
    fond = crud_fond.get_fond(db, fond_id)
    if not fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    success = crud_fond.remove_fond_ownership(db, fond_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to remove ownership")
    
    return {
        "message": f"Ownership removed from fond '{fond.company_name}'",
        "fond_id": fond_id,
        "fond_company_name": fond.company_name
    }


@router.post("/transfer")
def transfer_fond_ownership(
    fond_id: int,
    new_client_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Transferă ownership-ul unui fond de la un client la altul.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can transfer fond ownership")
    
    # Verifică că fondul există
    fond = crud_fond.get_fond(db, fond_id)
    if not fond:
        raise HTTPException(status_code=404, detail="Fond not found")
    
    # Verifică că noul client este valid
    new_client = crud_user.get_user_by_id(db, new_client_id)
    if not new_client or new_client.role != "client":
        raise HTTPException(status_code=400, detail="Invalid new client user")
    
    # Obține informații despre clientul anterior
    old_client = None
    if fond.owner_id:
        old_client = crud_user.get_user_by_id(db, fond.owner_id)
    
    # Transferă ownership-ul
    success = crud_fond.transfer_fond_ownership(db, fond_id, new_client_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to transfer ownership")
    
    return {
        "message": f"Fond '{fond.company_name}' transferred to {new_client.username}",
        "fond_id": fond_id,
        "fond_company_name": fond.company_name,
        "old_owner": old_client.username if old_client else "Unassigned",
        "new_owner": new_client.username
    }


# === STATISTICS AND REPORTING ===
@router.get("/statistics")
def get_ownership_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează statistici complete despre ownership fondurilor.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can view statistics")
    
    stats = crud_fond.get_ownership_statistics(db)
    return {
        **stats,
        "generated_by": current_user.username,
        "user_role": current_user.role
    }


@router.get("/client-stats/{client_id}", response_model=ClientStats)
def get_client_statistics(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează statistici pentru un client specific.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can view client statistics")
    
    # Verifică că client-ul există
    client = crud_user.get_user_by_id(db, client_id)
    if not client or client.role != "client":
        raise HTTPException(status_code=404, detail="Client not found")
    
    stats = crud_fond.get_client_statistics(db, client_id)
    return ClientStats(**stats)


@router.get("/unassigned/count")
def count_unassigned_fonds(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează numărul de fonduri neasignate.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view unassigned count")
    
    count = crud_fond.get_unassigned_fonds_count(db, active_only=active_only)
    return {
        "unassigned_count": count,
        "active_only": active_only
    }


# === ADVANCED MANAGEMENT ===
@router.post("/validate-assignment")
def validate_fond_assignment(
    fond_id: int,
    client_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Validează dacă un fond poate fi assignat unui client.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can validate assignments")
    
    # Verifică fondul
    fond = crud_fond.get_fond(db, fond_id)
    if not fond:
        return {"valid": False, "reason": "Fond not found"}
    
    if fond.owner_id is not None:
        current_owner = crud_user.get_user_by_id(db, fond.owner_id)
        return {
            "valid": False, 
            "reason": f"Fond already assigned to {current_owner.username if current_owner else 'unknown user'}"
        }
    
    # Verifică clientul
    client = crud_user.get_user_by_id(db, client_id)
    if not client:
        return {"valid": False, "reason": "Client not found"}
    
    if client.role != "client":
        return {"valid": False, "reason": "User is not a client"}
    
    return {
        "valid": True,
        "fond_name": fond.company_name,
        "client_name": client.username,
        "client_company": client.company_name
    }


@router.get("/clients-with-fonds")
def list_clients_with_fonds(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează clienții care au fonduri assignate.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can view this information")
    
    # Obține clienții cu fonduri folosind join
    from sqlalchemy import func
    clients_query = db.query(
        UserModel.id,
        UserModel.username,
        UserModel.company_name,
        UserModel.contact_email,
        UserModel.created_at,
        func.count(crud_fond.Fond.id).label('fond_count')
    ).join(
        crud_fond.Fond, UserModel.id == crud_fond.Fond.owner_id
    ).filter(
        UserModel.role == "client"
    ).group_by(
        UserModel.id, UserModel.username, UserModel.company_name, 
        UserModel.contact_email, UserModel.created_at
    ).offset(skip).limit(limit)
    
    results = clients_query.all()
    
    return [
        {
            "id": result.id,
            "username": result.username,
            "company_name": result.company_name,
            "contact_email": result.contact_email,
            "created_at": result.created_at,
            "fond_count": result.fond_count
        }
        for result in results
    ]


@router.get("/clients-without-fonds")
def list_clients_without_fonds(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Listează clienții care nu au fonduri assignate.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view this information")
    
    # Obține clienții fără fonduri
    clients_without_fonds = db.query(UserModel).filter(
        UserModel.role == "client",
        ~UserModel.id.in_(
            db.query(crud_fond.Fond.owner_id).filter(
                crud_fond.Fond.owner_id.isnot(None)
            )
        )
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": client.id,
            "username": client.username,
            "company_name": client.company_name,
            "contact_email": client.contact_email,
            "created_at": client.created_at,
            "fond_count": 0
        }
        for client in clients_without_fonds
    ]


# === AUDIT TRAIL ENDPOINTS ===
@router.get("/audit/recent-assignments")
def get_recent_assignments(
    days: int = Query(7, ge=1, le=30, description="Numărul de zile în urmă"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returnează assignment-urile recente de fonduri (pentru audit/admin).
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can view audit trail")
    
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    
    # Calculează data de început
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Obține fondurile care au fost actualizate recent și au owner
    recent_assignments = db.query(crud_fond.Fond).filter(
        and_(
            crud_fond.Fond.updated_at >= start_date,
            crud_fond.Fond.owner_id.isnot(None)
        )
    ).order_by(crud_fond.Fond.updated_at.desc()).limit(limit).all()
    
    results = []
    for fond in recent_assignments:
        owner = crud_user.get_user_by_id(db, fond.owner_id) if fond.owner_id else None
        results.append({
            "fond_id": fond.id,
            "company_name": fond.company_name,
            "owner_username": owner.username if owner else None,
            "owner_company": owner.company_name if owner else None,
            "assigned_at": fond.updated_at,
            "active": fond.active
        })
    
    return {
        "assignments": results,
        "period_days": days,
        "total_found": len(results)
    }


@router.get("/export/ownership-report")
def export_ownership_report(
    format: str = Query("json", regex="^(json|csv)$"),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Exportă un raport complet cu ownership-ul fondurilor.
    """
    if current_user.role not in ["admin", "audit"]:
        raise HTTPException(status_code=403, detail="Only admin and audit can export reports")
    
    # Obține toate fondurile cu owner-ii lor
    query = db.query(crud_fond.Fond).outerjoin(
        UserModel, crud_fond.Fond.owner_id == UserModel.id
    )
    
    if not include_inactive:
        query = query.filter(crud_fond.Fond.active == True)
    
    fonds_with_owners = query.all()
    
    report_data = []
    for fond in fonds_with_owners:
        owner = crud_user.get_user_by_id(db, fond.owner_id) if fond.owner_id else None
        report_data.append({
            "fond_id": fond.id,
            "company_name": fond.company_name,
            "holder_name": fond.holder_name,
            "address": fond.address,
            "email": fond.email,
            "phone": fond.phone,
            "active": fond.active,
            "owner_id": fond.owner_id,
            "owner_username": owner.username if owner else "Unassigned",
            "owner_company": owner.company_name if owner else None,
            "owner_contact": owner.contact_email if owner else None,
            "created_at": fond.created_at.isoformat() if fond.created_at else None,
            "updated_at": fond.updated_at.isoformat() if fond.updated_at else None
        })
    
    if format == "csv":
        # Pentru CSV, returnează instrucțiuni de download
        return {
            "message": "CSV export prepared",
            "total_records": len(report_data),
            "format": "csv",
            "download_instructions": "Use the /export/download endpoint with this report ID"
        }
    else:
        # Pentru JSON, returnează datele direct
        return {
            "report": report_data,
            "metadata": {
                "total_records": len(report_data),
                "include_inactive": include_inactive,
                "generated_at": datetime.utcnow().isoformat(),
                "generated_by": current_user.username
            }
        }
