"""
Configuration settings for CVPerfect backend
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./cvperfect.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External APIs
    GEMINI_API_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # Real Data Processing Settings
    USE_REAL_DATA: bool = True
    ENABLE_WEB_SCRAPING: bool = True
    ENABLE_AI_FALLBACK: bool = True
    
    # File Processing Settings
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: list = [".pdf", ".doc", ".docx", ".txt"]
    UPLOAD_DIR: str = "uploads"
    
    # AI Integration Settings (use existing Gemini)
    AI_RATE_LIMIT_PER_MINUTE: int = 60
    AI_REQUEST_TIMEOUT: int = 30
    
    # Data Source Validation
    VALIDATE_PRODUCTION_DATA: bool = True
    MOCK_DATA_ALLOWED: bool = False
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Load from environment file if it exists
        if os.path.exists("env"):
            import dotenv
            dotenv.load_dotenv("env")
            
            # Update values from env file using model_fields (new Pydantic v2 way)
            for field_name in self.model_fields.keys():
                env_value = os.getenv(field_name)
                if env_value is not None:
                    field_info = self.model_fields[field_name]
                    if field_info.annotation == bool:
                        setattr(self, field_name, env_value.lower() in ("true", "1", "yes"))
                    elif field_info.annotation == int:
                        setattr(self, field_name, int(env_value))
                    else:
                        setattr(self, field_name, env_value)
        
        # Validate production settings
        if self.ENVIRONMENT == "production":
            if not self.USE_REAL_DATA:
                raise ValueError("Production must use real data! Set USE_REAL_DATA=true")
            
            if self.MOCK_DATA_ALLOWED:
                raise ValueError("Production cannot allow mock data! Set MOCK_DATA_ALLOWED=false")
            
            if not self.GEMINI_API_KEY or self.GEMINI_API_KEY.startswith("test"):
                print("Warning: Production should use real Gemini API key!")
            
            if "sqlite" in self.DATABASE_URL.lower():
                print("Warning: Production should use PostgreSQL database!")
                
            print("Production data validation passed")
        
        # Log data source configuration
        print("Data source config:")
        print(f"   USE_REAL_DATA: {self.USE_REAL_DATA}")
        print(f"   ENVIRONMENT: {self.ENVIRONMENT}")
        print(f"   AI_ENABLED: {bool(self.GEMINI_API_KEY)}")


# Create settings instance
settings = Settings() 