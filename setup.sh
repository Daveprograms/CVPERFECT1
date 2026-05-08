#!/usr/bin/env bash
# =============================================================
#  CVPerfect — First-Time Setup Script  (macOS / Linux)
#  Run this ONCE when you first clone the repository.
# =============================================================

set -e  # exit immediately on error

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m"  # No Color

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     CVPerfect — First-Time Setup         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 0. Locate the repo root ──────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Working directory: $SCRIPT_DIR"

# ── 1. Check prerequisites ───────────────────────────────────
info "Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || error "Python 3 is required. Download from https://www.python.org/downloads/"
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
info "Python version: $PYTHON_VERSION"

command -v node >/dev/null 2>&1 || error "Node.js is required. Download from https://nodejs.org/ (v18+)"
NODE_VERSION=$(node --version)
info "Node.js version: $NODE_VERSION"

command -v npm >/dev/null 2>&1 || error "npm is required (comes with Node.js)."
success "All prerequisites found."

# ── 2. Backend — Python virtual environment ──────────────────
echo ""
info "Setting up Python virtual environment..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    success "Virtual environment created."
else
    warn "Virtual environment already exists — skipping creation."
fi

# Activate venv
source venv/bin/activate

info "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
success "Python dependencies installed."

# ── 3. Backend — Environment file ────────────────────────────
echo ""
if [ ! -f ".env" ]; then
    info "Creating backend/.env from template..."
    cat > .env <<'EOF'
# ── Authentication ───────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=CHANGE_ME_generate_a_long_random_string

# ── Backend API ──────────────────────────────────────────────
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# ── Database ─────────────────────────────────────────────────
# Default: local SQLite (works out of the box)
DATABASE_URL=sqlite:///./cvperfect.db

# For PostgreSQL / Supabase (optional):
# DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# ── AI (Google Gemini) ───────────────────────────────────────
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# ── Stripe Payments ──────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID=YOUR_STRIPE_PRICE_ID
STRIPE_ONE_TIME_PRICE_ID=YOUR_STRIPE_ONE_TIME_PRICE_ID

# ── JWT Security ─────────────────────────────────────────────
JWT_SECRET_KEY=CHANGE_ME_generate_a_64_char_hex_string
JWT_SECRET=CHANGE_ME_generate_a_64_char_hex_string
SECRET_KEY=CHANGE_ME_generate_a_64_char_hex_string

# ── Firebase ─────────────────────────────────────────────────
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY

# ── Email (SMTP) ─────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com

# ── Developer Access ─────────────────────────────────────────
DEVELOPER_CODE=CVPERFECT2024

# ── Supabase (optional) ───────────────────────────────────────
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
EOF
    success "backend/.env created. Please fill in all YOUR_* values before starting."
else
    warn "backend/.env already exists — skipping."
fi

# Firebase credentials placeholder
if [ ! -f "firebase-credentials.json" ]; then
    info "Creating placeholder firebase-credentials.json..."
    cat > firebase-credentials.json <<'EOF'
{
  "_comment": "Replace this file with your real Firebase service account JSON from Firebase Console > Project Settings > Service Accounts",
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "YOUR_PRIVATE_KEY",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
EOF
    warn "firebase-credentials.json placeholder created. Replace with your real credentials from Firebase Console."
else
    warn "firebase-credentials.json already exists — skipping."
fi

# Create uploads directory
mkdir -p uploads
success "Uploads directory ready."

# ── 4. Frontend — Node dependencies ──────────────────────────
echo ""
info "Installing frontend Node.js dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install
success "Frontend dependencies installed."

# Frontend .env.local
if [ ! -f ".env.local" ]; then
    info "Creating frontend/.env.local from template..."
    cat > .env.local <<'EOF'
# ── Backend API URL ──────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000

# ── NextAuth ─────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=CHANGE_ME_generate_a_long_random_string

# ── Stripe ───────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID=YOUR_STRIPE_PRICE_ID
STRIPE_ONE_TIME_PRICE_ID=YOUR_STRIPE_ONE_TIME_PRICE_ID

# ── Firebase ─────────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
EOF
    success "frontend/.env.local created. Fill in all YOUR_* values."
else
    warn "frontend/.env.local already exists — skipping."
fi

# ── 5. Done ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup complete! Next steps:                         ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  1. Fill in ALL api keys & secrets in:               ║${NC}"
echo -e "${GREEN}║       backend/.env                                   ║${NC}"
echo -e "${GREEN}║       frontend/.env.local                            ║${NC}"
echo -e "${GREEN}║  2. Replace backend/firebase-credentials.json        ║${NC}"
echo -e "${GREEN}║     with your real Firebase service account file.    ║${NC}"
echo -e "${GREEN}║  3. Run ./start.sh to launch the application.        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
