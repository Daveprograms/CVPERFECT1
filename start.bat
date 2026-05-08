@echo off
REM =============================================================
REM  CVPerfect — Start Script  (Windows)
REM  Run this every time you want to start the application.
REM =============================================================

setlocal EnableDelayedExpansion

echo.
echo ==========================================
echo   CVPerfect -- Starting Application
echo ==========================================
echo.

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM ── Sanity checks ────────────────────────────────────────────
if not exist "backend\.env" (
    echo [ERROR] backend\.env not found. Run setup.bat first.
    pause & exit /b 1
)
if not exist "backend\venv\" (
    echo [ERROR] Python venv not found. Run setup.bat first.
    pause & exit /b 1
)
if not exist "frontend\node_modules\" (
    echo [ERROR] Node modules not found. Run setup.bat first.
    pause & exit /b 1
)

REM ── Start Backend ─────────────────────────────────────────────
echo [INFO] Starting FastAPI backend on http://localhost:8000 ...
cd /d "%ROOT%backend"
call venv\Scripts\activate.bat

start "CVPerfect Backend" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo [OK] Backend window opened.

REM Wait a few seconds for backend to start
echo [INFO] Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM ── Start Frontend ────────────────────────────────────────────
echo [INFO] Starting Next.js frontend on http://localhost:3000 ...
cd /d "%ROOT%frontend"

start "CVPerfect Frontend" cmd /k "npm run dev"
echo [OK] Frontend window opened.

REM Wait for frontend
timeout /t 3 /nobreak >nul

REM ── Open browser ─────────────────────────────────────────────
echo [INFO] Opening browser...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

REM ── Summary ───────────────────────────────────────────────────
echo.
echo ================================================================
echo   CVPerfect is running!
echo.
echo   Frontend  -^> http://localhost:3000
echo   Backend   -^> http://localhost:8000
echo   API Docs  -^> http://localhost:8000/docs
echo.
echo   Two terminal windows have opened — one for each service.
echo   Close those windows to stop the services.
echo ================================================================
echo.
pause
