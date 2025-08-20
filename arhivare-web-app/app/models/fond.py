# app/models/fond.py - Updated with Ownership
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
    
    # NEW: Ownership field - which client user owns this fond
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship to User (owner)
    owner = relationship("User", backref="owned_fonds")
    
    def __repr__(self):
        return f"<Fond(id={self.id}, company='{self.company_name}', owner_id={self.owner_id})>"
