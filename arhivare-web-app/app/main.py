# app/main.py - Updated with New Role-Based Endpoints
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings

from app.api import search
from app.api.auth import router as auth_router
from app.api.routes import users, fonds
from app.api.routes import client_fonds, admin_fonds  # NEW IMPORTS

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.7.0",  # Updated version
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="""
    Arhivare Web App - Advanced Version with Role-Based Access Control
    
    ## Features
    - **Public Search**: Search archival fonds without authentication
    - **Role-Based Access**: Admin, Audit, and Client roles with different permissions
    - **Ownership Management**: Assign fonds to specific clients
    - **Client Dashboard**: Clients can manage their assigned fonds
    - **Audit Trail**: Complete audit and reporting capabilities
    
    ## Roles
    - **Admin**: Full access to all data and user management
    - **Audit**: Read-only access to all data with reporting capabilities  
    - **Client**: Access only to assigned fonds
    """,
)

# === PUBLIC ROUTES (No authentication required) ===
app.include_router(search.router, tags=["Public Search"])

# === AUTHENTICATION ROUTES ===
app.include_router(auth_router, tags=["Authentication"])

# === USER MANAGEMENT ROUTES (Admin only) ===
app.include_router(users.router, prefix="/users", tags=["User Management"])

# === FOND MANAGEMENT ROUTES ===
# Admin/Audit general fond management
app.include_router(fonds.router, prefix="/fonds", tags=["Fonds Management"])

# Client-specific fond management  
app.include_router(client_fonds.router, prefix="/fonds", tags=["Client Fonds"])

# Admin-specific fond management (ownership, assignments, etc.)
app.include_router(admin_fonds.router, prefix="/admin/fonds", tags=["Admin Fonds Management"])

# === STATIC FILES ===
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Dezactivează auto-redirect pentru slash mismatch
app.router.redirect_slashes = False

# === HEALTH CHECK ===
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok", 
        "app": settings.PROJECT_NAME, 
        "version": "0.7.0",
        "features": [
            "role_based_access_control",
            "ownership_management", 
            "client_dashboards",
            "audit_capabilities"
        ]
    }

# === ROLE INFORMATION ENDPOINT ===
@app.get("/roles", tags=["System Info"])
def get_role_information():
    """
    Returnează informații despre rolurile disponibile în sistem.
    """
    from app.schemas.user import UserRoleInfo
    
    return {
        "roles": [
            UserRoleInfo.get_role_info("admin").model_dump(),
            UserRoleInfo.get_role_info("audit").model_dump(),
            UserRoleInfo.get_role_info("client").model_dump()
        ],
        "default_role": "client",
        "assignment_policy": "Fonds can be assigned to clients by administrators"
    }

# === CORS MIDDLEWARE for React frontend ===
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Additional port for audit dashboard
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DEVELOPMENT HELPERS ===
@app.get("/debug/routes", tags=["Debug"], include_in_schema=False)
def list_routes():
    """
    Development endpoint to list all available routes.
    Only available in debug mode.
    """
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = getattr(route, 'methods', {'GET'})
            routes.append({
                "path": route.path,
                "methods": list(methods),
                "name": getattr(route, 'name', None),
                "tags": getattr(route, 'tags', [])
            })
    
    return {
        "total_routes": len(routes),
        "routes": sorted(routes, key=lambda x: x["path"])
    }

# === STARTUP EVENT ===
@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks.
    """
    print("🚀 Arhivare Web App starting up...")
    print("📊 Features enabled:")
    print("   • Role-based access control (admin/audit/client)")
    print("   • Ownership management for fonds")
    print("   • Client-specific dashboards")
    print("   • Audit and reporting capabilities")
    print("   • Public search functionality")
    print("✅ Startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown tasks.
    """
    print("👋 Arhivare Web App shutting down...")
    print("✅ Shutdown complete!")

# === ERROR HANDLERS ===
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom HTTP exception handler with more detailed error responses.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """
    Custom 500 error handler.
    """
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error occurred",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )
