# Arhivare Web App 🏛️

> **Aplicație web modernă pentru căutarea și managementul fondurilor arhivistice româneşti cu sistem avansat de ownership și role-based access control**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📌 Descriere

Arhivare Web App este o aplicație web completă care permite:

- **🔍 Căutare publică** de fonduri arhivistice după numele companiei
- **👥 Management utilizatori** cu sistem avansat de roluri (Admin, Audit, Client)
- **📁 Management fonduri** cu sistem de ownership și assignment inteligent
- **🤖 Auto-reassignment** cu detectarea automată a schimbărilor de deținător
- **🎨 Interface modern React** cu TypeScript, Tailwind CSS și design responsiv
- **🔒 Autentificare JWT** cu control de acces bazat pe roluri

## 🎯 Scopul Aplicației

Aplicația ajută utilizatorii să găsească informațiile de contact ale instituțiilor care dețin arhivele unor companii românești (pentru obținerea de adeverințe de vechime în muncă, certificate, etc.).

**Exemplu:** Dacă cauți "Tractorul Brașov", aplicația va returna contactul "Arhiva Națională Brașov" cu adresa, email-ul și telefonul.

## 🏗️ Arhitectura Aplicației

### Backend (FastAPI)
```
app/
├── api/                      # API endpoints
│   ├── auth.py              # Autentificare JWT
│   ├── search.py            # Căutare publică
│   └── routes/              # Rute organizate pe module
│       ├── admin_fonds.py   # Management admin cu ownership
│       ├── client_fonds.py  # Endpoint-uri pentru clienți
│       ├── fonds.py         # Management general fonduri
│       └── users.py         # Management utilizatori
├── core/                    # Configurație și securitate
│   ├── config.py           # Setări aplicație
│   └── security.py         # JWT și criptare parole
├── models/                  # Modele SQLAlchemy
│   ├── user.py             # Model utilizator cu roluri extinse
│   └── fond.py             # Model fond cu owner relationship
├── schemas/                 # Scheme Pydantic pentru validare
│   ├── user.py             # Schema utilizator cu extended fields
│   └── fond.py             # Schema fond cu owner assignment
├── crud/                   # Operații CRUD cu business logic
│   ├── user.py            # CRUD utilizatori cu role validation
│   └── fond.py            # CRUD fonduri cu ownership management
├── services/              # Business logic services
│   └── assignment_service.py  # Auto-assignment și similarity matching
└── main.py               # Aplicația FastAPI principală
```

### Frontend (React + TypeScript)
```
react-frontend/
├── src/
│   ├── components/
│   │   ├── AuthSystem.tsx        # Sistem complet de autentificare
│   │   ├── HomePage.tsx          # Pagina principală cu căutare
│   │   ├── AdminDashboard.tsx    # Dashboard pentru administratori
│   │   ├── AuditDashboard.tsx    # Dashboard pentru audit (read-only)
│   │   ├── ClientDashboard.tsx   # Dashboard pentru clienți
│   │   ├── ReassignmentModal.tsx # Modal pentru confirmarea reassignment-urilor
│   │   ├── forms/               # Formulare avansate
│   │   │   ├── FondForm.tsx    # Formular fond cu owner assignment
│   │   │   └── UserForm.tsx    # Formular utilizator cu role validation
│   │   └── pages/              # Pagini complete
│   │       ├── UsersPage.tsx   # Management utilizatori
│   │       └── UserProfile.tsx # Profil utilizator cu schimbare parolă
│   ├── services/              # Servicii API
│   │   └── api.ts            # Client API centralizat
│   └── types/               # Tipuri TypeScript
│       └── index.ts        # Definițiile de tipuri comune
└── package.json           # Dependințe Node.js
```

## 🧩 Sistem de Roluri Avansat

| Rol | Descriere | Permisiuni |
|-----|-----------|------------|
| **Admin** | Administrator sistem | ✅ Management complet utilizatori și fonduri<br>✅ Assignment fonduri către clienți<br>✅ Auto-reassignment și bulk operations<br>✅ Export și statistici<br>✅ Acces la toate dashboard-urile |
| **Audit** | Utilizator de monitorizare | ✅ Vizualizare toate datele (read-only)<br>✅ Export și rapoarte avansate<br>✅ Statistici și analiză ownership<br>❌ Fără modificări |
| **Client** | Client cu fonduri assignate | ✅ Management fonduri proprii<br>✅ Adăugare fonduri noi<br>✅ Căutare publică<br>❌ Fără acces la fondurile altor clienți |

