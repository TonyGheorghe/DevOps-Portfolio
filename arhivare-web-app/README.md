Arhivare Web App
📌 Description
Arhivare Web App is a comprehensive web application built with FastAPI and PostgreSQL that enables:

Public search for archival fonds by company name
Role-based management of archival fonds (CRUD) with JWT authentication
Complete React frontend with modern UI/UX
Advanced ownership system for client-specific fond management

This is the second application in the DevOps Portfolio, alongside hello-web-app.
🎯 Purpose
The goal of this application is to provide users with contact details of institutions or companies that hold the archives of certain companies (for example, to obtain employment history certificates).
Example:

If a user searches for "Tractorul Brașov", the application will return the contact information of the relevant archival fond holder, e.g., "National Archive Brașov" – address, email, phone, etc.

🧩 User Roles & Features

Public User:

Can use the search function without authentication
Access to modern React frontend for searches


Client:

JWT login with personalized dashboard
Manage assigned archival fonds (CRUD operations)
View personal statistics and completion rates
Add, edit, delete own fonds


Audit:

Read-only access to all system data
Advanced reporting and export capabilities
System-wide statistics and insights
Recent assignments tracking


Admin:

Complete system management
User management (create, edit, delete users)
Fond ownership assignment and management
Bulk operations and advanced administration



🗄️ Tech Stack
Backend:

FastAPI (Python 3.11+) with advanced routing
PostgreSQL with comprehensive migrations
SQLAlchemy + Alembic for ORM & migrations
JWT Authentication with role-based access control
Pydantic for data validation and serialization

Frontend:

React 18 with TypeScript
Tailwind CSS for styling
React Hook Form + Yup for form validation
React Router for navigation
Lucide React for icons

Development & Deployment:

Docker + Docker Compose for containerization
pytest + pytest-asyncio + httpx for testing
GitHub Actions ready for CI/CD
Adminer for database management

📂 Project Structure
basharhivare-web-app/
├── app/                          # Backend application
│   ├── api/                      # API routers
│   │   ├── auth.py               # ✅ JWT Authentication
│   │   ├── search.py             # ✅ Public search endpoints
│   │   └── routes/
│   │       ├── fonds.py          # ✅ General fonds CRUD
│   │       ├── client_fonds.py   # ✅ Client-specific endpoints
│   │       ├── admin_fonds.py    # ✅ Admin ownership management
│   │       └── users.py          # ✅ User management
│   ├── core/                     # Configuration and security
│   │   ├── config.py             # ✅ Pydantic Settings
│   │   └── security.py           # ✅ JWT & password hashing
│   ├── models/                   # SQLAlchemy models
│   │   ├── base.py               # ✅ Base class
│   │   ├── user.py               # ✅ Enhanced user model with extended roles
│   │   └── fond.py               # ✅ Fond model with ownership support
│   ├── schemas/                  # Pydantic DTOs
│   │   ├── user.py               # ✅ Extended user schemas with new roles
│   │   └── fond.py               # ✅ Comprehensive fond schemas
│   ├── crud/                     # Database operations
│   │   ├── user.py               # ✅ Extended user operations
│   │   └── fond.py               # ✅ Advanced fond CRUD with ownership
│   ├── db/session.py             # ✅ Database connection
│   ├── static/index.html         # ✅ Simple backend search interface
│   └── main.py                   # ✅ FastAPI app with role-based routing
├── react-frontend/               # Modern React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthSystem.tsx    # ✅ Complete authentication system
│   │   │   ├── HomePage.tsx      # ✅ Public search interface
│   │   │   ├── AdminDashboard.tsx # ✅ Full admin management
│   │   │   ├── AuditDashboard.tsx # ✅ Audit reporting interface
│   │   │   ├── ClientDashboard.tsx # ✅ Client personal dashboard
│   │   │   ├── forms/
│   │   │   │   ├── FondForm.tsx  # ✅ Advanced form with duplicate detection
│   │   │   │   └── UserForm.tsx  # ✅ User management form
│   │   │   └── pages/
│   │   │       ├── UsersPage.tsx # ✅ User management interface
│   │   │       └── UserProfile.tsx # ✅ Profile management
│   │   ├── services/api.ts       # ✅ API service layer
│   │   └── types/index.ts        # ✅ TypeScript definitions
│   ├── package.json              # ✅ Dependencies and scripts
│   └── tailwind.config.js        # ✅ Tailwind configuration
├── alembic/                      # ✅ Database migrations
│   ├── versions/
│   │   ├── 5caab2fd7444_create_users_and_fonds_tables.py
│   │   ├── add_ownership_roles.py
│   │   └── complete_ownership_roles.py
├── tests/                        # ✅ Comprehensive test suite
│   ├── conftest.py               # ✅ Test configuration and fixtures
│   ├── test_health.py            # ✅ Health check tests
│   ├── test_auth.py              # ✅ Authentication flow tests
│   ├── test_search.py            # ✅ Public search functionality
│   ├── test_crud.py              # ✅ Database operations tests
│   ├── test_fonds_api.py         # ✅ API endpoint tests
│   └── run_tests.py              # ✅ Test runner script
├── docker-compose.yml            # ✅ Multi-service container setup
├── Dockerfile                    # ✅ Optimized application container
├── requirements.txt              # ✅ Python dependencies
├── create_admin_user.py          # ✅ Demo data and user creation script
└── README.md                     # ✅ This documentation
🚀 Implementation Status
✅ Fully Implemented:

