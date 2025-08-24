# app/crud/fond.py - COMPLETE FIXED VERSION
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

def create_fond(db: Session, fond: FondCreate, owner_id: Optional[int] = None) -> Fond:
    """Create a new fond with optional owner assignment"""
    try:
        # Validate owner if provided
        if owner_id:
            owner = db.query(User).filter(
                User.id == owner_id,
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
            owner_id=owner_id or fond.owner_id
        )
        
        db.add(db_fond)
        db.commit()
        db.refresh(db_fond)
        
        logger.info(f"Created fond {db_fond.id} with owner_id {owner_id}")
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

# Additional functions that might be missing
def get_my_fonds(db: Session, owner_id: int, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
    """Get fonds for a specific owner (client)"""
    query = db.query(Fond).filter(Fond.owner_id == owner_id)
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    return query.offset(skip).limit(limit).all()

def get_my_fonds_count(db: Session, owner_id: int, active_only: bool = True) -> int:
    """Count fonds for a specific owner"""
    query = db.query(Fond).filter(Fond.owner_id == owner_id)
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    return query.count()

def get_fonds_count(db: Session, active_only: bool = True) -> int:
    """Get total count of fonds"""
    query = db.query(Fond)
    
    if active_only:
        query = query.filter(Fond.active == True)
    
    return query.count()

def soft_delete_fond(db: Session, fond_id: int) -> bool:
    """Soft delete a fond (set active=False)"""
    try:
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            return False
        
        db_fond.active = False
        db.commit()
        
        logger.info(f"Soft deleted fond {fond_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error soft deleting fond {fond_id}: {str(e)}")
        db.rollback()
        return False

def permanently_delete_fond(db: Session, fond_id: int) -> bool:
    """Permanently delete a fond"""
    try:
        db_fond = db.query(Fond).filter(Fond.id == fond_id).first()
        if not db_fond:
            return False
        
        db.delete(db_fond)
        db.commit()
        
        logger.info(f"Permanently deleted fond {fond_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error permanently deleting fond {fond_id}: {str(e)}")
        db.rollback()
        return False

# Alias for backward compatibility
def search_fonds_count(db: Session, query: str) -> int:
    """Count search results - alias for count_search_results"""
    return count_search_results(db, query)

# Add this function to your app/crud/fond.py file

def get_client_statistics(db: Session, client_id: int) -> Dict[str, Any]:
    """Get statistics for a specific client's fonds"""
    try:
        # Get total count of client's fonds
        total_fonds = get_my_fonds_count(db, client_id, active_only=False)
        
        # Get active fonds count
        active_fonds = get_my_fonds_count(db, client_id, active_only=True)
        
        # Get inactive fonds count
        inactive_fonds = total_fonds - active_fonds
        
        # You can add more statistics as needed, for example:
        # - Most recent fond
        # - Fonds by location/address
        # - etc.
        
        recent_fond = db.query(Fond).filter(
            Fond.owner_id == client_id
        ).order_by(desc(Fond.id)).first()
        
        return {
            'total_fonds': total_fonds,
            'active_fonds': active_fonds,
            'inactive_fonds': inactive_fonds,
            'has_recent_fond': recent_fond is not None,
            'recent_fond_id': recent_fond.id if recent_fond else None,
            'recent_fond_company': recent_fond.company_name if recent_fond else None
        }
        
    except Exception as e:
        logger.error(f"Error getting client statistics for client {client_id}: {str(e)}")
        return {
            'total_fonds': 0,
            'active_fonds': 0,
            'inactive_fonds': 0,
            'has_recent_fond': False,
            'recent_fond_id': None,
            'recent_fond_company': None
        }

# Add this function to your app/crud/fond.py file

def get_fonds_for_user(
    db: Session, 
    user, 
    skip: int = 0, 
    limit: int = 100, 
    active_only: bool = True,
    include_owner: bool = False
) -> List[Fond]:
    """Get fonds based on user role - admins see all, clients see only their own"""
    try:
        # Check user role
        if user.role == "admin":
            # Admins see all fonds
            return get_fonds(
                db=db, 
                skip=skip, 
                limit=limit, 
                active_only=active_only, 
                include_owner=include_owner
            )
        elif user.role == "client":
            # Clients see only their own fonds
            query = db.query(Fond).filter(Fond.owner_id == user.id)
            
            if include_owner:
                query = query.options(joinedload(Fond.owner))
            
            if active_only:
                query = query.filter(Fond.active == True)
            
            return query.offset(skip).limit(limit).all()
        else:
            # Unknown role - return empty list
            logger.warning(f"Unknown user role: {user.role} for user {user.id}")
            return []
            
    except Exception as e:
        logger.error(f"Error getting fonds for user {user.id} with role {user.role}: {str(e)}")
        return []
