# app/models/fond.py - Enhanced with owner relationship
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Fond(Base):
    __tablename__ = "fonds"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    holder_name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)
    active = Column(Boolean, default=True, nullable=False, index=True)
    
    # NEW: Owner relationship
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    owner = relationship("User", back_populates="owned_fonds", foreign_keys=[owner_id])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Fond(id={self.id}, company_name='{self.company_name}', holder_name='{self.holder_name}', owner_id={self.owner_id})>"

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            "id": self.id,
            "company_name": self.company_name,
            "holder_name": self.holder_name,
            "address": self.address,
            "email": self.email,
            "phone": self.phone,
            "notes": self.notes,
            "source_url": self.source_url,
            "active": self.active,
            "owner_id": self.owner_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def to_search_dict(self):
        """Convert model instance to search result dictionary"""
        return {
            "id": self.id,
            "company_name": self.company_name,
            "holder_name": self.holder_name,
            "address": self.address,
            "email": self.email,
            "phone": self.phone,
            "notes": self.notes,
            "active": self.active
        }

    @property
    def is_assigned(self):
        """Check if fond is assigned to an owner"""
        return self.owner_id is not None

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on filled fields"""
        total_fields = 7  # company_name, holder_name, address, email, phone, notes, source_url
        filled_fields = 2  # company_name and holder_name are required
        
        if self.address and self.address.strip():
            filled_fields += 1
        if self.email and self.email.strip():
            filled_fields += 1
        if self.phone and self.phone.strip():
            filled_fields += 1
        if self.notes and self.notes.strip():
            filled_fields += 1
        if self.source_url and self.source_url.strip():
            filled_fields += 1
            
        return round((filled_fields / total_fields) * 100, 1)

