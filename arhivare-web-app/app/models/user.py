# app/models/user.py - Updated with Extended Roles and Ownership Support
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    
    # EXTENDED ROLES: admin, audit, client (was admin/user before)
    role = Column(String(16), nullable=False, default="client")
    
    # Optional fields for client information
    company_name = Column(String(255), nullable=True)  # For client users - what company they represent
    contact_email = Column(String(100), nullable=True)  # Additional contact info
    notes = Column(Text, nullable=True)  # Admin notes about this user
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role == "admin"
    
    @property
    def is_audit(self) -> bool:
        """Check if user has audit privileges."""
        return self.role == "audit"
    
    @property
    def is_client(self) -> bool:
        """Check if user is a client."""
        return self.role == "client"
    
    @property
    def can_manage_users(self) -> bool:
        """Check if user can manage other users."""
        return self.role == "admin"
    
    @property
    def can_manage_all_fonds(self) -> bool:
        """Check if user can manage all fonds."""
        return self.role == "admin"
    
    @property
    def can_view_all_fonds(self) -> bool:
        """Check if user can view all fonds."""
        return self.role in ["admin", "audit"]
    
    def can_edit_fond(self, fond) -> bool:
        """Check if user can edit a specific fond."""
        if self.role == "admin":
            return True
        elif self.role == "audit":
            return False  # Audit can only view, not edit
        elif self.role == "client":
            return fond.owner_id == self.id  # Can only edit own fonds
        return False
    
    def can_view_fond(self, fond) -> bool:
        """Check if user can view a specific fond."""
        if self.role in ["admin", "audit"]:
            return True
        elif self.role == "client":
            return fond.owner_id == self.id  # Can only view own fonds
        return False
