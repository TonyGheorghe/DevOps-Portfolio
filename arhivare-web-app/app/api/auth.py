# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.session import get_db
from app.core.security import create_access_token, verify_password, verify_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# IMPORTANT: auto_error=False ca să putem întoarce 401 (altfel ar fi 403)
security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.scheme or credentials.scheme.lower() != "bearer":
        # fără header, sau scheme greșit -> 401 (nu 403)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ---- AUTH ROUTES (ambele variante: cu și fără slash) ----
@router.post("/login")
@router.post("/login/")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(subject=user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "role": user.role},
    }

@router.get("/me")
@router.get("/me/")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    """Dummy endpoint protejat pentru teste"""
    return {"message": f"Hello, {current_user.username}"}
