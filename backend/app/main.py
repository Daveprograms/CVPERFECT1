from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError
from .routers import auth, resume, stripe, onboarding
from .database import engine, Base
import os
from .services.real_data_service import DataSourceValidator
from datetime import datetime
from sqlalchemy import text
from .database import SessionLocal
from .core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CVPerfect API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add global validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error for {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": (await request.body()).decode(errors='replace')},
    )

# Validate production configuration on startup
@app.on_event("startup")
async def startup_event():
    print("Starting CVPerfect backend...")
    
    # Validate production data configuration
    try:
        DataSourceValidator.validate_production_config()
        print("Production data validation completed")
    except Exception as e:
        print(f"Production validation failed: {e}")
        if settings.ENVIRONMENT == "production":
            raise  # Fail startup in production
        else:
            print("Continuing in development mode")
    
    # Log real data status
    print(f"Real data processing: {'ENABLED' if settings.USE_REAL_DATA else 'DISABLED'}")
    print(f"AI integration: {'ENABLED' if settings.GEMINI_API_KEY else 'DISABLED'}")
    print(f"Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")

# Add middleware to track real data usage
@app.middleware("http")
async def real_data_middleware(request: Request, call_next):
    """Middleware to ensure real data usage in production"""
    
    # Skip middleware for health checks and static files
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Add real data headers for tracking
    request.state.use_real_data = settings.USE_REAL_DATA
    request.state.environment = settings.ENVIRONMENT
    
    # Process request
    response = await call_next(request)
    
    # Add data source headers to response
    response.headers["X-Data-Source"] = "real" if settings.USE_REAL_DATA else "mock"
    response.headers["X-Environment"] = settings.ENVIRONMENT
    response.headers["X-AI-Enabled"] = "true" if settings.GEMINI_API_KEY else "false"
    
    return response

# Add health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for production monitoring"""
    
    # Check database connection
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check AI service
    ai_status = "enabled" if settings.GEMINI_API_KEY else "disabled"
    
    # Check file system
    try:
        import os
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        fs_status = "healthy"
    except Exception as e:
        fs_status = f"unhealthy: {str(e)}"
    
    health_data = {
        "status": "healthy" if db_status == "healthy" and fs_status == "healthy" else "unhealthy",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "ai_service": ai_status,
        "file_system": fs_status,
        "real_data_enabled": settings.USE_REAL_DATA,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
    
    # Return 503 if unhealthy
    status_code = 200 if health_data["status"] == "healthy" else 503
    
    return JSONResponse(content=health_data, status_code=status_code)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(stripe.router, prefix="/api/stripe", tags=["stripe"])
app.include_router(onboarding.router, tags=["onboarding"])

@app.get("/")
async def root():
    return {"message": "Welcome to CVPerfect API"} 