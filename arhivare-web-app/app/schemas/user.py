# app/schemas/user.py - User schema with UserResponse
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

# Base User schema
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    role: str = Field(..., description="User role: admin, audit, or client")
    company_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin', 'audit', 'client']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v

    @validator('contact_email')
    def validate_contact_email(cls, v):
        if v and v.strip():
            import re
            pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(pattern, v):
                raise ValueError('Invalid email format')
        return v

# Create User schema
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase, one lowercase, and one digit
        import re
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        return v

# Update User schema
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=64)
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    role: Optional[str] = None
    company_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = ['admin', 'audit', 'client']
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v

    @validator('contact_email')
    def validate_contact_email(cls, v):
        if v is not None and v.strip():
            import re
            pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(pattern, v):
                raise ValueError('Invalid email format')
        return v

    @validator('password')
    def validate_password(cls, v):
        if v is not None and len(v) > 0:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            
            import re
            if not re.search(r'[A-Z]', v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not re.search(r'[a-z]', v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not re.search(r'\d', v):
                raise ValueError('Password must contain at least one digit')
        
        return v

# Response User schema - ADDED THIS!
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Login schemas
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

