"""Add ownership and extended roles

Revision ID: add_ownership_roles
Revises: 5caab2fd7444
Create Date: 2025-08-20 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_ownership_roles'
down_revision = '5caab2fd7444'
branch_labels = None
depends_on = None

def upgrade():
    """Add ownership and extended user fields"""
    
    # Add new columns to users table
    op.add_column('users', sa.Column('company_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('contact_email', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                    server_default=sa.text('now()'), nullable=True))
    
    # Add owner_id to fonds table
    op.add_column('fonds', sa.Column('owner_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_fonds_owner_id',
        'fonds', 'users',
        ['owner_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Update existing users to have valid roles (optional - for existing data)
    # This is safe since we're not making role NOT NULL with a constraint yet
    
    print("✅ Migration completed successfully!")
    print("📝 Next steps:")
    print("   1. Update existing user roles if needed")
    print("   2. Assign ownership to existing fonds if needed")
    print("   3. Test the new schema")

def downgrade():
    """Remove ownership and extended user fields"""
    
    # Remove foreign key constraint
    op.drop_constraint('fk_fonds_owner_id', 'fonds', type_='foreignkey')
    
    # Remove columns from fonds
    op.drop_column('fonds', 'owner_id')
    
    # Remove columns from users  
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'notes')
    op.drop_column('users', 'contact_email')
    op.drop_column('users', 'company_name')
    
    print("⏪ Migration rolled back successfully!")
