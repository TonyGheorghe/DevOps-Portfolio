# app/services/assignment_service.py - Owner Assignment Management Service
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from ..models.user import User
from ..models.fond import Fond
import logging
import re

logger = logging.getLogger(__name__)

class AssignmentService:
    """Service for managing fond ownership assignments"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def assign_fond_to_user(self, fond_id: int, user_id: Optional[int]) -> Dict[str, Any]:
        """
        Assign a fond to a user or unassign it
        
        Args:
            fond_id: ID of the fond to assign
            user_id: ID of the user to assign to (None to unassign)
            
        Returns:
            Dict with assignment result information
        """
        try:
            # Get the fond
            fond = self.db.query(Fond).filter(Fond.id == fond_id).first()
            if not fond:
                return {
                    "success": False,
                    "error": "Fond not found",
                    "fond_id": fond_id
                }
            
            old_owner_id = fond.owner_id
            
            # Validate new owner if provided
            new_owner = None
            if user_id:
                new_owner = self.db.query(User).filter(
                    User.id == user_id,
                    User.role == "client"
                ).first()
                
                if not new_owner:
                    return {
                        "success": False,
                        "error": "Invalid user ID or user is not a client",
                        "fond_id": fond_id
                    }
            
            # Update assignment
            fond.owner_id = user_id
            self.db.commit()
            self.db.refresh(fond)
            
            # Prepare result
            result = {
                "success": True,
                "fond_id": fond_id,
                "old_owner_id": old_owner_id,
                "new_owner_id": user_id,
                "fond_name": fond.company_name
            }
            
            if user_id and old_owner_id:
                result["action"] = "reassigned"
                result["message"] = f"Fond '{fond.company_name}' reassigned to {new_owner.username}"
            elif user_id:
                result["action"] = "assigned"
                result["message"] = f"Fond '{fond.company_name}' assigned to {new_owner.username}"
            elif old_owner_id:
                result["action"] = "unassigned"
                result["message"] = f"Fond '{fond.company_name}' unassigned"
            else:
                result["action"] = "no_change"
                result["message"] = "No assignment change"
            
            if new_owner:
                result["new_owner_username"] = new_owner.username
                result["new_owner_company"] = new_owner.company_name
            
            logger.info(f"Fond {fond_id} assignment: {result['action']}")
            return result
            
        except Exception as e:
            logger.error(f"Error in assignment: {str(e)}")
            self.db.rollback()
            return {
                "success": False,
                "error": str(e),
                "fond_id": fond_id
            }
    
    def bulk_assign_fonds(self, fond_ids: List[int], user_id: Optional[int]) -> Dict[str, Any]:
        """
        Bulk assign multiple fonds to a user
        
        Args:
            fond_ids: List of fond IDs to assign
            user_id: User ID to assign to (None to unassign all)
            
        Returns:
            Dict with bulk assignment results
        """
        results = []
        successful = 0
        failed = 0
        
        for fond_id in fond_ids:
            result = self.assign_fond_to_user(fond_id, user_id)
            results.append(result)
            
            if result["success"]:
                successful += 1
            else:
                failed += 1
        
        return {
            "total_fonds": len(fond_ids),
            "successful_assignments": successful,
            "failed_assignments": failed,
            "results": results
        }
    
    def suggest_assignments_by_similarity(self, fond_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Suggest potential owners for a fond based on company name similarity
        
        Args:
            fond_id: ID of the fond to find assignments for
            limit: Maximum number of suggestions to return
            
        Returns:
            List of suggested assignments with similarity scores
        """
        try:
            # Get the fond
            fond = self.db.query(Fond).filter(Fond.id == fond_id).first()
            if not fond:
                return []
            
            # Get all client users
            clients = self.db.query(User).filter(User.role == "client").all()
            
            suggestions = []
            fond_company_normalized = self._normalize_company_name(fond.company_name)
            
            for client in clients:
                if not client.company_name:
                    continue
                
                client_company_normalized = self._normalize_company_name(client.company_name)
                similarity = self._calculate_similarity(fond_company_normalized, client_company_normalized)
                
                if similarity > 0.3:  # Only suggest if similarity > 30%
                    suggestions.append({
                        "user_id": client.id,
                        "username": client.username,
                        "company_name": client.company_name,
                        "similarity": similarity,
                        "confidence": self._get_confidence_level(similarity),
                        "match_type": self._get_match_type(similarity)
                    })
            
            # Sort by similarity and limit
            suggestions.sort(key=lambda x: x["similarity"], reverse=True)
            return suggestions[:limit]
            
        except Exception as e:
            logger.error(f"Error getting assignment suggestions: {str(e)}")
            return []
    
    def get_unassigned_fonds(self, skip: int = 0, limit: int = 100) -> List[Fond]:
        """Get all fonds that are not assigned to any user"""
        return self.db.query(Fond).filter(
            Fond.owner_id.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_user_fonds(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Fond]:
        """Get all fonds assigned to a specific user"""
        return self.db.query(Fond).filter(
            Fond.owner_id == user_id
        ).offset(skip).limit(limit).all()
    
    def get_assignment_statistics(self) -> Dict[str, Any]:
        """Get comprehensive assignment statistics"""
        try:
            total_fonds = self.db.query(Fond).count()
            assigned_fonds = self.db.query(Fond).filter(Fond.owner_id.isnot(None)).count()
            unassigned_fonds = total_fonds - assigned_fonds
            
            # Client distribution
            client_stats = self.db.query(
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
                func.count(Fond.id).desc()
            ).all()
            
            # Top clients by fond count
            top_clients = [
                {
                    "user_id": stat.id,
                    "username": stat.username,
                    "company_name": stat.company_name,
                    "fond_count": stat.fond_count
                }
                for stat in client_stats[:10]
            ]
            
            # Assignment rate by client
            client_distribution = []
            for stat in client_stats:
                assignment_rate = (stat.fond_count / total_fonds * 100) if total_fonds > 0 else 0
                client_distribution.append({
                    "user_id": stat.id,
                    "username": stat.username,
                    "company_name": stat.company_name,
                    "fond_count": stat.fond_count,
                    "assignment_percentage": round(assignment_rate, 2)
                })
            
            return {
                "total_fonds": total_fonds,
                "assigned_fonds": assigned_fonds,
                "unassigned_fonds": unassigned_fonds,
                "assignment_rate": round((assigned_fonds / total_fonds * 100) if total_fonds > 0 else 0, 2),
                "clients_with_fonds": len(client_stats),
                "top_clients": top_clients,
                "client_distribution": client_distribution
            }
            
        except Exception as e:
            logger.error(f"Error getting assignment statistics: {str(e)}")
            return {}
    
    def auto_assign_by_similarity(self, threshold: float = 0.8) -> Dict[str, Any]:
        """
        Automatically assign unassigned fonds to users based on company name similarity
        
        Args:
            threshold: Minimum similarity threshold for auto-assignment
            
        Returns:
            Dict with auto-assignment results
        """
        try:
            unassigned_fonds = self.get_unassigned_fonds(limit=1000)  # Get all unassigned
            
            auto_assigned = 0
            manual_review_needed = 0
            results = []
            
            for fond in unassigned_fonds:
                suggestions = self.suggest_assignments_by_similarity(fond.id, limit=1)
                
                if suggestions and suggestions[0]["similarity"] >= threshold:
                    # Auto-assign to the best match
                    best_match = suggestions[0]
                    result = self.assign_fond_to_user(fond.id, best_match["user_id"])
                    
                    if result["success"]:
                        auto_assigned += 1
                        results.append({
                            "fond_id": fond.id,
                            "fond_name": fond.company_name,
                            "assigned_to": best_match["username"],
                            "similarity": best_match["similarity"],
                            "action": "auto_assigned"
                        })
                    else:
                        manual_review_needed += 1
                        results.append({
                            "fond_id": fond.id,
                            "fond_name": fond.company_name,
                            "error": result.get("error"),
                            "action": "failed"
                        })
                else:
                    manual_review_needed += 1
                    results.append({
                        "fond_id": fond.id,
                        "fond_name": fond.company_name,
                        "best_similarity": suggestions[0]["similarity"] if suggestions else 0,
                        "action": "manual_review_needed"
                    })
            
            return {
                "total_processed": len(unassigned_fonds),
                "auto_assigned": auto_assigned,
                "manual_review_needed": manual_review_needed,
                "threshold_used": threshold,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Error in auto-assignment: {str(e)}")
            return {
                "error": str(e),
                "total_processed": 0,
                "auto_assigned": 0,
                "manual_review_needed": 0
            }
    
    def _normalize_company_name(self, name: str) -> str:
        """Normalize company name for comparison"""
        if not name:
            return ""
        
        normalized = name.lower().strip()
        
        # Remove common company suffixes/prefixes
        normalized = re.sub(r'^(sc|sa|srl|sra|ltd|llc|inc|corp|corporation)\s+', '', normalized)
        normalized = re.sub(r'\s+(sc|sa|srl|sra|ltd|llc|inc|corp|corporation), '', normalized)
        
        # Remove special characters
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        # Replace multiple spaces with single space
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two normalized strings"""
        if not str1 or not str2:
            return 0.0
        
        # Exact match
        if str1 == str2:
            return 1.0
        
        # Substring match
        if str1 in str2 or str2 in str1:
            return 0.8
        
        # Word-based similarity
        words1 = set(str1.split())
        words2 = set(str2.split())
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _get_confidence_level(self, similarity: float) -> str:
        """Get confidence level based on similarity score"""
        if similarity >= 0.9:
            return "very_high"
        elif similarity >= 0.8:
            return "high"
        elif similarity >= 0.6:
            return "medium"
        elif similarity >= 0.4:
            return "low"
        else:
            return "very_low"
    
    def _get_match_type(self, similarity: float) -> str:
        """Get match type based on similarity score"""
        if similarity >= 0.95:
            return "exact"
        elif similarity >= 0.8:
            return "strong"
        elif similarity >= 0.6:
            return "partial"
        elif similarity >= 0.4:
            return "weak"
        else:
            return "minimal"


# Helper functions for use in other modules
def create_assignment_service(db: Session) -> AssignmentService:
    """Factory function to create AssignmentService instance"""
    return AssignmentService(db)

def assign_fond_to_user(db: Session, fond_id: int, user_id: Optional[int]) -> Dict[str, Any]:
    """Convenience function for single fond assignment"""
    service = AssignmentService(db)
    return service.assign_fond_to_user(fond_id, user_id)

def bulk_assign_fonds(db: Session, fond_ids: List[int], user_id: Optional[int]) -> Dict[str, Any]:
    """Convenience function for bulk fond assignment"""
    service = AssignmentService(db)
    return service.bulk_assign_fonds(fond_ids, user_id)

def suggest_assignments_by_similarity(db: Session, fond_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """Convenience function for getting assignment suggestions"""
    service = AssignmentService(db)
    return service.suggest_assignments_by_similarity(fond_id, limit)

def auto_assign_unassigned_fonds(db: Session, threshold: float = 0.8) -> Dict[str, Any]:
    """Convenience function for auto-assignment"""
    service = AssignmentService(db)
    return service.auto_assign_by_similarity(threshold)

def get_assignment_statistics(db: Session) -> Dict[str, Any]:
    """Convenience function for getting assignment statistics"""
    service = AssignmentService(db)
    return service.get_assignment_statistics()
