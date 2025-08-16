# tests/test_auth.py - Fixed pentru modelele reale
import pytest
from httpx import AsyncClient
from app.models.user import User
from app.core.security import get_password_hash

class TestAuthEndpoints:
    """Test suite pentru authentication endpoints - compatible cu modelul real User."""
    
    @pytest.mark.asyncio
    async def test_login_missing_credentials_returns_422(self, client: AsyncClient):
        """Test login fără credentials returnează validation error."""
        response = await client.post("/auth/login", json={})
        assert response.status_code == 422
        
        error_data = response.json()
        assert "detail" in error_data
    
    @pytest.mark.asyncio  
    async def test_login_invalid_credentials_returns_401(self, client: AsyncClient, admin_user: User):
        """Test login cu credentials invalide returnează unauthorized."""
        response = await client.post("/auth/login", json={
            "username": admin_user.username,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
        error_data = response.json()
        assert "detail" in error_data
    
    @pytest.mark.asyncio
    async def test_login_success_returns_token(self, client: AsyncClient, admin_user: User):
        """Test login cu succes returnează access token și user info."""
        response = await client.post("/auth/login", json={
            "username": admin_user.username,
            "password": "testpassword"
        })
        assert response.status_code == 200
        
        data = response.json()
        
        # Check response structure
        required_keys = {"access_token", "token_type", "user"}
        assert all(key in data for key in required_keys)
        
        # Check token type
        assert data["token_type"] == "bearer"
        
        # Check user info - compatibil cu modelul real
        user_data = data["user"]
        assert user_data["username"] == admin_user.username
        assert user_data["role"] == admin_user.role
        
        # Nu verificăm is_active pentru că modelul User nu are acest câmp
        
        # Check token nu e gol
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user_returns_401(self, client: AsyncClient):
        """Test login cu user inexistent returnează unauthorized."""
        response = await client.post("/auth/login", json={
            "username": "nonexistent",
            "password": "password"
        })
        assert response.status_code == 401

class TestProtectedEndpoints:
    """Test suite pentru protected endpoints care necesită authentication."""
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token_returns_401(self, client: AsyncClient):
        """Test accesul la endpoint protejat fără token returnează unauthorized."""
        response = await client.get("/fonds")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_invalid_token_returns_401(self, client: AsyncClient):
        """Test accesul la endpoint protejat cu token invalid returnează unauthorized."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/fonds", headers=headers)
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_malformed_header_returns_401(self, client: AsyncClient):
        """Test accesul la endpoint protejat cu header malformat returnează unauthorized."""
        # Lipsește "Bearer" prefix
        headers = {"Authorization": "some_token"}
        response = await client.get("/fonds", headers=headers)
        assert response.status_code == 401
        
        # Authorization header gol
        headers = {"Authorization": ""}
        response = await client.get("/fonds", headers=headers)
        assert response.status_code == 401
        
        # Doar "Bearer" fără token
        headers = {"Authorization": "Bearer"}
        response = await client.get("/fonds", headers=headers)
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_valid_token_returns_200(self, client: AsyncClient, auth_headers: dict):
        """Test accesul la endpoint protejat cu token valid reușește."""
        response = await client.get("/fonds", headers=auth_headers)
        assert response.status_code == 200
        
        # Ar trebui să returneze o listă (chiar dacă goală)
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_token_contains_user_info(self, client: AsyncClient, admin_user: User):
        """Test că JWT token conține informațiile corecte ale user-ului."""
        # Login pentru a obține token
        login_response = await client.post("/auth/login", json={
            "username": admin_user.username,
            "password": "testpassword"
        })
        
        token_data = login_response.json()
        token = token_data["access_token"]
        
        # Decode token manual pentru a verifica conținutul
        import jwt
        from app.core.config import settings
        
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            assert payload["sub"] == admin_user.username
            assert "exp" in payload  # Expiration time ar trebui să fie prezent
        except jwt.InvalidTokenError:
            pytest.fail("Token should be valid")

class TestUserManagement:
    """Test suite pentru management user - compatibil cu modelul real."""
    
    @pytest.mark.asyncio
    async def test_create_user_structure(self, db_session):
        """Test că putem crea user cu structura corectă."""
        # Test direct în database să înțelegem modelul
        user = User(
            username="newuser",
            password_hash=get_password_hash("password123"),
            role="user"
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Verifică că user-ul a fost creat corect
        assert user.id is not None
        assert user.username == "newuser"
        assert user.role == "user"
        assert user.password_hash != "password123"  # Ar trebui să fie hashed
        assert user.created_at is not None
        
        # Nu verificăm is_active pentru că nu există în modelul real
    
    @pytest.mark.asyncio
    async def test_user_roles(self, db_session):
        """Test că putem crea user cu roluri diferite."""
        roles = ["admin", "user"]
        
        for role in roles:
            user = User(
                username=f"user_{role}",
                password_hash=get_password_hash("password"),
                role=role
            )
            
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            
            assert user.role == role
            assert user.id is not None
