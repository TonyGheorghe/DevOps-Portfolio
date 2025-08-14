from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import create_access_token
from pydantic import BaseModel
from fastapi.security import HTTPBearer
from app.core.security import verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.get("/me")
async def get_current_user(token: str = Depends(security)):
    username = verify_token(token.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": username, "message": "Token is valid!"}

@router.post("/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Simplu pentru început - doar verifică admin/admin123
    if login_data.username == "admin" and login_data.password == "admin123":
        token = create_access_token(subject=login_data.username)
        return {"access_token": token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
