from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import create_access_token, verify_password, verify_token
from app.models.user import User
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

class LoginRequest(BaseModel):
    username: str
    password: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Returnează user-ul curent bazat pe token JWT."""
    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Returnează informații despre user-ul curent."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

@router.post("/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Caută user-ul în baza de date
    user = db.query(User).filter(User.username == login_data.username).first()

    # Verifică dacă user-ul există și parola e corectă
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Generează token JWT
    token = create_access_token(subject=user.username)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "role": user.role}
    }
