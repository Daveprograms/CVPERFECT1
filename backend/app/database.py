from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from 'env' file
load_dotenv('env')

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to SQLite for development if no DATABASE_URL is set
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./cvperfect.db"
    print("⚠️ No DATABASE_URL found, using SQLite for development")

# Use psycopg2 instead of psycopg
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")

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