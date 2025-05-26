from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from 'env' file
load_dotenv('env')

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

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
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Update password column to be nullable
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN password DROP NOT NULL;
        """))
        conn.commit() 