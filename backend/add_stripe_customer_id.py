#!/usr/bin/env python3
"""
Migration script to add stripe_customer_id field to User table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL
from app.models.user import User
from app.database import SessionLocal
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv('env')

def add_stripe_customer_id_field():
    """Add stripe_customer_id field to users table"""
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        # Add the column
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
            """))
            
            if not result.fetchone():
                print("Adding stripe_customer_id column to users table...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN stripe_customer_id VARCHAR UNIQUE
                """))
                conn.commit()
                print("✅ stripe_customer_id column added successfully")
            else:
                print("✅ stripe_customer_id column already exists")
                
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    add_stripe_customer_id_field() 