# app/models/fond.py
from sqlalchemy import Column, String, Text, Boolean, DateTime, BigInteger
from sqlalchemy.sql import func
from app.models.base import Base

class Fond(Base):
    __tablename__ = "fonds"

    id = Column(BigInteger, primary_key=True, index=True)
    company_name = Column(Text, nullable=False)
    holder_name = Column(Text, nullable=False)
    address = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
