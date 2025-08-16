# app/main.py
from fastapi import FastAPI
from app.core.config import settings

# Import toate router-ele
from app.api import auth
from app.api import search
from app.api.routes import users
from app.api.routes import fonds

# Creează aplicația FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    🏛️ **Arhivare Web App** - API pentru căutarea și gestionarea fondurilor arhivistice

    ## 🎯 Funcționalități

    ### 🔍 Căutare Publică (fără autentificare)
    - Căutare fonduri arhivistice după numele companiei
    - Obținere informații contact pentru deținătorii arhivelor

    ### 🔐 Administrare (necesită JWT)
    - Gestionare utilizatori (CRUD)
    - Gestionare fonduri arhivistice (CRUD)
    - Autentificare JWT

    ## 📝 Exemplu de utilizare
    1. **Căutare publică:** `GET /search?query=Tractorul`
    2. **Login admin:** `POST /auth/login`
    3. **Adaugă fond:** `POST /fonds` (cu token JWT)
    """,
    version="0.6.0",
    contact={
        "name": "Tony Gheorghe",
        "url": "https://github.com/your-username/arhivare-web-app",
    },
    license_info={
        "name": "MIT",
    },
)

# Înregistrează router-ele în ordinea corectă
# 🔍 Public routes (fără autentificare)
app.include_router(search.router)

# 🔐 Authentication routes  
app.include_router(auth.router)

# 👥 Admin routes (necesită JWT token)
app.include_router(users.router, prefix="/users", tags=["Users Management"])
app.include_router(fonds.router, prefix="/fonds", tags=["Fonds Management"])

# ❤️ Health check endpoint
@app.get("/health", tags=["Health Check"])
def health_check():
    """
    🏥 **Health Check** - Verifică statusul aplicației
    
    Returnează statusul aplicației pentru monitoring și load balancer.
    """
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": "0.6.0"
    }

# 📚 Root endpoint cu informații despre API
@app.get("/", tags=["Root"])
def root():
    """
    🏠 **Root Endpoint** - Informații generale despre API
    """
    return {
        "message": f"Bun venit la {settings.PROJECT_NAME}!",
        "version": "0.6.0",
        "docs_url": "/docs",
        "public_search": "/search?query=your_search_term",
        "admin_login": "/auth/login"
    }
