from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import google.generativeai as genai
from dotenv import load_dotenv
import os
import stripe
from sqlalchemy import text
from app.routers import auth, resume, stripe
from app.database import engine, Base, init_db, SessionLocal, get_db

# Load environment variables
load_dotenv('env')

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Initialize Google Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Test database connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise e
    
    # Initialize database
    init_db()
    
    yield
    
    # Shutdown
    # Add any cleanup code here

app = FastAPI(
    title="CVPerfect API",
    description="AI-powered resume enhancement platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3004"),  # Default to port 3004 if not set
        "http://localhost:3000",  # Development port 3000
        "http://localhost:3001",  # Development port 3001
        "http://localhost:3004",  # Development port 3004
        "https://cvperfect.com",  # Production
        "https://www.cvperfect.com",  # Production with www
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Import and include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])

# Only include Stripe router if Stripe is configured
if os.getenv("STRIPE_SECRET_KEY"):
    app.include_router(stripe.router, prefix="/api/stripe", tags=["Stripe"])

@app.get("/")
async def root():
    return {"message": "Welcome to CVPerfect API"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 