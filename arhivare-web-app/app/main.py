# app/main.py - FASTAPI APP REPARAT
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.database import SessionLocal  # Import unificat

# Import routes cu paths corecti
from app.api import search
from app.api.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.fonds import router as fonds_router
from app.api.routes.client_fonds import router as client_fonds_router
from app.api.routes.admin_fonds import router as admin_fonds_router

# Create FastAPI instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="Arhivare Web App - Management fonduri arhivistice"
)

# === HEALTH CHECK ===
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT 1")).fetchone()
            if result is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database query returned no results"
                )
        finally:
            db.close()
        
        return {
            "status": "healthy",
            "app": settings.PROJECT_NAME,
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Health check failed: {str(e)}"
        )

# === CORS MIDDLEWARE ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ROUTE REGISTRATION ===
# Public routes (no authentication)
app.include_router(search.router, tags=["Public Search"])

# Authentication routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Protected routes
app.include_router(users_router, prefix="/users", tags=["User Management"])
app.include_router(fonds_router, prefix="/fonds", tags=["Fonds Management"])
app.include_router(client_fonds_router, prefix="/fonds", tags=["Client Fonds"])
app.include_router(admin_fonds_router, prefix="/admin", tags=["Admin Management"])

# === STARTUP EVENT ===
@app.on_event("startup")
async def startup_event():
    print("🚀 Arhivare Web App starting...")
    
    # Test database connection
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        finally:
            db.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    print("✅ Startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Arhivare Web App shutting down...")
    print("✅ Shutdown complete!")
