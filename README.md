# CVPerfect 🎯

An AI-powered resume enhancement platform built with **Next.js** (frontend) and **FastAPI** (backend), featuring Gemini AI integration, Stripe payments, and Firebase authentication.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Starting the App](#starting-the-app)
- [Environment Variables Reference](#environment-variables-reference)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Install the following tools **before** running any scripts:

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| Git | any | https://git-scm.com/ |

> **Windows users:** When installing Python, make sure to check **"Add Python to PATH"** in the installer.

---

## First-Time Setup

> Run this **once** after cloning the repository.

### macOS / Linux

```bash
# 1. Clone the repository
git clone <repository-url>
cd CVPERFECT1

# 2. Make scripts executable
chmod +x setup.sh start.sh

# 3. Run the setup script
./setup.sh
```

### Windows

```bat
REM 1. Clone the repository
git clone <repository-url>
cd CVPERFECT1

REM 2. Run the setup script (double-click or run in Command Prompt)
setup.bat
```

### What the setup script does

- ✅ Checks that Python and Node.js are installed
- ✅ Creates a Python virtual environment in `backend/venv/`
- ✅ Installs all Python packages from `backend/requirements.txt`
- ✅ Creates `backend/.env` from a template (if it doesn't exist)
- ✅ Creates a placeholder `backend/firebase-credentials.json`
- ✅ Installs all Node.js packages from `frontend/package.json`
- ✅ Creates `frontend/.env.local` from a template (if it doesn't exist)

---

## Configuring Secrets (Required)

After running setup, **you must fill in your API keys** before the app will work.

### 1. `backend/.env`

Open `backend/.env` and replace every value that says `YOUR_*` or `CHANGE_ME_*`:

```env
# The most critical ones:
GEMINI_API_KEY=          # Get from https://makersuite.google.com/app/apikey
STRIPE_SECRET_KEY=       # Get from https://dashboard.stripe.com/apikeys
NEXTAUTH_SECRET=         # Any long random string (run: openssl rand -hex 32)
JWT_SECRET_KEY=          # Any long random string (run: openssl rand -hex 32)
SECRET_KEY=              # Any long random string
```

### 2. `frontend/.env.local`

Open `frontend/.env.local` and fill in the same Stripe keys plus your Firebase config:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # From Stripe Dashboard
NEXT_PUBLIC_FIREBASE_API_KEY=         # From Firebase Console > Project Settings
NEXT_PUBLIC_FIREBASE_PROJECT_ID=      # Your Firebase project ID
# ... (see the file for all fields)
```

### 3. `backend/firebase-credentials.json`

Replace the placeholder with your real **Firebase Service Account** file:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Project Settings** → **Service Accounts**
3. Click **Generate new private key**
4. Rename the downloaded file to `firebase-credentials.json` and place it in the `backend/` folder

> ⚠️ **Never commit this file to Git.** It is already listed in `.gitignore`.

---

## Starting the App

> Run this **every time** you want to start the application after the initial setup.

### macOS / Linux

```bash
./start.sh
```

The script will:
1. Start the **FastAPI backend** on `http://localhost:8000`
2. Wait until the backend is healthy
3. Start the **Next.js frontend** on `http://localhost:3000`
4. Print URLs to the console

Press **Ctrl+C** to stop both services cleanly.

### Windows

```bat
start.bat
```

The script will open **two terminal windows** — one for the backend, one for the frontend — and then open your browser automatically.

To stop the app, **close both terminal windows**.

---

## Accessing the App

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For payments |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | ✅ |
| `SECRET_KEY` | App secret key | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js signing secret | ✅ |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase service account JSON | ✅ |
| `FIREBASE_API_KEY` | Firebase Web API key | ✅ |
| `SMTP_HOST` | Email SMTP host | For email features |
| `SMTP_USER` | Email address | For email features |
| `SMTP_PASSWORD` | Email app password | For email features |
| `FRONTEND_URL` | Frontend base URL (default: `http://localhost:3000`) | ✅ |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (`http://localhost:8000`) |
| `NEXTAUTH_URL` | NextAuth base URL (`http://localhost:3000`) |
| `NEXTAUTH_SECRET` | **Must match** `backend/.env` value |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_FIREBASE_*` | All Firebase config fields from Firebase Console |

---

## Project Structure

```
CVPERFECT1/
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── routers/       # API route handlers
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── services/      # Business logic & AI services
│   │   ├── core/
│   │   │   └── config.py  # App configuration (reads .env)
│   │   └── database.py    # DB connection & session
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # ⚠️ Secret — NOT committed to git
│   └── firebase-credentials.json  # ⚠️ Secret — NOT committed to git
│
├── frontend/              # Next.js 14 frontend
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable React components
│   ├── services/          # API client services
│   ├── hooks/             # Custom React hooks
│   ├── package.json       # Node.js dependencies
│   └── .env.local         # ⚠️ Secret — NOT committed to git
│
├── setup.sh               # macOS/Linux first-time setup
├── setup.bat              # Windows first-time setup
├── start.sh               # macOS/Linux start script
├── start.bat              # Windows start script
└── README.md              # This file
```

---

## Troubleshooting

### `uvicorn: command not found` (macOS/Linux)
The venv may not have been activated. Try:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### `python` not recognized (Windows)
Python was not added to PATH. Re-install Python and check **"Add Python to PATH"**, or use `python3` instead of `python`.

### Port already in use
Another process is using port 3000 or 8000. Kill it first:
```bash
# macOS/Linux — kill process on port 8000
lsof -ti:8000 | xargs kill -9

# macOS/Linux — kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

```bat
REM Windows — kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Database errors
- For **SQLite** (default): the `cvperfect.db` file is created automatically in `backend/`.
- For **PostgreSQL**: make sure your `DATABASE_URL` in `backend/.env` is correct and the database server is running.

### Frontend can't connect to backend
Make sure `NEXT_PUBLIC_API_URL=http://localhost:8000` is set in `frontend/.env.local` and the backend is running.

### Firebase authentication errors
Ensure `backend/firebase-credentials.json` contains your real service account credentials (not the placeholder), and that `FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json` is set in `backend/.env`.

---

## Generating Secure Secrets

Use these commands to generate strong random secrets:

```bash
# macOS / Linux
openssl rand -hex 32

# Python (any platform)
python -c "import secrets; print(secrets.token_hex(32))"
```

---

> 💡 **Stripe Webhook (optional for local dev):** To test Stripe webhooks locally, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
> ```bash
> stripe listen --forward-to localhost:8000/api/stripe/webhook
> ```
> The CLI will print a webhook signing secret — paste it into `STRIPE_WEBHOOK_SECRET` in `backend/.env`.