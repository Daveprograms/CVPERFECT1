from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError
from .routers import auth, resume, onboarding, dashboard, billing, analytics, applications, jobs
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

# Add rate limiting middleware
from .middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

from .core.error_handlers import (
    cvperfect_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)
from .core.exceptions import CVPerfectException
from starlette.exceptions import HTTPException as StarletteHTTPException

# Add global validation error handler
app.add_exception_handler(CVPerfectException, cvperfect_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Validate production configuration on startup
@app.on_event("startup")
async def startup_event():
    print("Starting CVPerfect backend...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Real Data Enabled: {settings.USE_REAL_DATA}")
    print(f"AI Service: {'ENABLED' if settings.GEMINI_API_KEY else 'DISABLED'}")
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
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(onboarding.router, tags=["onboarding"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])

@app.get("/")
async def root():
    return {"message": "Welcome to CVPerfect API"} 