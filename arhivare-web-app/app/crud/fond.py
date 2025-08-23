# app/crud/fond.py - Enhanced CRUD operations with owner support
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from ..models.fond import Fond
from ..models.user import User
from ..schemas.fond import FondCreate, FondUpdate
import logging

logger = logging.getLogger(__name__)

def get_fond(db: Session, fond_id: int, include_owner: bool = False) -> Optional[Fond]:
    """Get a single fond by ID with optional owner information"""
    query = db.query(Fond).filter(Fond.id == fond_id)
    
    if include_owner:
        query = query.options(joinedload(Fond.owner))
    
    return query.first()

def get_fonds(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    active_only: bool = True,
    include_owner: bool = False,
    owner_id: Optional[int] = None
) -> List[Fond]:
    """Get multiple fonds with filtering options"""
    query = db.query(Fond)
    
    if include_owner:
        query = query.options(joinedload(Fond.owner))
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    if owner_id is not None:
        if owner_id == 0:  # Special case: unassigned fonds
            query = query.filter(Fond.owner_id.is_(None))
        else:
            query = query.filter(Fond.owner_id == owner_id)
    
    return query.offset(skip).limit(limit).all()

def get_fonds_by_owner(
    db: Session, 
    owner_id: int, 
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = True
) -> List[Fond]:
    """Get all fonds owned by a specific user"""
    query = db.query(Fond).filter(Fond.owner_id == owner_id)
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    return query.offset(skip).limit(limit).all()

def get_unassigned_fonds(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = True
) -> List[Fond]:
    """Get all fonds that are not assigned to any user"""
    query = db.query(Fond).filter(Fond.owner_id.is_(None))
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    return query.offset(skip).limit(limit).all()

def create_fond(db: Session, fond: FondCreate) -> Fond:
    """Create a new fond with optional owner assignment"""
    try:
        # Validate owner if provided
        if fond.owner_id:
            owner = db.query(User).filter(
                User.id == fond.owner_id,
                User.role == "client"
            ).first()
            
            if not owner:
                raise ValueError("Invalid owner_id: User not found or not a client")
        
        db_fond = Fond(
            company_name=fond.company_name,
            holder_name=fond.holder_name,
            address=fond.address,
            email=fond.email,
            phone=fond.phone,
            notes=fond.notes,
            source_url=fond.source_url,
            active=fond.active,
            owner_id=fond.owner_id
        )
        
        db.add(db_fond)
        db.commit()
        db.refresh(db_fond)
        
        logger.info(f"Created fond {db_fond.id} with owner_id {fond.owner_id}")
        return db_fond
        
    except Exception as e:
        logger.error(f"Error creating fond: {str(e)}")
        db.rollback()
        raise

def update_fond(db: Session, fond_id: int, fond_update: FondUpdate) -> Optional[Fond]:
    """Update an existing fond with optional owner change"""
    try:
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            return None
        
        old_owner_id = db_fond.owner_id
        
        # Validate new owner if provided and different from current
        if hasattr(fond_update, 'owner_id') and fond_update.owner_id is not None:
            if fond_update.owner_id != old_owner_id:
                owner = db.query(User).filter(
                    User.id == fond_update.owner_id,
                    User.role == "client"
                ).first()
                
                if not owner:
                    raise ValueError("Invalid owner_id: User not found or not a client")
        
        # Update fields that are provided
        update_data = fond_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_fond, field, value)
        
        db.commit()
        db.refresh(db_fond)
        
        # Log owner changes
        if hasattr(fond_update, 'owner_id') and fond_update.owner_id != old_owner_id:
            logger.info(f"Fond {fond_id} owner changed from {old_owner_id} to {fond_update.owner_id}")
        
        return db_fond
        
    except Exception as e:
        logger.error(f"Error updating fond {fond_id}: {str(e)}")
        db.rollback()
        raise

def delete_fond(db: Session, fond_id: int) -> bool:
    """Delete a fond"""
    try:
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            return False
        
        owner_id = db_fond.owner_id
        db.delete(db_fond)
        db.commit()
        
        logger.info(f"Deleted fond {fond_id} (was owned by {owner_id})")
        return True
        
    except Exception as e:
        logger.error(f"Error deleting fond {fond_id}: {str(e)}")
        db.rollback()
        raise

def assign_fond_owner(db: Session, fond_id: int, owner_id: Optional[int]) -> Optional[Fond]:
    """Assign or unassign a fond to/from a user"""
    try:
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            return None
        
        old_owner_id = db_fond.owner_id
        
        # Validate new owner if provided
        if owner_id:
            owner = db.query(User).filter(
                User.id == owner_id,
                User.role == "client"
            ).first()
            
            if not owner:
                raise ValueError("Invalid owner_id: User not found or not a client")
        
        db_fond.owner_id = owner_id
        db.commit()
        db.refresh(db_fond)
        
        logger.info(f"Fond {fond_id} ownership changed from {old_owner_id} to {owner_id}")
        return db_fond
        
    except Exception as e:
        logger.error(f"Error assigning fond owner: {str(e)}")
        db.rollback()
        raise

