# app/api/routes/admin_fonds.py - Enhanced with Owner Assignment
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ...database import get_db
from ...models.user import User
from ...models.fond import Fond
from ...schemas.fond import FondResponse, FondCreate, FondUpdate
from ...schemas.user import UserResponse
from ...core.auth import get_current_admin_user, get_current_user
from ...crud import fond as fond_crud, user as user_crud
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# NEW: Owner Assignment Schema
from pydantic import BaseModel

class OwnerAssignmentRequest(BaseModel):
    owner_id: Optional[int] = None

class OwnerAssignmentResponse(BaseModel):
    message: str
    fond_id: int
    owner_id: Optional[int]
    owner_username: Optional[str] = None
    success: bool = True

# Enhanced Fond endpoints with owner information
@router.get("/fonds/", response_model=List[FondResponse])
def get_all_fonds(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True),
    include_owner: bool = Query(False),  # NEW: Include owner information
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all fonds with optional owner information (Admin only)
    """
    try:
        # Build query with optional owner join
        query = db.query(Fond)
        
        if include_owner:
            query = query.options(joinedload(Fond.owner))
        
        if active_only:
            query = query.filter(Fond.active == True)
        
        fonds = query.offset(skip).limit(limit).all()
        
        # Convert to response format
        result = []
        for fond in fonds:
            fond_dict = {
                "id": fond.id,
                "company_name": fond.company_name,
                "holder_name": fond.holder_name,
                "address": fond.address,
                "email": fond.email,
                "phone": fond.phone,
                "notes": fond.notes,
                "source_url": fond.source_url,
                "active": fond.active,
                "created_at": fond.created_at,
                "updated_at": fond.updated_at,
                "owner_id": fond.owner_id
            }
            
            # Add owner information if requested and available
            if include_owner and fond.owner:
                fond_dict["owner"] = {
                    "id": fond.owner.id,
                    "username": fond.owner.username,
                    "company_name": fond.owner.company_name
                }
            
            result.append(fond_dict)
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting fonds: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving fonds"
        )

# NEW: Manual Owner Assignment Endpoint
@router.post("/fonds/{fond_id}/assign-owner", response_model=OwnerAssignmentResponse)
def assign_fond_owner(
    fond_id: int,
    assignment_request: OwnerAssignmentRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually assign or unassign a fond to/from a user (Admin only)
    """
    try:
        # Get the fond
        fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not fond:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fond not found"
            )
        
        old_owner_id = fond.owner_id
        new_owner_id = assignment_request.owner_id
        
        # Validate new owner if provided
        new_owner = None
        if new_owner_id:
            new_owner = db.query(User).filter(
                User.id == new_owner_id,
                User.role == "client"  # Only clients can own fonds
            ).first()
            
            if not new_owner:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid owner ID or user is not a client"
                )
        
        # Update the assignment
        fond.owner_id = new_owner_id
        db.commit()
        db.refresh(fond)
        
        # Prepare response message
        if new_owner_id and old_owner_id:
            message = f"Fond reassigned from user {old_owner_id} to {new_owner.username}"
        elif new_owner_id:
            message = f"Fond assigned to {new_owner.username}"
        elif old_owner_id:
            message = "Fond assignment removed"
        else:
            message = "No assignment change"
        
        logger.info(f"Admin {current_user.username} {message.lower()} for fond {fond_id}")
        
        return OwnerAssignmentResponse(
            message=message,
            fond_id=fond_id,
            owner_id=new_owner_id,
            owner_username=new_owner.username if new_owner else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning fond owner: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error assigning fond owner"
        )

