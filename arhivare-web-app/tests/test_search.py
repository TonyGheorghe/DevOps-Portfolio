# tests/test_search.py - FIXED VERSION
import pytest
from httpx import AsyncClient
from app.models.fond import Fond

class TestSearchEndpoints:
    """Test suite pentru search functionality - fixed version."""
    
    @pytest.mark.asyncio
    async def test_search_routes_exist(self, client: AsyncClient):
        """Debug test to check what routes actually exist."""
        from app.main import app
        
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                methods = getattr(route, 'methods', {'GET'})
                routes.append(f"{list(methods)} {route.path}")
        
        print(f"\nAvailable routes:")
        for route in sorted(routes):
            print(f"  {route}")
        
        # This test always passes, it's just for debugging
        assert True
    
    @pytest.mark.asyncio
    async def test_search_without_query_returns_422(self, client: AsyncClient):
        """Test că search fără query parameter returnează validation error."""
        response = await client.get("/search")
        
        # Debug the actual response
        print(f"\nDebug - No query response status: {response.status_code}")
        print(f"Debug - No query response text: {response.text}")
        
        # If we get 404, the route doesn't exist at all
        if response.status_code == 404:
            pytest.fail(f"Route /search not found! Available routes should be checked. Got: {response.text}")
        
        assert response.status_code == 422  # FastAPI validation error
        
        error_data = response.json()
        assert "detail" in error_data
    
    @pytest.mark.asyncio
    async def test_search_with_short_query_returns_422(self, client: AsyncClient):
        """Test că search cu query mai scurt de 2 caractere returnează error."""
        response = await client.get("/search", params={"query": "a"})
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_search_returns_empty_list_when_no_data(self, client: AsyncClient, empty_db):
        """Test search returnează listă goală când nu există date."""
        response = await client.get("/search", params={"query": "nonexistent"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    @pytest.mark.asyncio
    async def test_search_returns_results_when_data_exists(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test search returnează rezultate corecte când există date."""
        # Debug: Print what fonds we have
        print(f"\nDebug: Available fonds: {len(sample_fonds)}")
        for fond in sample_fonds:
            print(f"  - {fond.company_name} (active: {getattr(fond, 'active', True)})")
        
        response = await client.get("/search", params={"query": "brașov", "limit": 10})
        
        print(f"Search response status: {response.status_code}")
        print(f"Search response text: {response.text}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should find at least one fond from Brașov
        brasov_results = [item for item in data 
                         if "brașov" in item.get("company_name", "").lower() or 
                            "brașov" in item.get("holder_name", "").lower()]
        assert len(brasov_results) >= 1
    
    @pytest.mark.asyncio
    async def test_search_case_insensitive(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search este case insensitive."""
        # Search cu lowercase
        response_lower = await client.get("/search", params={"query": "tractorul"})
        assert response_lower.status_code == 200
        
        # Search cu uppercase  
        response_upper = await client.get("/search", params={"query": "TRACTORUL"})
        assert response_upper.status_code == 200
        
        data_lower = response_lower.json()
        data_upper = response_upper.json()
        
        # Ar trebui să returneze același număr de rezultate
        assert len(data_lower) == len(data_upper)
    
    @pytest.mark.asyncio
    async def test_search_only_returns_active_fonds(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search returnează doar fondurile active."""
        # Search pentru toate company-urile 
        response = await client.get("/search", params={"query": "company"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Verifică că nu sunt returnate company-uri inactive
        company_names = [item.get("company_name", "") for item in data]
        assert "Inactive Company SRL" not in company_names
    
    @pytest.mark.asyncio
    async def test_search_response_structure(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test structura obiectelor din răspunsul search."""
        response = await client.get("/search", params={"query": "tractorul"})
        assert response.status_code == 200
        
        data = response.json()
        if data:  # Dacă avem rezultate
            first_result = data[0]
            
            # Verifică câmpurile necesare există
            required_fields = {"id", "company_name", "holder_name"}
            assert all(field in first_result for field in required_fields)
            
            # Verifică tipurile câmpurilor
            assert isinstance(first_result["id"], int)
            assert isinstance(first_result["company_name"], str)
            assert isinstance(first_result["holder_name"], str)

class TestSearchCountEndpoint:
    """Test suite pentru search count functionality."""
    
    @pytest.mark.asyncio
    async def test_search_count_without_query_returns_422(self, client: AsyncClient):
        """Test că search count fără query returnează validation error."""
        response = await client.get("/search/count")
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_search_count_returns_correct_structure(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test search count returnează structura corectă de răspuns."""
        response = await client.get("/search/count", params={"query": "brașov"})
        assert response.status_code == 200
        
        data = response.json()
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
        assert data["total_results"] >= 0
    
    @pytest.mark.asyncio
    async def test_search_count_matches_search_results_length(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search count se potrivește cu numărul actual de rezultate search."""
        query = "brașov"
        
        # IMPORTANT: Folosește limit=50 (maximum permis de endpoint)
        # Obține rezultatele search
        search_response = await client.get("/search", params={"query": query, "limit": 50})
        
        # Debug info
        print(f"\nSearch response status: {search_response.status_code}")
        print(f"Search response text: {search_response.text[:200]}")
        
        if search_response.status_code != 200:
            pytest.fail(f"Search failed with {search_response.status_code}: {search_response.text}")
        
        search_data = search_response.json()
        
        # Obține count-ul search
        count_response = await client.get("/search/count", params={"query": query})
        
        print(f"Count response status: {count_response.status_code}")
        print(f"Count response text: {count_response.text[:200]}")
        
        if count_response.status_code != 200:
            pytest.fail(f"Count failed with {count_response.status_code}: {count_response.text}")
            
        count_data = count_response.json()
        
        # Print for debugging
        print(f"Search results count: {len(search_data)}")
        print(f"Count endpoint result: {count_data['total_results']}")
        
        # Dacă avem mai multe rezultate decât limit-ul, verifică că search_data are exact limit rezultate
        if count_data['total_results'] > 50:
            assert len(search_data) == 50  # Should be limited to 50
        else:
            assert len(search_data) == count_data["total_results"]
    
    @pytest.mark.asyncio
    async def test_search_count_zero_for_nonexistent_query(self, client: AsyncClient, empty_db):
        """Test că search count returnează 0 pentru query-uri fără rezultate."""
        response = await client.get("/search/count", params={"query": "nonexistentcompany12345"})
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_results"] == 0
    
    @pytest.mark.asyncio
    async def test_search_count_only_counts_active_fonds(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search count numără doar fondurile active."""
        # Count pentru toate company-urile
        response = await client.get("/search/count", params={"query": "company"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Ar trebui să numere doar fondurile active
        # Din sample_fonds avem 3 active și 1 inactiv
        assert data["total_results"] <= 3  # Maximum 3 active companies
