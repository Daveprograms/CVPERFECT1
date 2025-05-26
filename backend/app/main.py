from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, resume, stripe
from .database import engine, Base
import os

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

# Include routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(stripe.router)

@app.get("/")
async def root():
    return {"message": "Welcome to CVPerfect API"} 