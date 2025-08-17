# tests/test_auth.py - FIXED VERSION
import pytest
from httpx import AsyncClient
from app.models.user import User
from app.core.security import get_password_hash

class TestAuthEndpoints:
    """Test suite pentru authentication endpoints."""
    
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
        
        # Check user info
        user_data = data["user"]
        assert user_data["username"] == admin_user.username
        assert user_data["role"] == admin_user.role
        
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
    async def test_protected_endpoint_without_token_returns_401(self, client: AsyncClient, debug_routes):
        """Test accesul la endpoint protejat fără token returnează unauthorized."""
        # Debug: Print available routes
        print(f"\nAvailable routes: {debug_routes}")
        
        # Try the /auth/protected endpoint first
        response = await client.get("/auth/protected")
        
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_invalid_token_returns_401(self, client: AsyncClient):
        """Test accesul la endpoint protejat cu token invalid returnează unauthorized."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/auth/protected", headers=headers)
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_malformed_header_returns_401(self, client: AsyncClient):
        """Test accesul la endpoint protejat cu header malformat returnează unauthorized."""
        # Lipsește "Bearer" prefix
        headers = {"Authorization": "some_token"}
        response = await client.get("/auth/protected", headers=headers)
        assert response.status_code == 401
        
        # Authorization header gol
        headers = {"Authorization": ""}
        response = await client.get("/auth/protected", headers=headers)
        assert response.status_code == 401
        
        # Doar "Bearer" fără token
        headers = {"Authorization": "Bearer"}
        response = await client.get("/auth/protected", headers=headers)
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_valid_token_returns_200(self, client: AsyncClient, auth_headers: dict):
        """Test accesul la endpoint protejat cu token valid reușește."""
        response = await client.get("/auth/protected", headers=auth_headers)
        assert response.status_code == 200
        
        # Should return a message
        data = response.json()
        assert "message" in data
    
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
        try:
            import jwt
            from app.core.config import settings
            
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            assert payload["sub"] == admin_user.username
            assert "exp" in payload  # Expiration time ar trebui să fie prezent
        except ImportError:
            # If PyJWT is not available, skip this detailed check
            pytest.skip("PyJWT not available for token verification")
        except Exception as e:
            pytest.fail(f"Token should be valid: {e}")

class TestUserManagement:
    """Test suite pentru management user - compatibil cu modelul real."""
    
    @pytest.mark.asyncio
    async def test_create_user_structure(self, db_session):
        """Test că putem crea user cu structura corectă."""
        # Test direct în database să înțelegem modelul
        user = User(
            username="newuser_test",
            password_hash=get_password_hash("password123"),
            role="user"
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Verifică că user-ul a fost creat corect
        assert user.id is not None
        assert user.username == "newuser_test"
        assert user.role == "user"
        assert user.password_hash != "password123"  # Ar trebui să fie hashed
        assert user.created_at is not None
    
    @pytest.mark.asyncio
    async def test_user_roles(self, db_session):
        """Test că putem crea user cu roluri diferite."""
        roles = ["admin", "user"]
        
        for i, role in enumerate(roles):
            user = User(
                username=f"user_{role}_{i}",  # Make unique
                password_hash=get_password_hash("password"),
                role=role
            )
            
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            
            assert user.role == role
            assert user.id is not None