## 🚀 Funcționalități Avansate

### 🤖 Auto-Reassignment Inteligent
- **Detectare automată** a schimbărilor de holder_name
- **Similarity matching** cu algoritm de comparare avansat
- **Sugestii de reassignment** cu confidence score
- **Bulk reassignment** pentru operații în masă
- **Confirmări manuale** pentru siguranță

### 🔍 Căutare și Filtrare
- **Căutare publică** fără autentificare
- **Full-text search** în numele companiei și deținătorului
- **Filtrare după owner** pentru administratori
- **Paginație** și sortare inteligentă
- **Export date** în multiple formate

### 📊 Dashboard-uri Specializate
- **Admin Dashboard**: Management complet cu ownership assignment
- **Audit Dashboard**: Vizualizare și monitorizare cu statistici avansate
- **Client Dashboard**: Interface simplificat pentru management fonduri proprii

## 🚀 Setup Dezvoltare

### Cerințe Sistem

- **Docker** și **Docker Compose** (obligatoriu pentru backend)
- **Node.js 18+** și **npm** (pentru frontend)
- **Git** pentru clonarea repository-ului
- **Python 3.11+** (opțional, pentru dezvoltarea locală)

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
docker-compose up -d api db adminer

# Verifică că serviciile rulează
docker-compose ps
```

**Verifică că backend-ul funcționează:**
- API: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Adminer: http://localhost:8080

#### 4. Setup Database și Date Demo

```bash
# Rulează migrațiile și creează datele demo
chmod +x setup-database.sh
./setup-database.sh
```

#### 5. Setup și Pornire Frontend

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

După rularea setup-ului:

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
2. Testează management fonduri și utilizatori
3. Testează crearea de fonduri noi cu assignment
4. Testează funcționalitatea de auto-reassignment
5. Verifică bulk operations și statistici

### 👁️ Dashboard Audit
1. Login cu `audit_user` / `Audit1234`
2. Vizualizează toate fondurile (read-only)
3. Testează exportul de date
4. Verifică statisticile de ownership și rapoartele

### 👤 Dashboard Client
1. Login cu `client_brasov` / `Client1234`
2. Vezi doar fondurile assignate
3. Testează editarea fondurilor proprii
4. Verifică că nu poți accesa fondurile altor clienți
5. Testează adăugarea de fonduri noi

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
# Backend Management
docker-compose up api db adminer         # Start backend services
docker-compose down                      # Stop services
docker-compose logs api                  # Vezi log-uri API
docker-compose exec api bash             # Conectează la container API

# Database Operations
docker-compose exec api alembic upgrade head     # Aplică migrații
docker-compose exec api alembic revision --autogenerate -m "Message"  # Creează migrație
docker-compose exec api python create_admin_user.py  # Recreează date demo

# Frontend Development
cd react-frontend
npm start                                # Development server
npm run build                            # Build pentru producție
npm test                                 # Rulează teste

# Database Management
./setup-database.sh                      # Setup complet database cu date demo
```

### Hot Reload & Development

- **Frontend**: Modificările în `react-frontend/src/` se reîncarcă automat
- **Backend**: Docker container-ul are volume mount, modificările se reîncarcă automat
- **Database**: Datele persistă în Docker volume

## 🧪 Testare

```bash
# Testare automată backend
docker-compose exec api python -m pytest tests/ -v

# Teste specifice  
docker-compose exec api python -m pytest tests/test_auth.py -v
docker-compose exec api python -m pytest tests/test_search.py -v
docker-compose exec api python -m pytest tests/test_ownership.py -v

# Cu coverage
docker-compose exec api python -m pytest tests/ --cov=app --cov-report=html

# Frontend testing
cd react-frontend
npm test
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

### 1. Environment Variables
- Schimbă `JWT_SECRET` cu o cheie securizată (32+ caractere)
- Configurează `DATABASE_URL` pentru DB de producție
- Setează parole sigure pentru admin

### 2. Frontend Build
```bash
cd react-frontend
npm run build
# Servește folder-ul build/ cu nginx sau alt web server
```

### 3. Backend Deploy
```bash
# Folosește imaginea Docker din Dockerfile
docker build -t arhivare-api .

# Sau folosește docker-compose pentru producție
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Database Setup
```bash
# Rulează migrațiile în producție
docker exec <container> alembic upgrade head

# Creează admin user
docker exec <container> python create_admin_user.py
```

### 5. Security Checklist
- [ ] JWT secret securizat
- [ ] HTTPS activat
- [ ] CORS configurat pentru domeniul de producție
- [ ] Backup-uri database
- [ ] Monitoring și logging
- [ ] Rate limiting

