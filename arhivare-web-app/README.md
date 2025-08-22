# Arhivare Web App 🏛️

> **Aplicație web modernă pentru căutarea și managementul fondurilor arhivistice româneşti**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## 📌 Descriere

Arhivare Web App este o aplicație web completă care permite:

- **🔍 Căutare publică** de fonduri arhivistice după numele companiei
- **👥 Management utilizatori** cu roluri diferite (Admin, Audit, Client)
- **📁 Management fonduri** cu sistem de ownership și assignment
- **🎨 Interface modern React** cu TypeScript și Tailwind CSS
- **🔒 Autentificare JWT** cu control de acces bazat pe roluri

## 🎯 Scopul Aplicației

Aplicația ajută utilizatorii să găsească informațiile de contact ale instituțiilor care dețin arhivele unor companii românești (pentru obținerea de adeverințe de vechime în muncă, certificate, etc.).

**Exemplu:** Dacă cauți "Tractorul Brașov", aplicația va returna contactul "Arhiva Națională Brașov" cu adresa, email-ul și telefonul.

## 🧩 Roluri de Utilizator

| Rol | Descriere | Permisiuni |
|-----|-----------|------------|
| **Admin** | Administrator sistem | ✅ Management complet utilizatori și fonduri<br>✅ Assignment fonduri către clienți<br>✅ Export și statistici |
| **Audit** | Utilizator de monitorizare | ✅ Vizualizare toate datele (read-only)<br>✅ Export și rapoarte<br>❌ Fără modificări |
| **Client** | Client cu fonduri assignate | ✅ Management fonduri proprii<br>✅ Căutare publică<br>❌ Fără acces la alte fonduri |

## 🚀 Setup Dezvoltare

### Cerințe Sistem

- **Docker** și **Docker Compose** (obligatoriu pentru backend)
- **Node.js 18+** și **npm** (pentru frontend)
- **Git** pentru clonarea repository-ului

### Pașii de Setup

#### 1. Clonează Repository-ul

```bash
git clone <repository-url>
cd arhivare-web-app
```

#### 2. Configurează Environment

```bash
# Copiază fișierul de configurare
cp .env.example .env

# Editează .env dacă este necesar (opțional pentru dezvoltare locală)
```

#### 3. Pornește Backend cu Docker

```bash
# Pornește serviciile backend (API + Database + Adminer)
docker-compose up api db adminer

# Sau în background
docker-compose up -d api db adminer
```

**Verifică că backend-ul funcționează:**
- API: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Adminer: http://localhost:8080

#### 4. Setup și Pornire Frontend

```bash
# Navighează la directorul frontend
cd react-frontend

# Instalează dependințele
npm install

# Pornește development server-ul (într-un terminal nou)
npm start
```

**Verifică că frontend-ul funcționează:**
- Frontend: http://localhost:3000

#### 5. Creează Date Demo (Opțional)

```bash
# Execută scriptul pentru date demo
docker-compose exec api python create_admin_user.py
```

## 🌐 Accesare Aplicație

După setup, aplicația va fi disponibilă la:

| Serviciu | URL | Descriere |
|----------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal React |
| **Backend API** | http://localhost:8000 | API FastAPI |
| **API Docs** | http://localhost:8000/docs | Documentație Swagger Interactive |
| **Adminer** | http://localhost:8080 | Management bază de date PostgreSQL |

### Conectare Adminer
- **Server**: `db`
- **Username**: `app`
- **Password**: `app`
- **Database**: `arhivare`

## 🔐 Conturi Demo

După rularea scriptului de date demo:

| Rol | Username | Parolă | Descriere |
|-----|----------|--------|-----------|
| Admin | `admin` | `admin123` | Acces complet sistem |
| Audit | `audit_user` | `Audit1234` | Read-only cu rapoarte |
| Client | `client_brasov` | `Client1234` | Fonduri Brașov |
| Client | `client_cluj` | `Client1234` | Fonduri Cluj |
| Client | `client_bucuresti` | `Client1234` | Fonduri București |

## 📊 Testare Funcționalități

### 🔍 Căutare Publică (Fără Login)
1. Accesează http://localhost:3000
2. Caută termeni precum: "Tractorul", "Brașov", "Steagul Roșu"
3. Verifică rezultatele cu contact detaliat

### 👨‍💼 Dashboard Admin
1. Login cu `admin` / `admin123`
2. Accesează management fonduri și utilizatori
3. Testează crearea de fonduri noi
4. Testează assignment fonduri către clienți

### 👁️ Dashboard Audit
1. Login cu `audit_user` / `Audit1234`
2. Vizualizează toate fondurile (read-only)
3. Testează exportul de date
4. Verifică statisticile și rapoartele

### 👤 Dashboard Client
1. Login cu `client_brasov` / `Client1234`
2. Vezi doar fondurile assignate
3. Testează editarea fondurilor proprii
4. Verifică că nu poți accesa fondurile altor clienți

## 🛠️ Dezvoltare

### Structura Workflow

```bash
# Terminal 1: Backend
docker-compose up api db adminer

# Terminal 2: Frontend  
cd react-frontend
npm start

# Terminal 3: Development commands (opțional)
docker-compose logs -f api  # Vezi log-urile API
```

