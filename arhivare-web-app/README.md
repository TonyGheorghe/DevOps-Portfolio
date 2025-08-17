# Arhivare Web App

## 📌 Description
**Arhivare Web App** is a web application built with **FastAPI** and **PostgreSQL** that allows:
- Public search for archival fonds by company name
- Complete management of archival fonds (CRUD) via a secure API (JWT authentication)
- Simple web interface for public search

This is the second application in the **DevOps Portfolio**, alongside [`hello-web-app`](../hello-web-app/).

## 🎯 Purpose
The goal of this application is to provide users with contact details of institutions or companies that hold the archives of certain companies (for example, to obtain employment history certificates).

**Example:**
> If a user searches for "Tractorul Brașov", the application will return the contact information of the relevant archival fond holder, e.g., "National Archive Brașov" – address, email, phone, etc.

## 🧩 User Roles
- **Public User:**
  - Can use the search function without authentication
  - Access simple web interface for searches
- **Admin:**
  - JWT login
  - Add, edit, delete archival fonds
  - View list of fonds (with filters/pagination)
  - Manage users (complete CRUD)

## 🗄️ Tech Stack
- **Backend:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL
- **ORM & Migrations:** SQLAlchemy + Alembic
- **Testing:** pytest + pytest-asyncio + httpx
- **Orchestration:** Docker + Docker Compose (API + DB + Adminer)
- **CI/CD:** GitHub Actions (build, test, push image to Docker Hub)

## 📂 Project Structure
```bash
arhivare-web-app/
├── app/                      # Application source code
│   ├── api/                  # API routers
│   │   ├── auth.py           # ✅ JWT Authentication (login, /me, protected)
│   │   ├── search.py         # ✅ Public search (/search, /search/count)
│   │   └── routes/
│   │       ├── fonds.py      # ✅ Fonds CRUD (admin only)
│   │       └── users.py      # ✅ User CRUD (admin only)
│   ├── core/                 # Configuration and security
│   │   ├── config.py         # ✅ Pydantic Settings
│   │   └── security.py       # ✅ JWT token creation/verification
│   ├── models/               # SQLAlchemy models
│   │   ├── base.py           # ✅ Base class for all models
│   │   ├── user.py           # ✅ User model with authentication
│   │   └── fond.py           # ✅ Fond model with all fields
│   ├── schemas/              # Pydantic DTOs
│   │   ├── user.py           # ✅ UserCreate, UserUpdate, UserRead
│   │   └── fond.py           # ✅ FondCreate, FondUpdate, FondResponse
│   ├── crud/                 # Database operations
│   │   ├── user.py           # ✅ Complete CRUD for users
│   │   └── fond.py           # ✅ CRUD + search for fonds
│   ├── db/
│   │   └── session.py        # ✅ DB connection + dependency
│   ├── static/
│   │   └── index.html        # ✅ Simple frontend for search
│   └── main.py               # ✅ FastAPI app with all routes
├── alembic/                  # ✅ Database migrations
│   ├── env.py                # ✅ Alembic configuration
│   └── versions/
│       └── 5caab2fd7444_create_users_and_fonds_tables.py  # ✅ Initial migration
├── frontend/
│   └── index.html            # ✅ Alternative frontend
├── tests/                    # ✅ Complete test suite
│   ├── conftest.py           # ✅ Pytest configuration + fixtures
│   ├── test_health.py        # ✅ Health check tests
│   ├── test_auth.py          # ✅ Authentication tests
│   ├── test_search.py        # ✅ Public search tests
│   ├── test_crud.py          # ✅ CRUD operations tests
│   ├── test_fonds_api.py     # ✅ Fonds API tests
│   └── run_tests.py          # ✅ Test runner script
├── Dockerfile                # ✅ Application container
├── requirements.txt          # ✅ Python dependencies
├── .env.example              # ✅ Environment variables example
├── alembic.ini               # ✅ Alembic configuration
└── README.md                 # ✅ Documentation (this file)
```

## 🚀 Implementation Status

### ✅ Fully Implemented:
- **Complete Backend API** with all endpoints
- **Data Models** (User, Fond) with relationships and validations
- **JWT Authentication** with endpoint protection
- **Complete CRUD** for fonds and users
- **Advanced Search** with filtering and pagination
- **Pydantic Validations** for all inputs
- **Alembic Migrations** for database structure
- **Complete Test Suite** with pytest (>85% coverage)
- **Simple Frontend** for public search
- **Dockerization** with optimized Dockerfile

### 🚧 In Progress:
- **Docker Compose** (yml file - to be added)
- **CI/CD Pipeline** (GitHub Actions - upcoming)
- **VPS Deployment** with domain and HTTPS

