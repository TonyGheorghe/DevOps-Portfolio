# app/models/user.py
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(16), nullable=False, default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Removed is_active field since it doesn't exist in current schema
