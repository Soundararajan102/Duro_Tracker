# Duro Tracker 🚚

Duro Tracker is a multi-tenant B2B delivery management system designed for gas agencies, wholesalers, and distributors. It provides a complete SaaS workflow for Super Admins (Platform Owners), Tenant Admins (Agency Owners), and Drivers (Field Staff).

## 🏗️ Architecture

- **Backend**: FastAPI (Python), PostgreSQL, Alembic, SQLAlchemy. Manages multi-tenancy and JWT authentication.
- **Frontend**: React Native with Expo and NativeWind (Tailwind CSS for React Native).
- **Deployment**: Docker Compose and Caddy (Reverse Proxy + Rate Limiting).

---

## 🚀 Quick Start Guide

### Prerequisites
Before you begin, ensure you have the following installed:
1. **Node.js** (v18+)
2. **Python 3.12+**
3. **uv** (Extremely fast Python package installer and resolver)
4. **PostgreSQL** (Running locally on port `5432` with user `postgres` and password `postgres`)
5. **Expo Go** (Installed on your iOS or Android device for testing)

---

### 1. Start the Backend (API)

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

**Install dependencies using `uv`:**
```bash
uv pip install -r requirements.txt
```

**Initialize the Database:**
Create the PostgreSQL database and run the migrations:
```bash
# Apply Alembic schema migrations
uv run alembic upgrade head

# Seed the database with the default Super Admin, Tenant Admin, and Driver (Recommended)
uv run python seed.py
```

**Run the API Server:**
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The backend API is now running at `http://localhost:8000`. You can view the automatic interactive API documentation at `http://localhost:8000/docs`.

---

### 2. Start the Frontend (React Native / Expo)

Open a **new** terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

**Install dependencies:**
```bash
npm install
```

**Run the Expo bundler:**
```bash
npx expo start -c
```
- A QR code will appear in your terminal.
- Open the **Expo Go** app on your phone and scan the QR code.
- *Note: Ensure your phone and computer are on the same Wi-Fi network.*

---

## 🔑 Test Credentials

If you ran `uv run python seed.py` during setup, your local database is populated with the following test credentials:

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `password123` | Platform owner, sees all organizations. |
| **Tenant Admin** | `admin` | `password123` | Gas agency owner, manages drivers and inventory. |
| **Driver** | `driver1` | `password123` | Field staff, logs deliveries on the road. |

---

## 📦 Production Deployment

For production, the project utilizes Docker and Caddy for reverse proxying and rate limiting to protect the login API.

```bash
# Build and run the containers
docker-compose up -d --build
```
This will spin up the backend instances behind the Caddy load balancer. Ensure you have properly configured the `.env` variables before deploying.
