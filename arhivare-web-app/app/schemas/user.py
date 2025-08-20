# app/schemas/user.py - Updated with Extended Roles and Enhanced Features
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Valid user roles - UPDATED WITH NEW ROLES
VALID_ROLES = ["admin", "audit", "client"]

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=64, description="Nume de utilizator unic")
    role: str = Field(default="client", max_length=16, description="Rolul utilizatorului")
    company_name: Optional[str] = Field(None, max_length=255, description="Numele companiei (pentru clienți)")
    contact_email: Optional[str] = Field(None, max_length=100, description="Email de contact suplimentar")
    notes: Optional[str] = Field(None, max_length=1000, description="Note administrative")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f'Rolul trebuie să fie unul dintre: {", ".join(VALID_ROLES)}')
        return v

    @field_validator('contact_email')
    @classmethod
    def validate_contact_email(cls, v):
        if v is not None and v.strip():
            # Basic email validation
            import re
            email_pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v

class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Parola în clar; va fi stocată doar hash-uită")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=64)
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[str] = Field(default=None, max_length=16)
    company_name: Optional[str] = Field(default=None, max_length=255)
    contact_email: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v is not None and v not in VALID_ROLES:
            raise ValueError(f'Rolul trebuie să fie unul dintre: {", ".join(VALID_ROLES)}')
        return v

    @field_validator('contact_email')
    @classmethod
    def validate_contact_email(cls, v):
        if v is not None and v.strip():
            import re
            email_pattern = r'^[^@]+@[^@]+\.[^@]+$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v

class UserRead(BaseModel):
    id: int
    username: str
    role: str
    company_name: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Role-specific display helpers
class UserRoleInfo(BaseModel):
    """Helper schema for role information"""
    role: str
    display_name: str
    description: str
    permissions: list[str]

    @classmethod
    def get_role_info(cls, role: str) -> 'UserRoleInfo':
        role_mapping = {
            "admin": {
                "display_name": "Administrator",
                "description": "Acces complet la toate funcționalitățile",
                "permissions": [
                    "Vizualizare toate fondurile",
                    "Editare toate fondurile", 
                    "Ștergere fonduri",
                    "Management utilizatori",
                    "Assignment fonduri către clienți",
                    "Administrare sistem"
                ]
            },
            "audit": {
                "display_name": "Audit", 
                "description": "Vizualizare completă, fără modificări",
                "permissions": [
                    "Vizualizare toate fondurile",
                    "Export date și statistici",
                    "Rapoarte și analize",
                    "Monitorizare activitate"
                ]
            },
            "client": {
                "display_name": "Client",
                "description": "Acces la fondurile proprii",
                "permissions": [
                    "Vizualizare fondurile proprii",
                    "Editare fondurile proprii", 
                    "Căutare fonduri publice",
                    "Verificare completitudine date"
                ]
            }
        }
        
        info = role_mapping.get(role, role_mapping["client"])
        return cls(
            role=role,
            display_name=info["display_name"],
            description=info["description"], 
            permissions=info["permissions"]
        )

# Assignment-related schemas
class FondAssignment(BaseModel):
    """Schema for assigning fonds to clients."""
    fond_id: int
    client_id: int
    notes: Optional[str] = None

class FondAssignmentResponse(BaseModel):
    """Response for fond assignment operations."""
    message: str
    fond_id: int
    client_id: int
    client_username: str
    fond_company_name: str

class ClientStats(BaseModel):
    """Statistics for a client user."""
    total_fonds: int
    active_fonds: int
    inactive_fonds: int
    last_updated: Optional[datetime] = None
