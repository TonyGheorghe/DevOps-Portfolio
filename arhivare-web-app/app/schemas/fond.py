# app/schemas/fond.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re


class FondBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, description="Numele companiei")
    holder_name: str = Field(..., min_length=2, max_length=255, description="Numele deținătorului arhivei")
    address: Optional[str] = Field(None, max_length=500, description="Adresa completă")
    email: Optional[str] = Field(None, max_length=100, description="Adresa de email de contact")
    phone: Optional[str] = Field(None, max_length=20, description="Numărul de telefon")
    notes: Optional[str] = Field(None, max_length=1000, description="Note suplimentare")
    source_url: Optional[str] = Field(None, max_length=500, description="URL sursă pentru informații")

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None and v.strip():
            # Validare simplă de email
            email_pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v.strip():
            # Permite numere cu +, spații, cratimi și paranteză
            phone_pattern = r'^[\+]?[\d\s\-\(\)]+$'
            if not re.match(phone_pattern, v):
                raise ValueError('Invalid phone number format')
        return v


class FondCreate(FondBase):
    """Schema pentru crearea unui fond nou."""
    pass


class FondUpdate(BaseModel):
    """Schema pentru actualizarea unui fond - toate câmpurile sunt opționale."""
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    holder_name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=1000)
    source_url: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = Field(None, description="Status activ/inactiv")

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None and v.strip():
            email_pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v.strip():
            phone_pattern = r'^[\+]?[\d\s\-\(\)]+$'
            if not re.match(phone_pattern, v):
                raise ValueError('Invalid phone number format')
        return v


class FondResponse(FondBase):
    """Schema pentru răspunsurile API - include toate câmpurile modelului."""
    id: int
    active: bool
    created_at: datetime
    updated_at: datetime
    
    # Owner information - NEW FIELDS for displaying assignment
    owner_id: Optional[int] = Field(None, description="ID-ul clientului care deține fondul")
    
    # Pydantic v2 - configurare pentru compatibilitate cu SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

class FondResponseWithOwner(FondResponse):
    """Extended schema that includes owner details for admin/audit views."""
    owner_username: Optional[str] = Field(None, description="Username-ul clientului")
    owner_company: Optional[str] = Field(None, description="Numele companiei clientului")
