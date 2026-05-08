from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import importlib.util
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    if importlib.util.find_spec("psycopg2"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif importlib.util.find_spec("psycopg"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    else:
        raise RuntimeError(
            "PostgreSQL driver not found. Install either 'psycopg2-binary' or 'psycopg[binary]'."
        )

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def init_db():
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Check if users table exists and has password column
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'password';
            """))
            column_info = result.fetchone()
            
            # If password column exists and is not nullable, make it nullable
            if column_info and column_info[1] == 'NO':
                conn.execute(text("""
                    ALTER TABLE users 
                    ALTER COLUMN password DROP NOT NULL;
                """))
                conn.commit()
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise e 