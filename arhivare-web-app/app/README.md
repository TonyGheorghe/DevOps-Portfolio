# Arhivare Web App 📚

A comprehensive FastAPI-based archival fund management system with role-based access control, intelligent assignment features, and public search capabilities.

## 🚀 Overview

**Arhivare Web App** is a modern web application designed for managing archival funds (fonduri arhivistice) with advanced features like:

- **Multi-role user management** (Admin, Audit, Client)
- **Intelligent fund assignment** with similarity-based suggestions
- **Public search interface** for archive discovery
- **Comprehensive CRUD operations** with role-based permissions
- **Auto-assignment capabilities** based on company name matching
- **RESTful API** with OpenAPI documentation

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Usage Examples](#usage-examples)
9. [Development](#development)
10. [Deployment](#deployment)
11. [Contributing](#contributing)

## ✨ Features

### Core Features
- **User Authentication** - JWT-based authentication with secure password hashing
- **Role-Based Access Control** - Three distinct user roles with specific permissions
- **Fund Management** - Complete CRUD operations for archival funds
- **Public Search** - Anonymous search interface for fund discovery
- **Owner Assignment** - Manual and automatic fund assignment to clients

### Advanced Features
- **Intelligent Assignment** - AI-powered suggestions based on company name similarity
- **Bulk Operations** - Bulk assignment and management capabilities
- **Statistical Analytics** - Comprehensive ownership and assignment statistics
- **Auto-Reassignment** - Automatic reassignment detection when fund details change
- **Search & Filtering** - Advanced search with pagination and filtering options

## 🏗️ Architecture

### Technology Stack
- **Backend**: FastAPI (Python 3.8+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with bcrypt password hashing
- **Documentation**: OpenAPI/Swagger automatic documentation
- **Frontend**: Static HTML for public search interface

### Project Structure
```
arhivare-web-app/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── database.py               # Database configuration and session management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── search.py             # Public search endpoints
│   │   └── routes/
│   │       ├── users.py          # User management endpoints
│   │       ├── fonds.py          # General fund endpoints
│   │       ├── client_fonds.py   # Client-specific fund endpoints
│   │       └── admin_fonds.py    # Admin-specific fund endpoints
│   ├── core/
│   │   ├── config.py             # Application configuration
│   │   └── security.py           # Security utilities (JWT, password hashing)
│   ├── crud/
│   │   ├── fond.py               # Fund CRUD operations
│   │   └── user.py               # User CRUD operations
│   ├── models/
│   │   ├── base.py               # SQLAlchemy base class
│   │   ├── user.py               # User database model
│   │   └── fond.py               # Fund database model
│   ├── schemas/
│   │   ├── user.py               # User Pydantic schemas
│   │   └── fond.py               # Fund Pydantic schemas
│   ├── services/
│   │   └── assignment_service.py # Advanced assignment logic
│   └── static/
│       └── index.html            # Public search interface
├── requirements.txt              # Python dependencies
└── .env                         # Environment variables
```

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip (Python package installer)

### Step-by-Step Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd arhivare-web-app
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL database:**
```sql
CREATE DATABASE arhivare_db;
CREATE USER arhivare_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE arhivare_db TO arhivare_user;
```

5. **Configure environment variables:**
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://arhivare_user:your_password@localhost/arhivare_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

6. **Initialize database:**
```bash
python -c "from app.database import create_tables; create_tables()"
```

7. **Create admin user:**
```bash
python scripts/create_admin_user.py
```

8. **Run the application:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT token generation | Yes | - |
| `JWT_ALGORITHM` | JWT algorithm | No | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes | No | 60 |
| `ADMIN_USERNAME` | Default admin username | No | admin |
| `ADMIN_PASSWORD` | Default admin password | No | admin123 |

### Database Configuration

The application uses SQLAlchemy with PostgreSQL. Connection pooling is configured for production use:

```python
# Connection pool settings
pool_size=5
max_overflow=10
pool_recycle=3600
pool_pre_ping=True
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client',
    company_name VARCHAR(255),
    contact_email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fonds Table
```sql
CREATE TABLE fonds (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    email VARCHAR(100),
    phone VARCHAR(20),
    notes TEXT,
    source_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships
- **One-to-Many**: User → Fonds (owner relationship)
- **Foreign Key**: `fonds.owner_id` → `users.id`

## 📖 API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

### Interactive Documentation
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Response:**
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

#### Protected Requests
Include the JWT token in the Authorization header:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Main Endpoints

#### Public Search
```http
GET /search?query=brasov&limit=20&skip=0
```

#### User Management
```http
GET /users                    # List users (admin/audit only)
POST /users                   # Create user (admin only)
GET /users/{user_id}          # Get user details
PUT /users/{user_id}          # Update user
DELETE /users/{user_id}       # Delete user (admin only)
```

#### Fund Management
```http
GET /fonds                    # List funds (role-based filtering)
POST /fonds                   # Create fund
GET /fonds/{fond_id}          # Get fund details
PUT /fonds/{fond_id}          # Update fund
DELETE /fonds/{fond_id}       # Delete fund
```

#### Client-Specific Endpoints
```http
GET /fonds/my-fonds           # Get client's own funds
POST /fonds/my-fonds          # Create fund for client
GET /fonds/my-fonds/stats     # Get client statistics
```

#### Admin-Specific Endpoints
```http
GET /admin/fonds              # Get all funds with owner info
POST /admin/fonds/{fond_id}/assign-owner   # Manual assignment
GET /admin/users/clients      # Get all client users
GET /admin/fonds/statistics/ownership      # Ownership statistics
```

## 👥 User Roles & Permissions

### Admin Role
- **Full system access** - All CRUD operations
- **User management** - Create, update, delete users
- **Fund assignment** - Manual and bulk assignment capabilities
- **System statistics** - Access to all analytics and reports
- **Bulk operations** - Mass assignment and management tools

### Audit Role
- **Read-only access** - View all funds and users
- **No modifications** - Cannot create, update, or delete
- **Full visibility** - Can see ownership assignments
- **Reporting access** - Can view statistics and analytics

### Client Role
- **Own funds only** - Limited to assigned funds
- **CRUD operations** - Can manage their own funds
- **Profile management** - Can update own profile
- **Statistics access** - Personal statistics only

## 🔧 Usage Examples

### Creating a New Fund (Admin)
```python
import requests

# Login as admin
login_response = requests.post("http://localhost:8000/auth/login", 
    json={"username": "admin", "password": "admin123"})
token = login_response.json()["access_token"]

# Create fund with owner assignment
fund_data = {
    "company_name": "Example Archive SA",
    "holder_name": "Biblioteca Nationala",
    "address": "Bucuresti, Sector 1",
    "email": "contact@example.ro",
    "phone": "+40 123 456 789",
    "notes": "Archive important documents",
    "active": True,
    "owner_id": 2  # Assign to client with ID 2
}

headers = {"Authorization": f"Bearer {token}"}
response = requests.post("http://localhost:8000/fonds", 
    json=fund_data, headers=headers)
```

### Searching for Funds (Public)
```python
import requests

# Public search - no authentication required
response = requests.get("http://localhost:8000/search?query=brasov&limit=10")
results = response.json()

for fund in results:
    print(f"Company: {fund['company_name']}")
    print(f"Holder: {fund['holder_name']}")
    print(f"Address: {fund['address']}")
    print("---")
```

### Getting Assignment Suggestions (Admin)
```python
import requests

# Get suggestions for fund assignment
headers = {"Authorization": f"Bearer {admin_token}"}
response = requests.get(
    f"http://localhost:8000/fonds/{fund_id}/reassignment-suggestions",
    headers=headers
)

suggestions = response.json()
if suggestions["suggestions"]:
    best_match = suggestions["best_match"]
    print(f"Best match: {best_match['username']} ({best_match['similarity']:.2%})")
```

## 🧪 Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

### Code Quality
```bash
# Install development dependencies
pip install black isort flake8

# Format code
black app/
isort app/

# Check code quality
flake8 app/
```

### Database Migrations
For database schema changes, consider using Alembic:
```bash
pip install alembic
alembic init migrations
alembic revision --autogenerate -m "Add new field"
alembic upgrade head
```

## 🚀 Deployment

### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/arhivare_db
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=arhivare_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Production Deployment
1. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. Set up reverse proxy with Nginx
3. Configure HTTPS with Let's Encrypt
4. Set up database backups and monitoring

## 🔐 Security Considerations

### Authentication & Authorization
- **JWT tokens** with configurable expiration
- **Bcrypt password hashing** with salt
- **Role-based access control** for all endpoints
- **Input validation** using Pydantic schemas

### Data Protection
- **SQL injection protection** via SQLAlchemy ORM
- **CORS configuration** for cross-origin requests
- **Environment variable** protection for secrets
- **Database connection pooling** for performance

## 📊 Monitoring & Analytics

### Health Checks
```http
GET /health
```

Returns application and database status.

### Statistics Endpoints
- `/fonds/stats/count` - Fund statistics
- `/users/stats` - User statistics  
- `/admin/fonds/statistics/ownership` - Ownership analytics

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** a Pull Request

### Code Standards
- Follow **PEP 8** style guidelines
- Write **comprehensive tests** for new features
- Update **documentation** for API changes
- Use **type hints** for better code clarity

## 📝 API Response Examples

### Fund Response
```json
{
    "id": 1,
    "company_name": "Example Archive SA",
    "holder_name": "Biblioteca Nationala",
    "address": "Bucuresti, Sector 1",
    "email": "contact@example.ro",
    "phone": "+40 123 456 789",
    "notes": "Important documents archive",
    "source_url": "https://example.ro",
    "active": true,
    "owner_id": 2,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "owner": {
        "id": 2,
        "username": "client1",
        "company_name": "Client Company SRL"
    }
}
```

### Assignment Suggestions Response
```json
{
    "fond_id": 1,
    "fond_name": "Example Archive SA",
    "suggestions": [
        {
            "user_id": 2,
            "username": "client1",
            "company_name": "Example Company SRL",
            "similarity": 0.85,
            "confidence": "high",
            "match_type": "strong"
        }
    ],
    "best_match": {
        "user_id": 2,
        "username": "client1",
        "similarity": 0.85,
        "confidence": "high"
    },
    "requires_confirmation": true
}
```

## 📞 Support

For support and questions:
- **Documentation**: Check the `/docs` endpoint for interactive API documentation
- **Issues**: Report bugs and feature requests on the repository issues page
- **Development**: Follow the contributing guidelines for development setup

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

### Upcoming Features
- [ ] **Advanced Search** - Full-text search with Elasticsearch
- [ ] **File Upload** - Document attachment capabilities
- [ ] **Audit Logs** - Comprehensive action logging
- [ ] **Email Notifications** - Assignment and update notifications
- [ ] **API Rate Limiting** - Request throttling for public endpoints
- [ ] **Multi-language Support** - Internationalization
- [ ] **Data Export** - CSV/Excel export capabilities
- [ ] **Advanced Analytics** - Dashboard with charts and metrics

### Performance Improvements
- [ ] **Redis Caching** - Cache frequently accessed data
- [ ] **Background Tasks** - Async processing with Celery
- [ ] **Database Indexing** - Optimize query performance
- [ ] **API Pagination** - Cursor-based pagination for large datasets

---

**Built with ❤️ using FastAPI and modern Python technologies.**
