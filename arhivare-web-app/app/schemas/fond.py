# app/schemas/fond.py
class FondBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    holder_name: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None
    email: Optional[str] = Field(None, regex="^[^@]+@[^@]+\.[^@]+$")
    phone: Optional[str] = None
    notes: Optional[str] = None
    source_url: Optional[str] = None

class FondCreate(FondBase):
    pass

class FondUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    holder_name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    email: Optional[str] = Field(None, regex="^[^@]+@[^@]+\.[^@]+$")
    phone: Optional[str] = None
    notes: Optional[str] = None
    source_url: Optional[str] = None
    active: Optional[bool] = None

class FondResponse(FondBase):
    id: int
    active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
