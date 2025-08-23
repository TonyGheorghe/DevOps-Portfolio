#!/bin/bash
# init-db.sh - Database initialization script

set -e

echo "🔄 Starting database initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! pg_isready -h db -p 5432 -U app -d arhivare; do
    echo "PostgreSQL is not ready yet... waiting"
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Alembic migrations
echo "🔄 Running database migrations..."
cd /app
python -m alembic upgrade head

echo "✅ Database migrations completed!"

# Create admin user and sample data (optional)
if [ "$CREATE_SAMPLE_DATA" = "true" ]; then
    echo "🔄 Creating sample data..."
    python create_admin_user.py
    echo "✅ Sample data created!"
fi

echo "✅ Database initialization completed successfully!"
