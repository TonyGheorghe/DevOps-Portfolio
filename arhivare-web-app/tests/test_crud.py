# tests/test_crud.py
import pytest
from sqlalchemy.orm import Session

from app.models.fond import Fond
from app.models.user import User
from app.schemas.fond import FondCreate, FondUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.crud.fond import (
    create_fond, get_fond, get_fonds, search_fonds,
    update_fond, soft_delete_fond, get_fonds_count
)
from app.crud.user import (
    create_user, get_user_by_id, get_user_by_username,
    list_users, update_user, delete_user
)

class TestFondCRUD:
    """Test suite for Fond CRUD operations."""
    
    def test_create_fond(self, db_session: Session):
        """Test creating a new fond."""
        fond_data = FondCreate(
            company_name="Test Company CRUD",
            holder_name="Test Holder CRUD",
            address="Test Address 123",
            email="test@crud.ro",
            phone="+40 21 123 4567",
            notes="CRUD test notes"
        )
        
        created_fond = create_fond(db_session, fond_data)
        
        assert created_fond.id is not None
        assert created_fond.company_name == fond_data.company_name
        assert created_fond.holder_name == fond_data.holder_name
        assert created_fond.active is True  # Default value
        assert created_fond.created_at is not None
    
    def test_get_fond_by_id(self, db_session: Session, sample_fonds: list[Fond]):
        """Test retrieving a fond by ID."""
        fond_id = sample_fonds[0].id
        
        retrieved_fond = get_fond(db_session, fond_id)
        
        assert retrieved_fond is not None
        assert retrieved_fond.id == fond_id
        assert retrieved_fond.company_name == sample_fonds[0].company_name
    
    def test_get_fond_nonexistent_returns_none(self, db_session: Session):
        """Test that getting nonexistent fond returns None."""
        result = get_fond(db_session, 99999)
        assert result is None
    
    def test_get_fonds_list(self, db_session: Session, sample_fonds: list[Fond]):
        """Test getting list of fonds."""
        # Get all fonds
        all_fonds = get_fonds(db_session, skip=0, limit=100, active_only=False)
        assert len(all_fonds) == len(sample_fonds)
        
        # Get only active fonds
        active_fonds = get_fonds(db_session, skip=0, limit=100, active_only=True)
        active_count = sum(1 for f in sample_fonds if f.active)
        assert len(active_fonds) == active_count
    
    def test_get_fonds_pagination(self, db_session: Session, sample_fonds: list[Fond]):
        """Test pagination in get_fonds."""
        # Test limit
        limited_fonds = get_fonds(db_session, skip=0, limit=1, active_only=False)
        assert len(limited_fonds) == 1
        
        # Test skip
        if len(sample_fonds) > 1:
            skipped_fonds = get_fonds(db_session, skip=1, limit=100, active_only=False)
            assert len(skipped_fonds) == len(sample_fonds) - 1
    
    def test_search_fonds(self, db_session: Session, sample_fonds: list[Fond]):
        """Test searching fonds by query."""
        # Search for 'Brașov' - should find 2 entries
        results = search_fonds(db_session, "Brașov", skip=0, limit=10)
        assert len(results) >= 1
        
        # Check that results contain the search term
        found_brasov = any("Brașov" in fond.company_name or "Brașov" in fond.holder_name 
                          for fond in results)
        assert found_brasov
        
        # Case insensitive search
        results_lower = search_fonds(db_session, "brașov", skip=0, limit=10)
        assert len(results_lower) == len(results)
    
    def test_search_fonds_only_active(self, db_session: Session, sample_fonds: list[Fond]):
        """Test that search only returns active fonds."""
        results = search_fonds(db_session, "Company", skip=0, limit=10)
        
        for fond in results:
            assert fond.active is True
    
    def test_update_fond(self, db_session: Session, sample_fonds: list[Fond]):
        """Test updating a fond."""
        fond_to_update = sample_fonds[0]
        
        update_data = FondUpdate(
            phone="+40 21 999 8888",
            notes="Updated notes via CRUD",
            email="updated@email.ro"
        )
        
        updated_fond = update_fond(db_session, fond_to_update.id, update_data)
        
        assert updated_fond is not None
        assert updated_fond.phone == update_data.phone
        assert updated_fond.notes == update_data.notes
        assert updated_fond.email == update_data.email
        assert updated_fond.updated_at is not None
        
        # Company name should remain unchanged
        assert updated_fond.company_name == fond_to_update.company_name
    
    def test_update_nonexistent_fond_returns_none(self, db_session: Session):
        """Test updating nonexistent fond returns None."""
        update_data = FondUpdate(notes="Should not work")
        result = update_fond(db_session, 99999, update_data)
        assert result is None
    
    def test_soft_delete_fond(self, db_session: Session, sample_fonds: list[Fond]):
        """Test soft deleting a fond."""
        fond_to_delete = sample_fonds[0]
        original_id = fond_to_delete.id
        
        # Soft delete
        success = soft_delete_fond(db_session, original_id)
        assert success is True
        
        # Fond should still exist but be inactive
        deleted_fond = get_fond(db_session, original_id)
        assert deleted_fond is not None
        assert deleted_fond.active is False
        
        # Should not appear in active-only searches
        active_fonds = get_fonds(db_session, skip=0, limit=100, active_only=True)
        active_ids = [f.id for f in active_fonds]
        assert original_id not in active_ids
    
    def test_soft_delete_nonexistent_fond_returns_false(self, db_session: Session):
        """Test soft deleting nonexistent fond returns False."""
        result = soft_delete_fond(db_session, 99999)
        assert result is False
    
    def test_get_fonds_count(self, db_session: Session, sample_fonds: list[Fond]):
        """Test counting fonds."""
        # Total count
        total_count = get_fonds_count(db_session, active_only=False)
        assert total_count == len(sample_fonds)
        
        # Active count
        active_count = get_fonds_count(db_session, active_only=True)
        expected_active = sum(1 for f in sample_fonds if f.active)
        assert active_count == expected_active

