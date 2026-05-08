#!/usr/bin/env bash
# =============================================================
#  CVPerfect — Start Script  (macOS / Linux)
#  Run this every time you want to start the application.
# =============================================================

set -e

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
NC="\033[0m"

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     CVPerfect — Starting Application     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Sanity checks ────────────────────────────────────────────
[ -f "backend/.env" ]      || error "backend/.env not found. Run ./setup.sh first."
[ -d "backend/venv" ]      || error "Python venv not found. Run ./setup.sh first."
[ -d "frontend/node_modules" ] || error "Node modules not found. Run ./setup.sh first."

# ── Start Backend ─────────────────────────────────────────────
info "Starting FastAPI backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate

# Run in background, log to file
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/cvperfect_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/cvperfect_backend.pid
success "Backend started (PID $BACKEND_PID). Logs → /tmp/cvperfect_backend.log"

# ── Wait for backend to be ready ─────────────────────────────
info "Waiting for backend to be ready..."
MAX_WAIT=30
COUNT=0
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_WAIT ]; then
        warn "Backend did not respond within ${MAX_WAIT}s. Check /tmp/cvperfect_backend.log"
        break
    fi
done
[ $COUNT -lt $MAX_WAIT ] && success "Backend is healthy ✓"

# ── Start Frontend ────────────────────────────────────────────
echo ""
info "Starting Next.js frontend on http://localhost:3000 ..."
cd "$SCRIPT_DIR/frontend"

# Run in background, log to file
npm run dev > /tmp/cvperfect_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/cvperfect_frontend.pid
success "Frontend started (PID $FRONTEND_PID). Logs → /tmp/cvperfect_frontend.log"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  CVPerfect is running!                               ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Frontend  → http://localhost:3000                   ║${NC}"
echo -e "${GREEN}║  Backend   → http://localhost:8000                   ║${NC}"
echo -e "${GREEN}║  API Docs  → http://localhost:8000/docs              ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop both services.                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Graceful shutdown on Ctrl+C ──────────────────────────────
cleanup() {
    echo ""
    info "Shutting down CVPerfect..."
    kill "$BACKEND_PID"  2>/dev/null && success "Backend stopped."
    kill "$FRONTEND_PID" 2>/dev/null && success "Frontend stopped."
    rm -f /tmp/cvperfect_backend.pid /tmp/cvperfect_frontend.pid
    echo -e "${GREEN}Goodbye!${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Keep script alive until user kills it
wait