# Enhanced Fond Creation with Owner Assignment
@router.post("/fonds/", response_model=FondResponse)
def create_fond_with_owner(
    fond_data: FondCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new fond with optional owner assignment (Admin only)
    """
    try:
        # Validate owner if provided
        if fond_data.owner_id:
            owner = db.query(User).filter(
                User.id == fond_data.owner_id,
                User.role == "client"
            ).first()
            
            if not owner:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid owner ID or user is not a client"
                )
        
        # Create the fond
        db_fond = fond_crud.create_fond(db=db, fond=fond_data)
        
        logger.info(f"Admin {current_user.username} created fond {db_fond.id}")
        if fond_data.owner_id:
            logger.info(f"Fond {db_fond.id} assigned to owner {fond_data.owner_id}")
        
        return db_fond
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fond: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating fond"
        )

# Enhanced Fond Update with Owner Assignment
@router.put("/fonds/{fond_id}", response_model=dict)
def update_fond_with_owner(
    fond_id: int,
    fond_data: FondUpdate,
    auto_reassign: bool = Query(False, description="Enable automatic reassignment based on similarity"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update a fond with owner assignment and optional auto-reassignment (Admin only)
    """
    try:
        # Get existing fond
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fond not found"
            )
        
        old_holder_name = db_fond.holder_name
        old_owner_id = db_fond.owner_id
        
        # Validate new owner if provided
        if fond_data.owner_id:
            owner = db.query(User).filter(
                User.id == fond_data.owner_id,
                User.role == "client"
            ).first()
            
            if not owner:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid owner ID or user is not a client"
                )
        
        # Update the fond
        updated_fond = fond_crud.update_fond(db=db, fond_id=fond_id, fond_update=fond_data)
        
        # Check for auto-reassignment if holder name changed and auto_reassign is enabled
        reassignment_suggestions = None
        if auto_reassign and old_holder_name != updated_fond.holder_name:
            # Import here to avoid circular imports
            from ...services.reassignment_service import check_reassignment_needed
            
            reassignment_result = check_reassignment_needed(
                db=db,
                fond=updated_fond,
                old_holder_name=old_holder_name
            )
            
            if reassignment_result["requires_confirmation"]:
                reassignment_suggestions = reassignment_result
        
        # Prepare response
        response = {
            "fond": {
                "id": updated_fond.id,
                "company_name": updated_fond.company_name,
                "holder_name": updated_fond.holder_name,
                "address": updated_fond.address,
                "email": updated_fond.email,
                "phone": updated_fond.phone,
                "notes": updated_fond.notes,
                "source_url": updated_fond.source_url,
                "active": updated_fond.active,
                "created_at": updated_fond.created_at,
                "updated_at": updated_fond.updated_at,
                "owner_id": updated_fond.owner_id
            },
            "auto_reassignment_applied": False,
            "owner_change_applied": old_owner_id != updated_fond.owner_id
        }
        
        # Add reassignment suggestions if any
        if reassignment_suggestions:
            response["reassignment_suggestions"] = reassignment_suggestions
        
        logger.info(f"Admin {current_user.username} updated fond {fond_id}")
        if old_owner_id != updated_fond.owner_id:
            logger.info(f"Fond {fond_id} owner changed from {old_owner_id} to {updated_fond.owner_id}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fond: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating fond"
        )

# NEW: Get Available Users for Assignment
@router.get("/users/clients", response_model=List[UserResponse])
def get_client_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all client users available for fond assignment (Admin only)
    """
    try:
        client_users = db.query(User).filter(User.role == "client").all()
        return client_users
        
    except Exception as e:
        logger.error(f"Error getting client users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving client users"
        )

# NEW: Ownership Statistics
@router.get("/fonds/statistics/ownership")
def get_ownership_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get ownership statistics for fonds (Admin only)
    """
    try:
        total_fonds = db.query(Fond).count()
        active_fonds = db.query(Fond).filter(Fond.active == True).count()
        assigned_fonds = db.query(Fond).filter(Fond.owner_id.isnot(None)).count()
        unassigned_fonds = total_fonds - assigned_fonds
        
        # Assignment rate
        assignment_rate = round((assigned_fonds / total_fonds * 100) if total_fonds > 0 else 0, 1)
        
        # Client distribution
        client_distribution = db.query(
            User.id,
            User.username, 
            User.company_name,
            db.func.count(Fond.id).label('fond_count')
        ).join(
            Fond, User.id == Fond.owner_id
        ).filter(
            User.role == "client"
        ).group_by(
            User.id, User.username, User.company_name
        ).order_by(
            db.func.count(Fond.id).desc()
        ).all()
        
        clients_with_fonds = len(client_distribution)
        
        return {
            "total_fonds": total_fonds,
            "active_fonds": active_fonds,
            "assigned_fonds": assigned_fonds,
            "unassigned_fonds": unassigned_fonds,
            "assignment_rate": assignment_rate,
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
        
    except Exception as e:
        logger.error(f"Error getting ownership statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving ownership statistics"
        )
