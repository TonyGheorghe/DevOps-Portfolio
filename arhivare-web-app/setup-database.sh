#!/bin/bash
# setup-database.sh - Script pentru crearea tabelelor și popularea bazei de date

echo "🗄️ Setting up database tables and demo data..."

# 1. Verifică că API-ul rulează și e healthy
echo "1️⃣ Checking API health..."
curl -s http://localhost:8000/health | python3 -m json.tool || echo "API not ready yet, continuing..."

# 2. Verifică conexiunea la baza de date
echo "2️⃣ Testing database connection..."
docker compose exec db psql -U app -d arhivare -c "SELECT version();" || {
    echo "❌ Database connection failed!"
    exit 1
}

# 3. Verifică ce tabele există (ar trebui să fie goale)
echo "3️⃣ Checking existing tables..."
docker compose exec db psql -U app -d arhivare -c "\dt" || echo "No tables found (expected)"

# 4. Rulează migrările Alembic pentru a crea tabelele
echo "4️⃣ Running Alembic migrations to create tables..."
docker compose exec api alembic upgrade head

# 5. Verifică că tabelele au fost create
echo "5️⃣ Verifying tables were created..."
docker compose exec db psql -U app -d arhivare -c "\dt"

# 6. Verifică structura tabelelor
echo "6️⃣ Checking table structures..."
echo "--- Users table structure ---"
docker compose exec db psql -U app -d arhivare -c "\d users"

echo "--- Fonds table structure ---"
docker compose exec db psql -U app -d arhivare -c "\d fonds"

# 7. Creează utilizatori demo și date sample
echo "7️⃣ Creating demo users and sample data..."
docker compose exec api python create_admin_user.py

# 8. Verifică că datele au fost create
echo "8️⃣ Verifying demo data was created..."
echo "--- Users count ---"
docker compose exec db psql -U app -d arhivare -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

echo "--- Fonds count ---" 
docker compose exec db psql -U app -d arhivare -c "SELECT active, COUNT(*) FROM fonds GROUP BY active;"

echo "--- Sample data preview ---"
docker compose exec db psql -U app -d arhivare -c "SELECT id, username, role FROM users LIMIT 5;"
docker compose exec db psql -U app -d arhivare -c "SELECT id, company_name, holder_name, active FROM fonds LIMIT 5;"

# 9. Test API endpoints
echo "9️⃣ Testing API endpoints..."
echo "--- Health check ---"
curl -s http://localhost:8000/health | python3 -m json.tool

echo "--- Public search test ---"
curl -s "http://localhost:8000/search?query=tractorul&limit=3" | python3 -m json.tool

echo "--- API docs available at ---"
echo "http://localhost:8000/docs"

# 10. Show connection info for Adminer
echo "🔟 Database connection info for Adminer (http://localhost:8080):"
echo "System: PostgreSQL"
echo "Server: db"
echo "Username: app"
echo "Password: app"
echo "Database: arhivare"

echo ""
echo "✅ Database setup complete!"
echo "🌐 Application URLs:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • Adminer:  http://localhost:8080"
echo ""
echo "🔐 Demo accounts:"
echo "   • Admin:       admin / admin123"
echo "   • Audit:       audit_user / Audit1234"
echo "   • Client:      client_brasov / Client1234"
