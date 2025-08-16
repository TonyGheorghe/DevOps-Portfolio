# tests/test_fonds_api.py
import pytest
from httpx import AsyncClient
from app.models.fond import Fond

class TestFondsListEndpoint:
    """Test suite for fonds listing endpoint."""
    
    async def test_list_fonds_requires_auth(self, client: AsyncClient):
        """Test that listing fonds requires authentication."""
        response = await client.get("/fonds")
        assert response.status_code == 401
    
    async def test_list_fonds_returns_list(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test that authenticated request returns list of fonds."""
        response = await client.get("/fonds", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should include both active and inactive fonds for admin
        assert len(data) == len(sample_fonds)
    
    async def test_list_fonds_pagination(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test pagination parameters work correctly."""
        # Test limit
        response = await client.get("/fonds", headers=auth_headers, params={"limit": 2})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 2
        
        # Test skip
        response = await client.get("/fonds", headers=auth_headers, params={"skip": 1, "limit": 10})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= len(sample_fonds) - 1
    
    async def test_list_fonds_active_only_filter(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test active_only filter parameter."""
        # Get all fonds
        all_response = await client.get("/fonds", headers=auth_headers, params={"active_only": False})
        all_data = all_response.json()
        
        # Get active only
        active_response = await client.get("/fonds", headers=auth_headers, params={"active_only": True})
        active_data = active_response.json()
        
        assert response.status_code == 200
        assert len(active_data) < len(all_data)  # Should have fewer active fonds
        
        # Check all returned fonds are active
        for fond in active_data:
            assert fond["active"] is True

class TestFondsCreateEndpoint:
    """Test suite for fond creation endpoint."""
    
    async def test_create_fond_requires_auth(self, client: AsyncClient):
        """Test that creating fond requires authentication."""
        fond_data = {
            "company_name": "Test Company",
            "holder_name": "Test Holder",
            "address": "Test Address"
        }
        
        response = await client.post("/fonds", json=fond_data)
        assert response.status_code == 401
    
    async def test_create_fond_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful fond creation."""
        fond_data = {
            "company_name": "New Test Company",
            "holder_name": "New Test Holder", 
            "address": "New Test Address",
            "email": "test@newcompany.ro",
            "phone": "+40 21 123 4567",
            "notes": "Test notes"
        }
        
        response = await client.post("/fonds", headers=auth_headers, json=fond_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["company_name"] == fond_data["company_name"]
        assert data["holder_name"] == fond_data["holder_name"] 
        assert data["email"] == fond_data["email"]
        assert data["active"] is True  # Should be active by default
        assert "id" in data
        assert isinstance(data["id"], int)
    
    async def test_create_fond_missing_required_fields(self, client: AsyncClient, auth_headers: dict):
        """Test fond creation with missing required fields."""
        incomplete_data = {
            "company_name": "Test Company"
            # Missing holder_name and address
        }
        
        response = await client.post("/fonds", headers=auth_headers, json=incomplete_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "detail" in error_data
    
    async def test_create_fond_with_minimal_data(self, client: AsyncClient, auth_headers: dict):
        """Test fond creation with only required fields."""
        minimal_data = {
            "company_name": "Minimal Company",
            "holder_name": "Minimal Holder",
            "address": "Minimal Address"
        }
        
        response = await client.post("/fonds", headers=auth_headers, json=minimal_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["company_name"] == minimal_data["company_name"]
        assert data["email"] is None
        assert data["phone"] is None

class TestFondsUpdateEndpoint:
    """Test suite for fond update endpoint."""
    
    async def test_update_fond_requires_auth(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test that updating fond requires authentication."""
        fond_id = sample_fonds[0].id
        update_data = {"notes": "Updated notes"}
        
        response = await client.put(f"/fonds/{fond_id}", json=update_data)
        assert response.status_code == 401
    
    async def test_update_fond_success(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test successful fond update."""
        fond_id = sample_fonds[0].id
        update_data = {
            "phone": "+40 21 999 8888",
            "notes": "Updated test notes",
            "email": "updated@email.com"
        }
        
        response = await client.put(f"/fonds/{fond_id}", headers=auth_headers, json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["phone"] == update_data["phone"]
        assert data["notes"] == update_data["notes"]
        assert data["email"] == update_data["email"]
        assert data["id"] == fond_id
    
    async def test_update_nonexistent_fond_returns_404(self, client: AsyncClient, auth_headers: dict):
        """Test updating nonexistent fond returns 404."""
        response = await client.put("/fonds/99999", headers=auth_headers, json={"notes": "test"})
        assert response.status_code == 404
    
    async def test_update_fond_partial_update(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test partial update of fond (only some fields)."""
        fond_id = sample_fonds[0].id
        original_company_name = sample_fonds[0].company_name
        
        # Update only notes
        update_data = {"notes": "Only notes updated"}
        
        response = await client.put(f"/fonds/{fond_id}", headers=auth_headers, json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["notes"] == update_data["notes"]
        assert data["company_name"] == original_company_name  # Should remain unchanged

class TestFondsDeleteEndpoint:
    """Test suite for fond deletion endpoint."""
    
    async def test_delete_fond_requires_auth(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test that deleting fond requires authentication."""
        fond_id = sample_fonds[0].id
        
        response = await client.delete(f"/fonds/{fond_id}")
        assert response.status_code == 401
    
    async def test_delete_fond_success(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test successful fond deletion (soft delete)."""
        fond_id = sample_fonds[0].id
        
        response = await client.delete(f"/fonds/{fond_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Fond deleted successfully"
        
        # Verify fond is soft deleted (still exists but inactive)
        get_response = await client.get("/fonds", headers=auth_headers, params={"active_only": False})
        all_fonds = get_response.json()
        
        deleted_fond = next((f for f in all_fonds if f["id"] == fond_id), None)
        assert deleted_fond is not None
        assert deleted_fond["active"] is False
    
    async def test_delete_nonexistent_fond_returns_404(self, client: AsyncClient, auth_headers: dict):
        """Test deleting nonexistent fond returns 404."""
        response = await client.delete("/fonds/99999", headers=auth_headers)
        assert response.status_code == 404

class TestFondsGetByIdEndpoint:
    """Test suite for getting fond by ID endpoint."""
    
    async def test_get_fond_by_id_requires_auth(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test that getting fond by ID requires authentication."""
        fond_id = sample_fonds[0].id
        
        response = await client.get(f"/fonds/{fond_id}")
        assert response.status_code == 401
    
    async def test_get_fond_by_id_success(self, client: AsyncClient, auth_headers: dict, sample_fonds: list[Fond]):
        """Test successful retrieval of fond by ID."""
        fond = sample_fonds[0]
        
        response = await client.get(f"/fonds/{fond.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == fond.id
        assert data["company_name"] == fond.company_name
        assert data["holder_name"] == fond.holder_name
    
    async def test_get_nonexistent_fond_returns_404(self, client: AsyncClient, auth_headers: dict):
        """Test getting nonexistent fond returns 404."""
        response = await client.get("/fonds/99999", headers=auth_headers)
        assert response.status_code == 404
