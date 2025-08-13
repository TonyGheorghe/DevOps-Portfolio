# Arhivare Web App

## 📌 Description
**Arhivare Web App** is a web application built with **FastAPI** and **PostgreSQL** that allows:
- Public search for archival fonds by company name
- Management of archival fonds (CRUD) via a secure API (JWT authentication)

This is the second application in the **DevOps Portfolio**, alongside [`hello-web-app`](../hello-web-app/).

## 🎯 Purpose
The goal of this application is to provide users with the contact details of institutions or companies that hold the archives of certain companies (for example, for obtaining employment history certificates).

Example:
> If a user searches for "Tractorul Brașov", the application will return the contact information of the relevant archival fonds holder, e.g., "Turbonium SRL" – address, email, phone, etc.

## 🧩 Roles
- **Public User:**
  - Can use the search function without authentication
- **Admin:**
  - Login (JWT)
  - Add, edit, delete archival fonds
  - View a list of fonds (with filters/pagination)

## 🗄️ Tech Stack
- **Backend:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL
- **ORM & Migrations:** SQLAlchemy + Alembic
- **Testing:** pytest
- **Orchestration:** Docker Compose (API + DB + Adminer)
- **CI/CD:** GitHub Actions (build, test, push image to Docker Hub)

## 📂 Project Structure
```bash
arhivare-web-app/
├── app/                 # Application source code
│   ├── api/              # API routers (auth, search, CRUD)
│   ├── core/             # Config, security, dependencies
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic DTOs
│   ├── db/               # DB connection & initialization
│   └── main.py           # Application entry point
├── alembic/              # Database migrations
├── tests/                # Tests (pytest)
├── Dockerfile
├── requirements.txt
├── .env.example
├── alembic.ini
└── README.md
```

## Environment Variables

File: .env (based on .env.example)

DATABASE_URL=postgresql+psycopg2://app:app@db:5432/arhivare
JWT_SECRET=change_me_in_local_env
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

## 🚀 Running Locally with Docker Compose

Note: The Compose file will be added later in development.

docker compose up --build

API: http://localhost:8000

Adminer (DB UI): http://localhost:8080

## ✅ MVP Endpoints

Public

GET /health — status check
GET /search?query=... — search fonds
Admin (JWT)
POST /auth/login — get token
POST /fonds — create a new fond
GET /fonds — list fonds
GET /fonds/{id} — fond details
PUT /fonds/{id} — update fond
DELETE /fonds/{id} — delete fond

Example search response:

[
  {
    "id": 42,
    "company_name": "Tractorul Brasov",
    "holder_name": "Turbonium SRL",
    "address": "Str. Example 12, Brasov",
    "email": "contact@turbonium.ro",
    "phone": "+40 722 000 000"
  }
]

🛠 Roadmap

 FastAPI skeleton + DB connection

 Initial Alembic migration (users, fonds)

 Public search endpoint

 JWT authentication + CRUD for admin

 Docker Compose (api + postgres + adminer)

 Tests + linting

 CI/CD (GitHub Actions + Docker Hub)

 VPS deployment with domain & HTTPS

Author: Tony Gheorghe
Status: In development 🚧
