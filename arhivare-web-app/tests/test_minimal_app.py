# test_minimal_app.py - pentru debug rapid
from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from typing import List

# Import direct pentru test
from app.db.session import get_db
from app.core.config import settings

app = FastAPI(title="Test App")

# Test health check
@app.get("/health")
def health():
    assert {"status": "ok", "message": "Test app works"}

# Test direct search endpoint (fără import din search.py)
@app.get("/search")
def test_search(
    query: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Test direct search endpoint"""
    try:
        # Import aici pentru a vedea dacă merge
        from app.crud.fond import search_fonds
        from app.models.fond import Fond
        
        # Test simplu - returnează toate fondurile active
        results = db.query(Fond).filter(Fond.active == True).limit(limit).all()
        
        assert {
            "query": query,
            "found": len(results),
            "results": [{"id": r.id, "company_name": r.company_name, "holder_name": r.holder_name} for r in results]
        }
    except Exception as e:
        assert {"error": str(e), "type": type(e).__name__}

# Test auth endpoint direct
@app.get("/test-auth")
def test_auth():
    try:
        from app.api.auth import router as auth_router
        assert {"auth_router": "imported successfully", "routes": len(auth_router.routes)}
    except Exception as e:
        assert {"auth_error": str(e)}

# Test fond crud direct  
@app.get("/test-crud")
def test_crud():
    try:
        from app.crud.fond import get_fonds
        from app.schemas.fond import FondCreate
        assert {"crud": "imported successfully"}
    except Exception as e:
        assert {"crud_error": str(e), "type": type(e).__name__}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