def bulk_assign_owner(db: Session, fond_ids: List[int], owner_id: Optional[int]) -> Dict[str, Any]:
    """Bulk assign multiple fonds to a user"""
    try:
        # Validate owner if provided
        if owner_id:
            owner = db.query(User).filter(
                User.id == owner_id,
                User.role == "client"
            ).first()
            
            if not owner:
                raise ValueError("Invalid owner_id: User not found or not a client")
        
        # Update all fonds
        updated = db.query(Fond).filter(Fond.id.in_(fond_ids)).update(
            {Fond.owner_id: owner_id},
            synchronize_session=False
        )
        
        db.commit()
        
        logger.info(f"Bulk assigned {updated} fonds to owner {owner_id}")
        
        return {
            "success": True,
            "updated_count": updated,
            "owner_id": owner_id,
            "fond_ids": fond_ids
        }
        
    except Exception as e:
        logger.error(f"Error in bulk assignment: {str(e)}")
        db.rollback()
        raise

def search_fonds(
    db: Session, 
    query: str, 
    skip: int = 0, 
    limit: int = 20,
    active_only: bool = True
) -> List[Fond]:
    """Search fonds by company name or holder name (public search)"""
    search_query = db.query(Fond)
    
    if active_only:
        search_query = search_query.filter(Fond.active == True)
    
    # Search in company_name and holder_name
    search_term = f"%{query}%"
    search_query = search_query.filter(
        or_(
            Fond.company_name.ilike(search_term),
            Fond.holder_name.ilike(search_term),
            Fond.address.ilike(search_term),
            Fond.notes.ilike(search_term)
        )
    )
    
    return search_query.offset(skip).limit(limit).all()

def count_search_results(db: Session, query: str, active_only: bool = True) -> int:
    """Count search results for pagination"""
    search_query = db.query(Fond)
    
    if active_only:
        search_query = search_query.filter(Fond.active == True)
    
    search_term = f"%{query}%"
    search_query = search_query.filter(
        or_(
            Fond.company_name.ilike(search_term),
            Fond.holder_name.ilike(search_term),
            Fond.address.ilike(search_term),
            Fond.notes.ilike(search_term)
        )
    )
    
    return search_query.count()

def get_fond_statistics(db: Session) -> Dict[str, Any]:
    """Get comprehensive fond statistics including ownership"""
    try:
        total_fonds = db.query(Fond).count()
        active_fonds = db.query(Fond).filter(Fond.active == True).count()
        inactive_fonds = total_fonds - active_fonds
        assigned_fonds = db.query(Fond).filter(Fond.owner_id.isnot(None)).count()
        unassigned_fonds = total_fonds - assigned_fonds
        
        # Assignment rate
        assignment_rate = round((assigned_fonds / total_fonds * 100) if total_fonds > 0 else 0, 1)
        
        # Top clients by fond count
        top_clients = db.query(
            User.id,
            User.username,
            User.company_name,
            func.count(Fond.id).label('fond_count')
        ).join(
            Fond, User.id == Fond.owner_id
        ).filter(
            User.role == "client"
        ).group_by(
            User.id, User.username, User.company_name
        ).order_by(
            desc(func.count(Fond.id))
        ).limit(10).all()
        
        clients_with_fonds = len(top_clients)
        
        return {
            "total_fonds": total_fonds,
            "active_fonds": active_fonds,
            "inactive_fonds": inactive_fonds,
            "assigned_fonds": assigned_fonds,
            "unassigned_fonds": unassigned_fonds,
            "assignment_rate": assignment_rate,
            "clients_with_fonds": clients_with_fonds,
            "top_clients": [
                {
                    "user_id": client.id,
                    "username": client.username,
                    "company_name": client.company_name,
                    "fond_count": client.fond_count
                }
                for client in top_clients
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting fond statistics: {str(e)}")
        return {}

def get_user_fond_statistics(db: Session, user_id: int) -> Dict[str, Any]:
    """Get statistics for a specific user's fonds"""
    try:
        user_fonds = db.query(Fond).filter(Fond.owner_id == user_id)
        
        total_fonds = user_fonds.count()
        active_fonds = user_fonds.filter(Fond.active == True).count()
        inactive_fonds = total_fonds - active_fonds
        
        # Calculate completion rate based on filled fields
        if total_fonds > 0:
            completion_scores = []
            for fond in user_fonds.all():
                completion_scores.append(fond.completion_percentage)
            
            completion_rate = round(sum(completion_scores) / len(completion_scores), 1)
        else:
            completion_rate = 0.0
        
        # Last updated
        latest_fond = user_fonds.order_by(desc(Fond.updated_at)).first()
        last_updated = latest_fond.updated_at if latest_fond else None
        
        return {
            "total_fonds": total_fonds,
            "active_fonds": active_fonds,
            "inactive_fonds": inactive_fonds,
            "completion_rate": completion_rate,
            "last_updated": last_updated
        }
        
    except Exception as e:
        logger.error(f"Error getting user fond statistics: {str(e)}")
        return {
            "total_fonds": 0,
            "active_fonds": 0,
            "inactive_fonds": 0,
            "completion_rate": 0.0,
            "last_updated": None
        }
