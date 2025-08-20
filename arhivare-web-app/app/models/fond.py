# app/models/fond.py - Updated with Enhanced Ownership Logic
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class Fond(Base):
    __tablename__ = "fonds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_name = Column(Text, nullable=False)
    holder_name = Column(Text, nullable=False)
    address = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    
    # OWNERSHIP: which client user owns this fond (NULL = unassigned)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship to User (owner)
    owner = relationship("User", backref="owned_fonds")
    
    def __repr__(self):
        return f"<Fond(id={self.id}, company='{self.company_name}', owner_id={self.owner_id})>"
    
    @property
    def is_assigned(self) -> bool:
        """Check if fond is assigned to a client."""
        return self.owner_id is not None
    
    @property
    def is_unassigned(self) -> bool:
        """Check if fond is unassigned (available for assignment)."""
        return self.owner_id is None
    
    @property
    def owner_company(self) -> str:
        """Get the company name of the owner."""
        if self.owner and hasattr(self.owner, 'company_name') and self.owner.company_name:
            return self.owner.company_name
        return "Unassigned"
    
    @property
    def display_status(self) -> str:
        """Get display status for UI."""
        if not self.active:
            return "Inactive"
        elif self.is_assigned:
            return f"Assigned to {self.owner.username}"
        else:
            return "Unassigned"
    
    def can_be_edited_by(self, user) -> bool:
        """Check if fond can be edited by user."""
        return user.can_edit_fond(self)
    
    def can_be_viewed_by(self, user) -> bool:
        """Check if fond can be viewed by user."""
        return user.can_view_fond(self)
    
    def assign_to_client(self, client_user):
        """Assign this fond to a client user."""
        if client_user.role != "client":
            raise ValueError("Can only assign fonds to client users")
        self.owner_id = client_user.id
    
    def unassign(self):
        """Remove assignment from this fond."""
        self.owner_id = None
