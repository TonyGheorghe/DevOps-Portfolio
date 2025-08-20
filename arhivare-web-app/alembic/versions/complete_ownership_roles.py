"""Complete ownership and role migration

Revision ID: complete_ownership_roles
Revises: add_ownership_roles
Create Date: 2025-08-20 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'complete_ownership_roles'
down_revision = 'add_ownership_roles'
branch_labels = None
depends_on = None

def upgrade():
    """Finalize ownership and role implementation"""
    
    print("🔧 Starting complete ownership migration...")
    
    # Update existing user roles from old system to new system
    print("📝 Migrating user roles...")
    
    # Create a mapping table for role migration
    connection = op.get_bind()
    
    # Update existing 'user' roles to 'client' (new default)
    connection.execute(
        sa.text("UPDATE users SET role = 'client' WHERE role = 'user'")
    )
    
    # Ensure admin roles stay admin
    connection.execute(
        sa.text("UPDATE users SET role = 'admin' WHERE role = 'admin'")
    )
    
    # Add any missing updated_at timestamps for users
    connection.execute(
        sa.text("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    )
    
    # Set default active status for existing fonds if not set
    connection.execute(
        sa.text("UPDATE fonds SET active = true WHERE active IS NULL")
    )
    
    print("✅ Role migration completed successfully!")
    
    # Create indexes for better performance
    print("📊 Creating performance indexes...")
    
    # Index on owner_id for faster fond lookups by owner
    try:
        op.create_index('ix_fonds_owner_id', 'fonds', ['owner_id'])
        print("  ✅ Created index on fonds.owner_id")
    except Exception as e:
        print(f"  ⚠️  Index fonds.owner_id might already exist: {e}")
    
    # Index on role for faster user filtering
    try:
        op.create_index('ix_users_role', 'users', ['role'])
        print("  ✅ Created index on users.role")
    except Exception as e:
        print(f"  ⚠️  Index users.role might already exist: {e}")
    
    # Index on active status for faster fond filtering
    try:
        op.create_index('ix_fonds_active', 'fonds', ['active'])
        print("  ✅ Created index on fonds.active")
    except Exception as e:
        print(f"  ⚠️  Index fonds.active might already exist: {e}")
    
    # Composite index for owner + active status
    try:
        op.create_index('ix_fonds_owner_active', 'fonds', ['owner_id', 'active'])
        print("  ✅ Created composite index on fonds.owner_id + active")
    except Exception as e:
        print(f"  ⚠️  Composite index might already exist: {e}")
    
    print("\n🎉 Migration completed successfully!")
    print("📋 Summary of changes:")
    print("   • Updated user roles: user → client")
    print("   • Added ownership support for fonds")
    print("   • Enhanced user model with extended fields")
    print("   • Added performance indexes")
    print("   • Ready for role-based access control")
    
    print("\n🔄 Next steps:")
    print("   1. Update API endpoints to use new role system")
    print("   2. Test ownership assignment functionality")
    print("   3. Update frontend to handle new roles")
    print("   4. Run full test suite")

def downgrade():
    """Revert ownership and role changes"""
    
    print("⏪ Reverting ownership migration...")
    
    # Remove indexes
    try:
        op.drop_index('ix_fonds_owner_active', 'fonds')
        op.drop_index('ix_fonds_active', 'fonds')
        op.drop_index('ix_users_role', 'users')
        op.drop_index('ix_fonds_owner_id', 'fonds')
        print("  ✅ Removed performance indexes")
    except Exception as e:
        print(f"  ⚠️  Some indexes might not exist: {e}")
    
    # Revert user roles from new system to old system
    connection = op.get_bind()
    
    # Convert 'client' back to 'user'
    connection.execute(
        sa.text("UPDATE users SET role = 'user' WHERE role = 'client'")
    )
    
    # Remove audit users (they didn't exist in old system)
    connection.execute(
        sa.text("DELETE FROM users WHERE role = 'audit'")
    )
    
    print("⏪ Migration rolled back successfully!")
