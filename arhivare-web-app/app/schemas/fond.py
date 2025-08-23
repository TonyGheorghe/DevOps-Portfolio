# app/schemas/fond.py - FIXED VERSION with proper syntax
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

# Base Fond schema
class FondBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, description="Company name")
    holder_name: str = Field(..., min_length=2, max_length=255, description="Archive holder name") 
    address: Optional[str] = Field(None, max_length=500, description="Address")
    email: Optional[str] = Field(None, max_length=100, description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")
    source_url: Optional[str] = Field(None, max_length=500, description="Source URL")
    active: bool = Field(True, description="Whether the fond is active")
    owner_id: Optional[int] = Field(None, description="ID of the user who owns this fond")

    @validator('email')
    def validate_email(cls, v):
        if v and v.strip():
            # Basic email validation
            import re
            pattern = r'^[^@]+@[^@]+\.[^@]+$'  # FIXED: Added missing closing quote
            if not re.match(pattern, v):
                raise ValueError('Invalid email format')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v and v.strip():
            # Allow digits, spaces, dashes, parentheses, plus sign
            import re
            if not re.match(r'^[\+]?[\d\s\-\(\)]+$', v):
                raise ValueError('Phone number contains invalid characters')
        return v

    @validator('source_url')
    def validate_source_url(cls, v):
        if v and v.strip():
            # Basic URL validation
            import re
            url_pattern = r'^https?://.+'
            if not re.match(url_pattern, v):
                raise ValueError('URL must start with http:// or https://')
        return v

# Create schema
class FondCreate(FondBase):
    pass

# Update schema - all fields optional except those that should remain required
class FondUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    holder_name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=1000)
    source_url: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None
    owner_id: Optional[int] = Field(None, description="ID of the user who owns this fond")

    @validator('email')
    def validate_email(cls, v):
        if v is not None and v.strip():
            import re
            pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(pattern, v):
                raise ValueError('Invalid email format')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and v.strip():
            import re
            if not re.match(r'^[\+]?[\d\s\-\(\)]+$', v):
                raise ValueError('Phone number contains invalid characters')
        return v

    @validator('source_url')
    def validate_source_url(cls, v):
        if v is not None and v.strip():
            import re
            url_pattern = r'^https?://.+'
            if not re.match(url_pattern, v):
                raise ValueError('URL must start with http:// or https://')
        return v

# Owner information schema
class FondOwner(BaseModel):
    id: int
    username: str
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

# Response schema
class FondResponse(FondBase):
    id: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[FondOwner] = None

    class Config:
        from_attributes = True

# Search response schema (simple version for public search)
class FondSearchResponse(BaseModel):
    id: int
    company_name: str
    holder_name: str
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True
