# CVPerfect 🎯

An AI-powered resume enhancement platform — **Next.js** frontend + **FastAPI** backend + **PostgreSQL**, all running with a single Docker Compose command.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Configuring Secrets](#configuring-secrets)
- [Daily Usage](#daily-usage)
- [Accessing the App](#accessing-the-app)
- [Manual Setup (no Docker)](#manual-setup-no-docker)
- [Environment Variables Reference](#environment-variables-reference)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|---------|
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop/ |
| **Git** | any | https://git-scm.com/ |

> That's it. Docker Desktop bundles Docker Engine + Docker Compose together.  
> You do **not** need Python or Node.js installed on your machine.

---

## Quick Start (Docker)

### Step 1 — Clone the repo

```bash
git clone <repository-url>
cd CVPERFECT1
```

### Step 2 — Create your `.env` file

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

Open `.env` and fill in your API keys (see [Configuring Secrets](#configuring-secrets) below).

### Step 3 — Add Firebase credentials

Place your Firebase service account JSON file at:

```
backend/firebase-credentials.json
```

> Get it from: **Firebase Console → Project Settings → Service Accounts → Generate new private key**

### Step 4 — Build and start everything

```bash
docker compose up --build
```

This will:
- Build the backend and frontend Docker images
- Start a PostgreSQL database
- Start the FastAPI backend (waits until DB is ready)
- Start the Next.js frontend (waits until backend is healthy)

The **first build** takes 3–5 minutes. Subsequent starts take ~10 seconds.

---

## Configuring Secrets

Open `.env` (in the project root) and replace all `YOUR_*` / `CHANGE_ME_*` values:

### Mandatory

| Key | How to get it |
|-----|--------------|
| `NEXTAUTH_SECRET` | Run: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_SECRET_KEY` | Same command above (use a different value) |
| `SECRET_KEY` | Same command above (use a different value) |
| `GEMINI_API_KEY` | https://makersuite.google.com/app/apikey |

### Payments (Stripe) — skip if not using payments

| Key | Where to find it |
|-----|-----------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | See tip at the bottom |

### Firebase

| Key | Where to find it |
|-----|-----------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings → Your apps → Web app config |

> **Generate secrets quickly:**
> ```bash
> # macOS / Linux
> openssl rand -hex 32
>
> # Any platform (Python)
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## Daily Usage

```bash
# Start the app
docker compose up

# Start in the background (detached)
docker compose up -d

# View logs
docker compose logs -f

# Stop the app
docker compose down

# Stop and wipe the database (fresh start)
docker compose down -v

# Rebuild after code changes
docker compose up --build
```

---

## Accessing the App

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

---

## Manual Setup (no Docker)

If you prefer to run without Docker, use the included shell scripts.

### Prerequisites (manual setup only)

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |

### macOS / Linux

```bash
# First time only
chmod +x setup.sh start.sh
./setup.sh

# Every time after
./start.sh
```

### Windows

```bat
REM First time only
setup.bat

REM Every time after
start.bat
```

After running the setup script, fill in:
- `backend/.env` — all API keys
- `frontend/.env.local` — Stripe + Firebase config
- `backend/firebase-credentials.json` — real Firebase service account file

---

## Environment Variables Reference

### Root `.env` (used by Docker Compose)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PASSWORD` | Password for the local PostgreSQL container | ✅ |
| `NEXTAUTH_SECRET` | NextAuth signing secret | ✅ |
| `JWT_SECRET_KEY` | JWT signing secret | ✅ |
| `SECRET_KEY` | App secret key | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe server-side key | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key | Payments |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config fields | Auth |
| `SMTP_*` | Email sending config | Email features |

---

## Project Structure

```
CVPERFECT1/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # App entry point
│   │   ├── routers/                # API route handlers
│   │   ├── models/                 # SQLAlchemy database models
│   │   ├── services/               # Business logic & AI
│   │   └── core/config.py          # Reads .env settings
│   ├── Dockerfile                  # Backend container image
│   ├── requirements.txt
│   ├── .env                        # ⚠️ Not committed — secrets
│   └── firebase-credentials.json   # ⚠️ Not committed — secrets
│
├── frontend/                       # Next.js 14 frontend
│   ├── app/                        # Next.js App Router pages
│   ├── components/
│   ├── Dockerfile                  # Frontend container image
│   ├── next.config.js
│   └── package.json
│
├── docker-compose.yml              # ← Run with this
├── docker-compose.prod.yml         # Production compose (CI/CD)
├── .env.example                    # Copy to .env and fill in
├── setup.sh / setup.bat            # Manual setup scripts
├── start.sh  / start.bat           # Manual start scripts
└── README.md
```

---

## Troubleshooting

### Docker build fails for frontend (`COPY --from=builder /app/.next/standalone`)
The Next.js standalone build requires `output: 'standalone'` in `next.config.js`. This is already set — if you see this error, make sure you haven't accidentally reverted that config.

### `Port 3000/8000 already in use`
Stop whatever is using the port, then retry:
```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```
```bat
REM Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Backend can't connect to database
The backend waits for PostgreSQL to be healthy before starting. If it still fails, check that `DATABASE_PASSWORD` in `.env` matches what the `db` service uses. Try `docker compose logs db`.

### Frontend shows "Failed to fetch" errors
The frontend talks to the backend via `http://localhost:8000`. Make sure both containers are running: `docker compose ps`.

### Firebase authentication errors
Ensure `backend/firebase-credentials.json` is your **real** service account JSON (not the placeholder). The file must exist before running `docker compose up --build`.

---

> 💡 **Stripe Webhooks (local dev):** Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
> ```bash
> stripe listen --forward-to localhost:8000/api/stripe/webhook
> ```
> Copy the printed webhook secret into `STRIPE_WEBHOOK_SECRET` in `.env`, then restart with `docker compose up`.