Complete Backend API with role-based access control
Enhanced Data Models with ownership and extended user roles
JWT Authentication with comprehensive endpoint protection
Advanced CRUD Operations for all entities
Public Search with filtering, pagination, and count endpoints
Role-Based Routing (admin/audit/client specific endpoints)
Ownership Management - assign fonds to clients
Complete React Frontend with modern UI/UX
User Management Interface with role-based permissions
Client Dashboard for personal fond management
Admin Dashboard with comprehensive management tools
Audit Dashboard with reporting and analytics
Form Validation with duplicate detection and error handling
Responsive Design for mobile and desktop
Database Migrations with ownership and role extensions
Comprehensive Test Suite (>85% coverage)
Docker Configuration ready for deployment

🎯 Ready for Production:

User Roles: Admin, Audit, Client with granular permissions
Ownership System: Fonds can be assigned to specific clients
Modern Frontend: React with TypeScript and Tailwind CSS
Security: JWT authentication with protected routes
Testing: Complete test coverage for all functionality
Documentation: Comprehensive API docs and user guides

🔧 Environment Configuration
Create .env file based on .env.example:
env# Database Configuration
DATABASE_URL=postgresql+psycopg2://app:app@db:5432/arhivare

# JWT Security
JWT_SECRET=your_super_secure_jwt_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin Bootstrap (optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
🚀 Quick Start
Option 1: Docker Compose (Recommended)
bash# Clone repository and navigate to project
git clone <repository-url>
cd arhivare-web-app

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up --build

# Create demo users and data
docker-compose exec api python create_admin_user.py
Option 2: Local Development
bash# Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database setup
createdb arhivare
cp .env.example .env
# Configure DATABASE_URL in .env

# Run migrations and create demo data
alembic upgrade head
python create_admin_user.py

# Start backend
uvicorn app.main:app --reload

# Frontend setup (new terminal)
cd react-frontend
npm install
npm start
🎯 Access Points
After starting the application:
Web Interfaces:

Homepage & Search: http://localhost:3000
Admin Dashboard: http://localhost:3000/admin
Audit Dashboard: http://localhost:3000/audit
Client Dashboard: http://localhost:3000/client
User Management: http://localhost:3000/admin/users

API Documentation:

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
Database Admin: http://localhost:8080 (Adminer)

Demo Accounts:
RoleUsernamePasswordDescriptionAdminadminadmin123Full system accessAuditaudit_userAudit1234Read-only with reportingClientclient_brasovClient1234Assigned Brașov fondsClientclient_clujClient1234Assigned Cluj fondsClientclient_bucurestiClient1234Assigned București fonds
🧪 Testing
Run Complete Test Suite:
bash# Using test runner script
python tests/run_tests.py

# Direct pytest execution
pytest tests/ -v

# With coverage report
pytest tests/ --cov=app --cov-report=html

# Specific test categories
pytest tests/test_auth.py -v        # Authentication tests
pytest tests/test_search.py -v      # Search functionality
pytest tests/test_fonds_api.py -v   # API endpoint tests
Test Categories:

✅ Authentication & Authorization - Login, JWT, role-based access
✅ Public Search - Search functionality with pagination
✅ CRUD Operations - Database operations for all entities
✅ API Endpoints - Complete HTTP API testing
✅ Role-Based Access - Permission testing for all roles
✅ Ownership Management - Fond assignment functionality

📊 API Endpoints Overview
Public (No Authentication):

GET /health - System health check
GET /search - Search archival fonds
GET /search/count - Count search results
GET /static/index.html - Simple search interface

Authentication:

POST /auth/login - User authentication
GET /auth/me - Current user information
GET /auth/protected - Protected endpoint test

Admin-Only Endpoints:

GET|POST|PUT|DELETE /users/ - User management
GET|POST|PUT|DELETE /fonds/ - General fond management
POST /admin/fonds/assign - Assign fonds to clients
GET /admin/fonds/statistics - System statistics
GET /admin/fonds/export/ownership-report - Data export

Client-Specific Endpoints:

GET|POST|PUT|DELETE /fonds/my-fonds - Personal fond management
GET /fonds/my-fonds/stats - Personal statistics

Audit Endpoints:

GET /admin/fonds/audit/recent-assignments - Assignment tracking
GET /admin/fonds/client-stats/{client_id} - Client analytics

🔒 Security Features

JWT Authentication with configurable expiration
Role-Based Access Control (RBAC) with granular permissions
Password Hashing with bcrypt
Input Validation with Pydantic schemas
SQL Injection Protection via SQLAlchemy ORM
CORS Configuration for frontend integration
Secure Headers and error handling

📈 Advanced Features
Ownership Management:

Assign fonds to specific clients
Bulk assignment operations
Transfer ownership between clients
Unassigned fond tracking

Analytics & Reporting:

Client-specific statistics
System-wide ownership analytics
Recent assignment tracking
Data export capabilities

User Experience:

Duplicate detection in forms
Real-time search suggestions
Responsive mobile interface
Comprehensive error handling
Loading states and feedback

🛠 Development Tools
Database Management:
bash# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Reset database (development only)
python create_admin_user.py reset
Code Quality:
bash# Run tests with coverage
pytest tests/ --cov=app

# Type checking (if using mypy)
mypy app/

# Code formatting (if using black)
black app/ tests/
🚀 Deployment Ready
The application includes:

Docker Compose configuration for easy deployment
Production-ready environment variable management
Database migrations for schema management
Comprehensive testing for reliability
API documentation for integration
CORS configuration for frontend deployment

👨‍💻 Author
Tony Gheorghe
📄 License
MIT License

Status: ✅ Production Ready - Complete full-stack application with modern architecture
Version: v1.0.0
Last Updated: August 2025