class TestUserCRUD:
    """Test suite for User CRUD operations."""
    
    def test_create_user(self, db_session: Session):
        """Test creating a new user."""
        user_data = UserCreate(
            username="testuser",
            password="testpassword123",
            role="user"
        )
        
        created_user = create_user(db_session, user_data)
        
        assert created_user.id is not None
        assert created_user.username == user_data.username
        assert created_user.role == user_data.role
        assert created_user.is_active is True  # Default value
        assert created_user.password_hash != user_data.password  # Should be hashed
        assert len(created_user.password_hash) > 20  # Hashed password is longer
    
    def test_get_user_by_id(self, db_session: Session, admin_user: User):
        """Test getting user by ID."""
        retrieved_user = get_user_by_id(db_session, admin_user.id)
        
        assert retrieved_user is not None
        assert retrieved_user.id == admin_user.id
        assert retrieved_user.username == admin_user.username
    
    def test_get_user_by_username(self, db_session: Session, admin_user: User):
        """Test getting user by username."""
        retrieved_user = get_user_by_username(db_session, admin_user.username)
        
        assert retrieved_user is not None
        assert retrieved_user.username == admin_user.username
        assert retrieved_user.id == admin_user.id
    
    def test_get_nonexistent_user_returns_none(self, db_session: Session):
        """Test that getting nonexistent user returns None."""
        result_by_id = get_user_by_id(db_session, 99999)
        assert result_by_id is None
        
        result_by_username = get_user_by_username(db_session, "nonexistent")
        assert result_by_username is None
    
    def test_list_users(self, db_session: Session, admin_user: User):
        """Test listing users with pagination."""
        users = list_users(db_session, skip=0, limit=10)
        
        assert len(users) >= 1
        assert admin_user.id in [u.id for u in users]
    
    def test_update_user(self, db_session: Session, admin_user: User):
        """Test updating user information."""
        update_data = UserUpdate(
            username="updated_admin",
            password="newpassword123"
        )
        
        updated_user = update_user(db_session, admin_user, update_data)
        
        assert updated_user.username == update_data.username
        assert updated_user.password_hash != admin_user.password_hash  # Password should change
        assert updated_user.id == admin_user.id  # ID should remain same
    
    def test_delete_user(self, db_session: Session):
        """Test deleting a user (hard delete)."""
        # Create a user to delete
        user_data = UserCreate(
            username="to_delete",
            password="password123",
            role="user"
        )
        user_to_delete = create_user(db_session, user_data)
        user_id = user_to_delete.id
        
        # Delete the user
        delete_user(db_session, user_to_delete)
        
        # User should no longer exist
        deleted_user = get_user_by_id(db_session, user_id)
        assert deleted_user is None
    
    def test_create_user_duplicate_username_raises_error(self, db_session: Session, admin_user: User):
        """Test that creating user with duplicate username raises error."""
        duplicate_user_data = UserCreate(
            username=admin_user.username,  # Same username
            password="password123",
            role="user"
        )
        
        with pytest.raises(Exception):  # Should raise IntegrityError or similar
            create_user(db_session, duplicate_user_data)
            db_session.commit()  # Force the constraint check