### Comenzi Utile

```bash
# Backend
docker-compose up api db adminer         # Start backend services
docker-compose down                      # Stop services
docker-compose logs api                  # Vezi log-uri API
docker-compose exec api bash             # Conectează la container API
docker-compose exec api python create_admin_user.py  # Creează date demo

# Frontend
cd react-frontend
npm start                                # Development server
npm run build                            # Build pentru producție
npm test                                 # Rulează teste

# Database
docker-compose exec api alembic upgrade head     # Aplică migrații
docker-compose exec api alembic revision --autogenerate -m "Message"  # Creează migrație
```

### Hot Reload & Development

- **Frontend**: Modificările în `react-frontend/src/` se reîncarcă automat
- **Backend**: Docker container-ul are volume mount, modificările se reîncarcă automat
- **Database**: Datele persistă în Docker volume

## 🗂️ Structura Proiect

```
arhivare-web-app/
├── app/                          # Backend FastAPI
│   ├── api/                      # API routes
│   │   ├── auth.py               # Autentificare JWT  
│   │   ├── search.py             # Căutare publică
│   │   └── routes/               # Rute organizate
│   │       ├── fonds.py          # Management fonduri generale
│   │       ├── client_fonds.py   # Endpoint-uri clienți
│   │       ├── admin_fonds.py    # Management ownership
│   │       └── users.py          # Management utilizatori
│   ├── core/                     # Config și securitate
│   ├── models/                   # Modele SQLAlchemy
│   ├── schemas/                  # Scheme Pydantic
│   ├── crud/                     # Operații DB
│   └── main.py                   # App FastAPI
├── react-frontend/               # Frontend React
│   ├── src/
│   │   ├── components/           # Componente React
│   │   │   ├── AuthSystem.tsx    # Sistem autentificare
│   │   │   ├── HomePage.tsx      # Pagina principală
│   │   │   ├── AdminDashboard.tsx# Dashboard admin
│   │   │   ├── AuditDashboard.tsx# Dashboard audit  
│   │   │   ├── ClientDashboard.tsx# Dashboard client
│   │   │   ├── forms/            # Formulare
│   │   │   └── pages/            # Pagini
│   │   ├── services/             # Servicii API
│   │   └── types/                # Tipuri TypeScript
│   └── package.json              # Dependințe Node.js
├── alembic/                      # Migrații DB
├── tests/                        # Teste automate
├── docker-compose.yml            # Configurare Docker
├── requirements.txt              # Dependințe Python
├── .env.example                  # Template configurare
└── create_admin_user.py          # Script date demo
```

## 🧪 Testare

```bash
# Testare automată
docker-compose exec api python -m pytest tests/ -v

# Teste specifice  
docker-compose exec api python -m pytest tests/test_auth.py -v
docker-compose exec api python -m pytest tests/test_search.py -v
docker-compose exec api python -m pytest tests/test_fonds_api.py -v

# Cu coverage
docker-compose exec api python -m pytest tests/ --cov=app --cov-report=html
```

## 🔧 Troubleshooting

### Backend nu pornește
```bash
# Verifică log-urile
docker-compose logs api

# Restart clean
docker-compose down
docker-compose up api db adminer
```

### Frontend nu se conectează la API
- Verifică că backend-ul rulează pe port 8000
- Verifică că `REACT_APP_API_URL` din `package.json` proxy pointează corect

### Database connection errors
```bash
# Verifică că PostgreSQL rulează
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d db
# Apoi pornește api
```

### Port-uri ocupate
```bash
# Verifică ce rulează pe port-uri
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Adminer
```

## 📋 Environment Configuration

Fișierul `.env` (bazat pe `.env.example`):

```env
# Database Configuration
DATABASE_URL=postgresql+psycopg2://app:app@db:5432/arhivare

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin Bootstrap
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 🚀 Deploy to Production

Pentru deployment în producție:

1. **Environment Variables**:
   - Schimbă `JWT_SECRET` cu o cheie securizată
   - Configurează `DATABASE_URL` pentru DB de producție
   - Setează parole sigure

2. **Frontend Build**:
   ```bash
   cd react-frontend
   npm run build
   # Servește folder-ul build/ cu un web server
   ```

3. **Backend Deploy**:
   - Folosește imaginea Docker din `Dockerfile`
   - Configurează reverse proxy (nginx)
   - Setează HTTPS și CORS pentru domeniul de producție

## 🎯 Status Actual

✅ **Funcțional și Testat**
- Backend FastAPI cu autentificare JWT completă
- Frontend React cu TypeScript și design responsive  
- Căutare publică funcțională
- 3 tipuri de dashboard-uri role-based
- Management utilizatori și fonduri
- Sistem de ownership și assignment
- Validări și securitate implementate

## 👨‍💻 Autor

**Tony Gheorghe**
- DevOps Portfolio Application
- Arhivare Web App v1.0.0

---

**Tehnologii**: FastAPI + React + PostgreSQL + Docker  
**Status**: ✅ Ready for Development & Production  
**Ultima actualizare**: August 2025
