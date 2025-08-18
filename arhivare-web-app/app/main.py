# app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings

from app.api import search
from app.api.auth import router as auth_router
from app.api.routes import users, fonds

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.6.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Înregistrează rutele fără prefixuri duble / fără trailing-slash-uri suplimentare
app.include_router(search.router)              # rutele publice (ex: /search)
app.include_router(auth_router)                # /auth/login, /auth/me (și variantele cu /)
app.include_router(users.router, prefix="/users", tags=["Users Management"])
app.include_router(fonds.router, prefix="/fonds", tags=["Fonds Management"])
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Dezactivează auto-redirect pentru slash mismatch
app.router.redirect_slashes = False

# Health
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "0.6.0"}


# Add CORS middleware for React frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