### 🎯 Next Steps (Frontend Development):
- **React Frontend** - Modern admin dashboard with full CRUD operations
- **Vue.js Alternative** - Alternative frontend implementation for comparison
- **Advanced Search Interface** - Enhanced search with filters and sorting
- **User Management UI** - Admin interface for user management
- **Responsive Design** - Mobile-friendly interfaces

## 🔧 Environment Variables

Create `.env` file based on `.env.example`:

```env
# Database (for Docker Compose)
DATABASE_URL=postgresql+psycopg2://app:app@db:5432/arhivare

# JWT Security
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin bootstrap (optional - for creating first admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 🚀 Running the Application

### Option 1: Local Development with Python
```bash
# 1. Clone repository
git clone <repository-url>
cd arhivare-web-app

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Setup local PostgreSQL database
createdb arhivare

# 5. Configure .env (see above)
cp .env.example .env
# Edit .env with your settings

# 6. Run migrations
alembic upgrade head

# 7. Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Docker (API only)
```bash
# Build and run container
docker build -t arhivare-web-app .
docker run -p 8000:8000 --env-file .env arhivare-web-app
```

### Option 3: Docker Compose (to be implemented)
```bash
# When docker-compose.yml is ready
docker compose up --build
```

## 📖 API Usage

### Public endpoints (no authentication required):

**Health Check:**
```http
GET /health
```

**Search fonds:**
```http
GET /search?query=tractorul&limit=20&skip=0
GET /search/count?query=tractorul
```

**Simple Frontend:**
```
http://localhost:8000/app/static/index.html
```

### Admin endpoints (authentication required):

**Authentication:**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Fond Management:**
```http
GET /fonds/                     # List fonds
POST /fonds/                    # Create new fond
GET /fonds/{id}                 # Get fond details
PUT /fonds/{id}                 # Update fond
DELETE /fonds/{id}              # Delete fond (soft delete)
DELETE /fonds/{id}?permanent=true  # Permanent delete
```

**User Management:**
```http
GET /users/                     # List users
POST /users/                    # Create user
PUT /users/{id}                 # Update user
DELETE /users/{id}              # Delete user
```

## 🧪 Testing

### Run all tests:
```bash
# Using included script
python tests/run_tests.py

# Or directly with pytest
pytest tests/ -v

# Specific tests
pytest tests/test_auth.py -v
pytest tests/test_search.py -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Categories:
- ✅ **Import Tests** - Verify module imports
- ✅ **Health Check** - Test health endpoint
- ✅ **Authentication** - Login, JWT, endpoint protection
- ✅ **Search Functionality** - Public search with validations
- ✅ **CRUD Operations** - Direct database operations
- ✅ **API Endpoints** - Complete HTTP API testing

## 📊 Response Examples

### Public search:
```json
[
  {
    "id": 42,
    "company_name": "Tractorul Brașov SA",
    "holder_name": "National Archive Brașov",
    "address": "Industriei Street 15, Brașov",
    "email": "contact@archive-brasov.ro",
    "phone": "+40 268 123 456",
    "active": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
]
```

### Successful authentication:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

## 🔗 API Documentation

After starting the application, interactive documentation is available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

## 🛠 Roadmap

### Immediate Next Steps:
1. **Docker Compose** - Complete setup with PostgreSQL and Adminer
2. **React Frontend** - Modern admin dashboard with Material-UI or Tailwind CSS
3. **Vue.js Frontend** - Alternative implementation for comparison

### Future Development:
4. **GitHub Actions** - CI/CD pipeline for automated build and testing
5. **VPS Deployment** - Production deployment with domain and HTTPS
6. **Advanced Features** - Bulk operations, data export, audit logs
7. **Monitoring** - Logging and performance metrics
8. **Mobile App** - React Native or Flutter mobile interface

## 🎨 Frontend Development Plans

### React Implementation:
- **Admin Dashboard** with modern UI components
- **Advanced Search Interface** with filters and sorting
- **CRUD Forms** for fond and user management
- **Authentication Flow** with JWT token management
- **Responsive Design** for mobile and desktop
- **State Management** with Redux or Zustand

### Vue.js Implementation:
- **Alternative Frontend** for comparison and learning
- **Composition API** with modern Vue 3 features
- **Pinia State Management** for application state
- **Quasar Framework** for UI components
- **TypeScript Integration** for better development experience

## 👨‍💻 Author
**Tony Gheorghe**

## 📄 License
MIT License

---

**Status:** ✅ **Fully Functional Application** - Ready for frontend development
**Version:** v0.6.0
**Last Updated:** August 2025
