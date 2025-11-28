# Backend Setup Instructions

## Python Version Compatibility

This project now uses **Python 3.13** compatible dependencies.

### Key Changes:
- ✅ Updated `pydantic` to 2.10.3 (Python 3.13 compatible)
- ✅ Replaced `psycopg2-binary` with `psycopg[binary]` v3.2.3 (Python 3.13 compatible)
- ✅ Updated all dependencies to latest compatible versions

## Setup Steps

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cvperfect

# Firebase
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
FIREBASE_API_KEY=your_firebase_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxx
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxx

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Redis (Optional - caching works without it)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Frontend
FRONTEND_URL=http://localhost:3000

# Other
UPLOAD_DIR=./uploads
ENVIRONMENT=development
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Run Tests

```bash
# Run all tests
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test files
pytest tests/unit/test_exceptions.py -v
pytest tests/unit/test_rate_limit.py -v
pytest tests/unit/test_cache.py -v
```

### 6. Start the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Important Notes

### Database Connection String Change

If you're migrating from `psycopg2`, update your `DATABASE_URL`:

**Old format (psycopg2):**
```
postgresql://user:password@localhost:5432/dbname
```

**New format (psycopg3):**
```
postgresql://user:password@localhost:5432/dbname
```

The format is the same, but psycopg3 uses a different driver internally.

### Code Changes Required

If you have existing code using `psycopg2`, you may need to update imports:

**Before:**
```python
import psycopg2
```

**After:**
```python
import psycopg  # psycopg3
```

However, since we're using SQLAlchemy, most code should work without changes.

## Troubleshooting

### Issue: `pytest: command not found`

**Solution:** Make sure you've activated the virtual environment:
```bash
source venv/bin/activate
```

### Issue: Database connection errors

**Solution:** 
1. Ensure PostgreSQL is running
2. Check your `DATABASE_URL` in `.env`
3. Verify database exists: `createdb cvperfect`

### Issue: Redis connection errors

**Solution:** 
- If you don't have Redis, set `REDIS_ENABLED=false` in `.env`
- The app will work fine without Redis (caching will be disabled)

### Issue: Import errors

**Solution:** Reinstall dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## What Was Fixed

1. ✅ **Router Consolidation** - Removed duplicate `/api/stripe` router
2. ✅ **Analytics Registration** - Registered analytics router
3. ✅ **Error Handling** - Standardized error responses
4. ✅ **Rate Limiting** - Added per-IP rate limiting
5. ✅ **Redis Caching** - Implemented caching with fallback
6. ✅ **Testing** - Comprehensive unit tests

## Next Steps

1. Review the API documentation at http://localhost:8000/docs
2. Test the endpoints
3. Check rate limiting headers in responses
4. Review test coverage report in `htmlcov/index.html`
