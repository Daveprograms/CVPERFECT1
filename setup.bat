@echo off
REM =============================================================
REM  CVPerfect — First-Time Setup Script  (Windows)
REM  Run this ONCE when you first clone the repository.
REM =============================================================

setlocal EnableDelayedExpansion

echo.
echo ==========================================
echo   CVPerfect -- First-Time Setup (Windows)
echo ==========================================
echo.

REM ── Locate repo root ─────────────────────────────────────────
set "ROOT=%~dp0"
cd /d "%ROOT%"

REM ── 1. Check prerequisites ────────────────────────────────────
echo [INFO] Checking prerequisites...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 not found. Download from https://www.python.org/downloads/
    echo         Make sure to check "Add Python to PATH" during installation.
    pause & exit /b 1
)

for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [INFO] Found %PYVER%

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org/ (v18+)
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODEVER=%%v
echo [INFO] Found Node.js %NODEVER%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. It usually ships with Node.js.
    pause & exit /b 1
)
echo [OK] All prerequisites found.

REM ── 2. Backend — Python virtual environment ───────────────────
echo.
echo [INFO] Setting up Python virtual environment...
cd /d "%ROOT%backend"

if not exist "venv\" (
    python -m venv venv
    echo [OK] Virtual environment created.
) else (
    echo [WARN] Virtual environment already exists -- skipping.
)

call venv\Scripts\activate.bat

echo [INFO] Installing Python dependencies...
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo [OK] Python dependencies installed.

REM ── 3. Backend — Environment file ────────────────────────────
echo.
if not exist ".env" (
    echo [INFO] Creating backend\.env from template...
    (
        echo # ── Authentication
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_SECRET=CHANGE_ME_generate_a_long_random_string
        echo.
        echo # ── Backend / Frontend URLs
        echo BACKEND_URL=http://localhost:8000
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # ── Database (SQLite works out of the box)
        echo DATABASE_URL=sqlite:///./cvperfect.db
        echo # For PostgreSQL: DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
        echo.
        echo # ── AI (Google Gemini)
        echo GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
        echo.
        echo # ── Stripe Payments
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
        echo STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
        echo STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
        echo STRIPE_PRO_MONTHLY_PRICE_ID=YOUR_STRIPE_PRICE_ID
        echo STRIPE_ONE_TIME_PRICE_ID=YOUR_STRIPE_ONE_TIME_PRICE_ID
        echo.
        echo # ── JWT Security
        echo JWT_SECRET_KEY=CHANGE_ME_generate_a_64_char_hex_string
        echo JWT_SECRET=CHANGE_ME_generate_a_64_char_hex_string
        echo SECRET_KEY=CHANGE_ME_generate_a_64_char_hex_string
        echo.
        echo # ── Firebase
        echo FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
        echo FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        echo.
        echo # ── Email (SMTP)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your_email@gmail.com
        echo SMTP_PASSWORD=your_app_password
        echo SMTP_FROM=your_email@gmail.com
        echo.
        echo # ── Developer Access
        echo DEVELOPER_CODE=CVPERFECT2024
        echo.
        echo # ── Supabase (optional)
        echo SUPABASE_URL=YOUR_SUPABASE_URL
        echo SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
    ) > .env
    echo [OK] backend\.env created. Fill in all YOUR_* values before starting.
) else (
    echo [WARN] backend\.env already exists -- skipping.
)

REM Firebase credentials placeholder
if not exist "firebase-credentials.json" (
    echo [INFO] Creating placeholder firebase-credentials.json...
    (
        echo {
        echo   "_comment": "Replace this file with your real Firebase service account JSON",
        echo   "type": "service_account",
        echo   "project_id": "YOUR_PROJECT_ID"
        echo }
    ) > firebase-credentials.json
    echo [WARN] firebase-credentials.json placeholder created. Replace with real credentials.
) else (
    echo [WARN] firebase-credentials.json already exists -- skipping.
)

if not exist "uploads\" mkdir uploads
echo [OK] Uploads directory ready.

REM ── 4. Frontend — Node dependencies ──────────────────────────
echo.
echo [INFO] Installing frontend Node.js dependencies...
cd /d "%ROOT%frontend"
call npm install
echo [OK] Frontend dependencies installed.

REM Frontend .env.local
if not exist ".env.local" (
    echo [INFO] Creating frontend\.env.local from template...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_SECRET=CHANGE_ME_generate_a_long_random_string
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
        echo STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
        echo STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
        echo STRIPE_PRO_MONTHLY_PRICE_ID=YOUR_STRIPE_PRICE_ID
        echo STRIPE_ONE_TIME_PRICE_ID=YOUR_STRIPE_ONE_TIME_PRICE_ID
        echo NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
        echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
        echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
        echo NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    ) > .env.local
    echo [OK] frontend\.env.local created. Fill in all YOUR_* values.
) else (
    echo [WARN] frontend\.env.local already exists -- skipping.
)

REM ── 5. Done ──────────────────────────────────────────────────
echo.
echo ================================================================
echo   Setup complete! Next steps:
echo.
echo   1. Fill in ALL api keys and secrets in:
echo        backend\.env
echo        frontend\.env.local
echo   2. Replace backend\firebase-credentials.json with your real
echo      Firebase service account file (from Firebase Console).
echo   3. Run start.bat to launch the application.
echo ================================================================
echo.
pause
