# Alembic Database Migrations

🗄️ **Database migration system for Arhivare Web App**

Alembic configuration and migration files for managing database schema evolution with automatic model detection and environment-based configuration.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [📁 Structure](#-structure)
- [🚀 Quick Start](#-quick-start)
- [📜 Migration History](#-migration-history)
- [🔧 Configuration](#-configuration)
- [📝 Creating Migrations](#-creating-migrations)
- [⚡ Running Migrations](#-running-migrations)
- [🔄 Rollback Operations](#-rollback-operations)
- [🏗️ Development Workflow](#️-development-workflow)
- [🔍 Troubleshooting](#-troubleshooting)

## 🎯 Overview

This Alembic configuration manages database schema migrations for the Arhivare Web App, supporting:
- **Automatic model detection** from SQLAlchemy models
- **Environment-based configuration** with `.env` file support
- **Complete schema evolution** from initial tables to ownership system
- **Performance optimization** with strategic indexes
- **Role system migration** from legacy to new user roles

## 📁 Structure

```
alembic/
├── README                          # Basic Alembic documentation
├── env.py                         # Environment configuration
├── script.py.mako                 # Migration template
└── versions/                      # Migration files
    ├── 5caab2fd7444_create_users_and_fonds_tables.py
    ├── add_ownership_roles.py
    └── complete_ownership_roles.py
```

### 📄 Key Files

#### `env.py` - Environment Configuration
- **Automatic model import** from `app/models/`
- **Environment variable** integration with `.env` file
- **Database URL** override support
- **Offline/Online** migration modes

#### Migration Files
1. **`5caab2fd7444`** - Initial schema (users + fonds tables)
2. **`add_ownership_roles`** - Ownership system and extended user fields
3. **`complete_ownership_roles`** - Role migration and performance indexes

## 🚀 Quick Start

### Prerequisites
- Python environment with SQLAlchemy and Alembic installed
- Database server running (PostgreSQL/MySQL/SQLite)
- Environment variables configured

### Environment Setup
```bash
# Create .env file in project root
DATABASE_URL=postgresql://user:password@localhost:5432/arhivare_db

# Or for development with SQLite
DATABASE_URL=sqlite:///./arhivare.db
```

### Basic Commands
```bash
# Initialize Alembic (already done)
alembic init alembic

# Check current migration status
alembic current

# View migration history
alembic history --verbose

# Upgrade to latest migration
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description of changes"
```

## 📜 Migration History

### 🏗️ Initial Schema (`5caab2fd7444`)
**Created**: 2025-08-14  
**Purpose**: Foundation tables for the application

```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonds table  
CREATE TABLE fonds (
    id BIGINT PRIMARY KEY,
    company_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    source_url TEXT,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🔗 Ownership System (`add_ownership_roles`)
**Created**: 2025-08-20  
**Purpose**: Add fund ownership and extended user information

**New Fields Added:**
```sql
-- Users table extensions
ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN contact_email VARCHAR(100);
ALTER TABLE users ADD COLUMN notes TEXT;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fonds ownership
ALTER TABLE fonds ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
```

### ✅ Complete Migration (`complete_ownership_roles`)
**Created**: 2025-08-20  
**Purpose**: Finalize role system and add performance optimizations

**Role Migrations:**
- `user` role → `client` role (new default)
- Added support for `audit` role
- Maintained existing `admin` roles

**Performance Indexes:**
```sql
CREATE INDEX ix_fonds_owner_id ON fonds(owner_id);
CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_fonds_active ON fonds(active);
CREATE INDEX ix_fonds_owner_active ON fonds(owner_id, active);
```

## 🔧 Configuration

### Database Connection
Alembic automatically detects the database URL from:
1. `DATABASE_URL` environment variable
2. `.env` file in project root
3. Fallback to `alembic.ini` configuration

```python
# env.py configuration
load_dotenv()  # Load .env file
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)
```

### Model Detection
```python
# Automatic model imports
from app.models.base import Base
from app.models.user import User
from app.models.fond import Fond

target_metadata = Base.metadata
```

## 📝 Creating Migrations

### Automatic Migration Generation
```bash
# Generate migration from model changes
alembic revision --autogenerate -m "Add new field to User model"

# Review generated migration before running
cat alembic/versions/<revision_id>_add_new_field.py
```

### Manual Migration Creation
```bash
# Create empty migration template
alembic revision -m "Custom data migration"

# Edit the generated file to add your changes
```

### Migration Best Practices
```python
def upgrade():
    """
    Always provide detailed upgrade logic
    Include data migrations if needed
    Add print statements for tracking
    """
    print("🔧 Starting migration...")
    
    # Schema changes
    op.add_column('users', sa.Column('new_field', sa.String(100)))
    
    # Data migrations
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE users SET new_field = 'default' WHERE new_field IS NULL")
    )
    
    print("✅ Migration completed!")

def downgrade():
    """
    Always provide rollback logic
    Test downgrade before committing
    """
    op.drop_column('users', 'new_field')
    print("⏪ Migration rolled back!")
```

## ⚡ Running Migrations

### Forward Migrations
```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific revision
alembic upgrade add_ownership_roles

# Upgrade one step forward
alembic upgrade +1

# Show what would be executed (dry run)
alembic upgrade head --sql
```

### Migration Status
```bash
# Check current version
alembic current

# Show pending migrations
alembic history

# Show detailed history
alembic history --verbose

# Show SQL for specific migration
alembic show add_ownership_roles
```

## 🔄 Rollback Operations

### Downgrade Commands
```bash
# Rollback to previous version
alembic downgrade -1

# Rollback to specific revision
alembic downgrade 5caab2fd7444

# Rollback all migrations
alembic downgrade base

# Show downgrade SQL (dry run)
alembic downgrade -1 --sql
```

### Rollback Safety
- **Always backup** your database before major rollbacks
- **Test downgrades** in development first
- **Check for data loss** in downgrade operations
- **Have a recovery plan** for production rollbacks

## 🏗️ Development Workflow

### 1. Model Changes
```python
# Update your SQLAlchemy models
class User(Base):
    __tablename__ = "users"
    
    # Add new field
    new_field = Column(String(100), nullable=True)
```

### 2. Generate Migration
```bash
# Generate migration from model changes
alembic revision --autogenerate -m "Add new_field to User"
```

### 3. Review Migration
```python
# Check generated migration file
def upgrade():
    # Verify the auto-generated commands
    op.add_column('users', sa.Column('new_field', sa.String(100)))

def downgrade():  
    # Ensure downgrade logic is correct
    op.drop_column('users', 'new_field')
```

### 4. Test Migration
```bash
# Test in development database
alembic upgrade head

# Test rollback
alembic downgrade -1

# Re-apply for final testing
alembic upgrade head
```

### 5. Production Deployment
```bash
# Backup production database first
pg_dump arhivare_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
alembic upgrade head

# Verify migration success
alembic current
```

## 🔍 Troubleshooting

### Common Issues

#### Migration Not Found
```bash
# Error: Can't locate revision identified by 'xyz'
# Solution: Check revision ID spelling
alembic history
alembic upgrade correct_revision_id
```

#### Database Connection Issues
```bash
# Error: Can't connect to database
# Solution: Check DATABASE_URL and database status

# Verify environment variables
echo $DATABASE_URL

# Test database connection
python -c "from app.database import engine; print(engine.url)"
```

#### Model Import Errors
```python
# Error: Could not import models
# Solution: Check Python path and model imports in env.py

# Add debugging to env.py
try:
    from app.models.user import User
    print("✅ User model imported")
except ImportError as e:
    print(f"❌ User import failed: {e}")
```

#### Conflicting Migrations
```bash
# Error: Multiple head revisions
# Solution: Create merge migration

alembic merge -m "Merge conflicting branches" revision1 revision2
```

### Recovery Procedures

#### Reset to Clean State
```bash
# Drop all tables (DESTRUCTIVE)
alembic downgrade base

# Re-run all migrations
alembic upgrade head
```

#### Manual Schema Sync
```bash
# If migrations get out of sync with actual database
# Generate new migration to match current state
alembic revision --autogenerate -m "Sync schema with database"
```

#### Backup and Restore
```bash
# Backup before major operations
pg_dump arhivare_db > backup.sql

# Restore if needed
dropdb arhivare_db
createdb arhivare_db  
psql arhivare_db < backup.sql
```

### Debug Mode
```python
# Add to env.py for detailed logging
import logging
logging.basicConfig()
logging.getLogger('alembic').setLevel(logging.DEBUG)
```

## 📚 Additional Resources

### Alembic Documentation
- [Official Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Auto-generating Migrations](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
- [Operation Reference](https://alembic.sqlalchemy.org/en/latest/ops.html)

### SQLAlchemy Integration
- [Working with SQLAlchemy Models](https://docs.sqlalchemy.org/en/14/orm/)
- [Column and Data Types](https://docs.sqlalchemy.org/en/14/core/type_basics.html)

### Database-Specific Considerations
- **PostgreSQL**: Supports advanced features like arrays, JSON columns
- **MySQL**: Be aware of storage engine differences (InnoDB vs MyISAM)
- **SQLite**: Limited ALTER TABLE support, some operations require table recreation

---

## 🚨 Production Notes

### Pre-Deployment Checklist
- [ ] Backup production database
- [ ] Test migrations in staging environment
- [ ] Review migration for data loss potential
- [ ] Plan downtime window if needed
- [ ] Have rollback plan ready
- [ ] Monitor application after deployment

### Emergency Procedures
1. **Migration Failure**: Immediately rollback to previous version
2. **Data Corruption**: Restore from backup and investigate
3. **Performance Issues**: Check new indexes and query plans
4. **Application Errors**: Verify model changes match migration

---

**Database migrations made safe and reliable! 🗄️✨**
