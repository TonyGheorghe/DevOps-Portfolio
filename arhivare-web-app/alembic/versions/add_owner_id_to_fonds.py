# alembic/versions/add_owner_id_to_fonds.py
"""Add owner_id to fonds table

Revision ID: add_owner_id_to_fonds
Revises: previous_migration_id
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_owner_id_to_fonds'
down_revision = 'previous_migration_id'  # Replace with actual previous revision
branch_labels = None
depends_on = None

def upgrade():
    """Add owner_id column to fonds table"""
    # Add owner_id column
    op.add_column('fonds', sa.Column('owner_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_fonds_owner_id_users',  # constraint name
        'fonds',                    # source table
        'users',                    # target table
        ['owner_id'],               # source columns
        ['id'],                     # target columns
        ondelete='SET NULL'         # what to do when user is deleted
    )
    
    # Add index for performance
    op.create_index('ix_fonds_owner_id', 'fonds', ['owner_id'])

def downgrade():
    """Remove owner_id column from fonds table"""
    # Drop index
    op.drop_index('ix_fonds_owner_id', table_name='fonds')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_fonds_owner_id_users', 'fonds', type_='foreignkey')
    
    # Drop column
    op.drop_column('fonds', 'owner_id')
