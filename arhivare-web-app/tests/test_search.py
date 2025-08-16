# tests/test_search.py - Fixed pentru modelele reale
import pytest
from httpx import AsyncClient
from app.models.fond import Fond

class TestSearchEndpoints:
    """Test suite pentru search functionality - compatibil cu modelul real Fond."""
    
    @pytest.mark.asyncio
    async def test_search_without_query_returns_422(self, client: AsyncClient):
        """Test că search fără query parameter returnează validation error."""
        response = await client.get("/search/")
        assert response.status_code == 422  # FastAPI validation error
        
        error_data = response.json()
        assert "detail" in error_data
    
    @pytest.mark.asyncio
    async def test_search_with_short_query_returns_422(self, client: AsyncClient):
        """Test că search cu query mai scurt de 2 caractere returnează error."""
        response = await client.get("/search/", params={"query": "a"})
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_search_returns_empty_list_when_no_data(self, client: AsyncClient, empty_db):
        """Test search returnează listă goală când nu există date."""
        response = await client.get("/search/", params={"query": "nonexistent"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    @pytest.mark.asyncio
    async def test_search_returns_results_when_data_exists(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test search returnează rezultate corecte când există date."""
        response = await client.get("/search/", params={"query": "brașov", "limit": 10})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Ar trebui să găsească 2 fonduri din Brașov
        
        # Verifică că am găsit company-urile așteptate
        company_names = [item.get("company_name", "") for item in data]
        assert any("Tractorul" in name for name in company_names)
        assert any("Steagul Roșu" in name for name in company_names)
    
    @pytest.mark.asyncio
    async def test_search_case_insensitive(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search este case insensitive."""
        # Search cu lowercase
        response_lower = await client.get("/search/", params={"query": "tractorul"})
        assert response_lower.status_code == 200
        
        # Search cu uppercase  
        response_upper = await client.get("/search/", params={"query": "TRACTORUL"})
        assert response_upper.status_code == 200
        
        data_lower = response_lower.json()
        data_upper = response_upper.json()
        
        # Ar trebui să returneze același număr de rezultate
        assert len(data_lower) == len(data_upper)
        
        if data_lower:  # Dacă avem rezultate
            assert data_lower[0]["company_name"] == data_upper[0]["company_name"]
    
    @pytest.mark.asyncio
    async def test_search_only_returns_active_fonds(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search returnează doar fondurile active."""
        # Search pentru toate company-urile 
        response = await client.get("/search/", params={"query": "company"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Verifică că nu sunt returnate company-uri inactive
        company_names = [item.get("company_name", "") for item in data]
        assert "Inactive Company SRL" not in company_names
        
        # Toate rezultatele ar trebui să fie active (dacă câmpul e returnat)
        for item in data:
            if "active" in item:
                assert item["active"] is True
    
    @pytest.mark.asyncio
    async def test_search_limit_parameter(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că parametrul limit funcționează corect."""
        response = await client.get("/search/", params={"query": "brașov", "limit": 1})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 1
    
    @pytest.mark.asyncio
    async def test_search_response_structure(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test structura obiectelor din răspunsul search."""
        response = await client.get("/search/", params={"query": "tractorul"})
        assert response.status_code == 200
        
        data = response.json()
        if data:  # Dacă avem rezultate
            first_result = data[0]
            
            # Verifică câmpurile necesare există
            required_fields = {"id", "company_name", "holder_name", "address"}
            assert all(field in first_result for field in required_fields)
            
            # Verifică tipurile câmpurilor
            assert isinstance(first_result["id"], int)
            assert isinstance(first_result["company_name"], str)
            assert isinstance(first_result["holder_name"], str)
            assert isinstance(first_result["address"], str)
    
    @pytest.mark.asyncio
    async def test_search_multiple_terms(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test search cu termeni multipli."""
        # Search pentru 'textile' - ar trebui să găsească Fabrica de Textile Cluj
        response = await client.get("/search/", params={"query": "textile"})
        assert response.status_code == 200
        
        data = response.json()
        if data:
            company_names = [item.get("company_name", "") for item in data]
            assert any("Textile" in name for name in company_names)

class TestSearchCountEndpoint:
    """Test suite pentru search count functionality."""
    
    @pytest.mark.asyncio
    async def test_search_count_without_query_returns_422(self, client: AsyncClient):
        """Test că search count fără query returnează validation error."""
        response = await client.get("/search/count/")
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_search_count_returns_correct_structure(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test search count returnează structura corectă de răspuns."""
        response = await client.get("/search/count/", params={"query": "brașov"})
        assert response.status_code == 200
        
        data = response.json()
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
    
    @pytest.mark.asyncio
    async def test_search_count_matches_search_results_length(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search count se potrivește cu numărul actual de rezultate search."""
        query = "brașov"
        
        # Obține rezultatele search
        search_response = await client.get("/search/", params={"query": query, "limit": 100})
        search_data = search_response.json()
        
        # Obține count-ul search
        count_response = await client.get("/search/count/", params={"query": query})
        count_data = count_response.json()
        
        assert len(search_data) == count_data["total_results"]
        print(response.status_code)
        print(response.text)
    
    @pytest.mark.asyncio
    async def test_search_count_zero_for_nonexistent_query(self, client: AsyncClient, empty_db):
        """Test că search count returnează 0 pentru query-uri fără rezultate."""
        response = await client.get("/search/count/", params={"query": "nonexistentcompany12345"})
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_results"] == 0
    
    @pytest.mark.asyncio
    async def test_search_count_only_counts_active_fonds(self, client: AsyncClient, sample_fonds: list[Fond]):
        """Test că search count numără doar fondurile active."""
        # Count pentru toate company-urile
        response = await client.get("/search/count/", params={"query": "company"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Ar trebui să numere doar fondurile active
        # Din sample_fonds avem 3 active și 1 inactiv
        # Deci search pentru "company" ar trebui să returneze < 4
        assert data["total_results"] < 4
