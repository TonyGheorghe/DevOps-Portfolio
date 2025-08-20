# app/models/user.py - Updated with Extended Roles
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    
    # Extended roles: admin, audit, client
    role = Column(String(16), nullable=False, default="client")
    
    # Optional fields for client information
    company_name = Column(String(255), nullable=True)  # For client users - what company they represent
    contact_email = Column(String(100), nullable=True)  # Additional contact info
    notes = Column(Text, nullable=True)  # Admin notes about this user
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
