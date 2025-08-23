# app/models/user.py - FIXED VERSION with correct password field name
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    
    # FIXED: Use password_hash consistently (matching create_admin_user.py)
    password_hash = Column(String(128), nullable=False)
    
    role = Column(String(20), nullable=False, default="client", index=True)
    
    # Extended fields for client information
    company_name = Column(String(255), nullable=True)
    contact_email = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship with owned fonds
    owned_fonds = relationship("Fond", back_populates="owner", foreign_keys="Fond.owner_id")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}', company='{self.company_name}')>"

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "company_name": self.company_name,
            "contact_email": self.contact_email,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @property
    def is_admin(self):
        """Check if user has admin role"""
        return self.role == "admin"
    
    @property
    def is_client(self):
        """Check if user has client role"""
        return self.role == "client"
    
    @property
    def is_audit(self):
        """Check if user has audit role"""
        return self.role == "audit"
    
    @property
    def can_edit_fonds(self):
        """Check if user can edit fonds"""
        return self.role == "admin"
    
    @property
    def can_view_all_fonds(self):
        """Check if user can view all fonds"""
        return self.role in ["admin", "audit"]
    
    @property
    def owned_fonds_count(self):
        """Get count of owned fonds"""
        return len(self.owned_fonds) if self.owned_fonds else 0
    
    @property
    def active_owned_fonds_count(self):
        """Get count of active owned fonds"""
        if not self.owned_fonds:
            return 0
        return len([fond for fond in self.owned_fonds if fond.active])

    def can_access_fond(self, fond):
        """Check if user can access a specific fond"""
        # Admins and audit users can access all fonds
        if self.role in ["admin", "audit"]:
            return True
        
        # Clients can only access their own fonds
        if self.role == "client":
            return fond.owner_id == self.id
        
        return False

    def can_edit_fond(self, fond):
        """Check if user can edit a specific fond"""
        # Only admins can edit any fond
        if self.role == "admin":
            return True
        
        # Clients can edit their own fonds
        if self.role == "client":
            return fond.owner_id == self.id
        
        return False
