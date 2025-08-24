# app/models/user.py - MODEL USER REPARAT
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base  # Import unificat

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)  # CONSISTENT cu create_admin_user.py
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
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"

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
    
    # Role-based properties
    @property
    def is_admin(self):
        return self.role == "admin"
    
    @property
    def is_audit(self):
        return self.role == "audit"
    
    @property
    def is_client(self):
        return self.role == "client"
