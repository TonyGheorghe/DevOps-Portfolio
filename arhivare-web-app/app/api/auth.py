# app/api/auth.py - AUTENTIFICARE REPARATĂ
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import get_db  # Import unificat
from app.core.security import create_access_token, verify_password, verify_token
from app.models.user import User

router = APIRouter(tags=["Authentication"])
security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserInfo(BaseModel):
    id: int
    username: str
    role: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user"""
    if credentials is None or not credentials.scheme or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )

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

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_current_client_user(current_user: User = Depends(get_current_user)) -> User:
    """Require client role"""
    if current_user.role != 'client':
        raise HTTPException(status_code=403, detail="Client access required")
    return current_user

# === AUTH ROUTES ===
@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint"""
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid username or password"
        )

    token = create_access_token(subject=user.username)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id, 
            "username": user.username, 
            "role": user.role
        }
    )

@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role
    )

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    """Protected endpoint for testing"""
    return {"message": f"Hello, {current_user.username}!", "role": current_user.role}