## 🔧 Troubleshooting

### Backend nu pornește
```bash
# Verifică log-urile
docker-compose logs api

# Restart clean
docker-compose down -v
docker-compose up -d db
sleep 10
docker-compose up api
```

### Frontend nu se conectează la API
- Verifică că backend-ul rulează pe port 8000
- Verifică proxy-ul din `package.json`
- Verifică CORS în backend

### Database connection errors
```bash
# Verifică că PostgreSQL rulează
docker-compose ps

# Reset database complet
docker-compose down -v
./setup-database.sh
```

### Auto-reassignment nu funcționează
- Verifică că utilizatorii client au `company_name` setat
- Verifică log-urile pentru erori de similarity matching
- Testează cu `handleBulkCheckReassignments` din admin dashboard

### Port-uri ocupate
```bash
# Verifică ce rulează pe port-uri
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Adminer

# Oprește servicii care folosesc port-urile
docker-compose down
```

## 📊 Monitorizare și Statistici

### Health Checks
- Backend: `GET /health`
- Database: Verificat automat în Docker
- Frontend: Build status și hot reload

### Metrici Disponibile
- Numărul total de fonduri (active/inactive)
- Statistici de assignment (assigned/unassigned)
- Distribuția pe clienți
- Rate-ul de reassignment automat
- Utilizatori pe roluri

### Logging
```bash
# Vezi toate log-urile
docker-compose logs -f

# Log-uri specifice
docker-compose logs -f api      # Backend logs
docker-compose logs -f db       # Database logs
```

## 🎯 Roadmap și Features Viitoare

### 🔄 V1.1 - Îmbunătățiri Ownership
- [ ] Ownership history și audit trail
- [ ] Bulk reassignment cu preview
- [ ] Advanced similarity algorithms
- [ ] Notification system pentru assignments

### 📊 V1.2 - Analytics și Raportare
- [ ] Advanced reporting dashboard
- [ ] Export în Excel/PDF
- [ ] Custom filtering și search
- [ ] Performance metrics

### 🔒 V1.3 - Security și Compliance
- [ ] Two-factor authentication
- [ ] Role-based field permissions
- [ ] Activity logging și audit
- [ ] GDPR compliance features

### 🌐 V1.4 - API și Integrații
- [ ] Public API cu rate limiting
- [ ] Webhooks pentru notifications
- [ ] Third-party integrations
- [ ] Mobile-responsive improvements

## 🤝 Contributing

### Development Setup
1. Fork repository-ul
2. Creează branch pentru feature: `git checkout -b feature/amazing-feature`
3. Commit schimbările: `git commit -m 'Add amazing feature'`
4. Push branch-ul: `git push origin feature/amazing-feature`
5. Deschide Pull Request

### Code Style
- **Backend**: Follow PEP 8 pentru Python
- **Frontend**: Prettier și ESLint pentru TypeScript/React
- **Database**: Snake_case pentru tabele și coloane
- **API**: RESTful conventions

### Testing
- Scrie teste pentru funcționalități noi
- Menține coverage-ul > 80%
- Testează manual toate rolurile de utilizator

## 📄 Licență

Acest proiect este dezvoltat ca aplicație demo pentru portofoliu și nu este licențiat pentru uz comercial.

## 👨‍💻 Autor

**Tony Gheorghe**
- 🎯 **DevOps Portfolio Application**
- 🏗️ **Full-Stack Development cu FastAPI + React**
- 🔧 **Docker & PostgreSQL Expert**
- 📧 **Contact**: tony.gheorghe@icloud.com

---

## 🎉 Status Actual

✅ **Complet Funcțional și Testat**
- Backend FastAPI cu autentificare JWT și role-based access
- Frontend React cu TypeScript și design responsive modern
- Căutare publică funcțională cu paginație
- 3 tipuri de dashboard-uri specializate (Admin/Audit/Client)
- Management utilizatori cu validări complete
- Sistema de ownership cu auto-reassignment inteligent
- Formulare avansate cu validări și duplicate detection
- Export date și statistici comprehensive
- Securitate și validări implementate

**Tehnologii**: FastAPI + React + TypeScript + PostgreSQL + Docker  
**Status**: ✅ Ready for Production  
**Versiune**: v1.1  
**Ultima actualizare**: 24 August 2025

---

*Pentru întrebări sau suport tehnic, consultă documentația API la http://localhost:8000/docs sau contactează dezvoltatorul.*i
