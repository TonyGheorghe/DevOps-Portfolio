# app/schemas/user.py
from typing import Optional
from datetime import datetime

# Pydantic v2:
from pydantic import BaseModel, Field, ConfigDict

# Dacă ești pe Pydantic v1, înlocuiește linia cu model_config
# cu:
# class Config:
#     orm_mode = True

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=64, description="Nume de utilizator unic")
    role: str = Field(default="admin", max_length=16, description="Rolul utilizatorului (ex: admin)")

class UserCreate(UserBase):
    # Parola vine în clar aici; o hash-uim înainte de a o salva.
    password: str = Field(min_length=8, description="Parola în clar; va fi stocată doar hash-uită")

class UserUpdate(BaseModel):
    # Toate câmpurile sunt opționale la update.
    username: Optional[str] = Field(default=None, min_length=3, max_length=64)
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[str] = Field(default=None, max_length=16)

class UserRead(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    # Pydantic v2:
    model_config = ConfigDict(from_attributes=True)

