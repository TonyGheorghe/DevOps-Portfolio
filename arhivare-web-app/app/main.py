# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.api import auth, search
from app.api.routes import fonds  # doar ce e necesar pentru teste

# Creează aplicația FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="🏛️ Arhivare Web App - API pentru căutarea și gestionarea fondurilor arhivistice",
    version="0.7.0",
    contact={"name": "Tony Gheorghe", "url": "https://github.com/tonygheorghe/arhivare-web-app"},
    license_info={"name": "MIT"},
)

app.router.redirect_slashes = False 

# Middleware CORS (important pt. testare și frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔍 Public routes
app.include_router(search.router, prefix="/search", tags=["Search"])

# 🔐 Authentication
app.include_router(auth.router, tags=["Auth"])

# 👥 Fonds Management
app.include_router(fonds.router, prefix="/fonds", tags=["Fonds Management"])

# ❤️ Health check
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "0.7.0"}

# 🏠 Root JSON (nu mai suprascriem!)
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Bun venit la {settings.PROJECT_NAME}!",
        "version": "0.7.0",
        "docs_url": "/docs",
        "public_search": "/search?query=exemplu",
        "admin_login": "/auth/login",
    }

# 📂 Static files (dacă există index.html)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.isdir(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/index", include_in_schema=False)
async def index_page():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Index.html not found"}

