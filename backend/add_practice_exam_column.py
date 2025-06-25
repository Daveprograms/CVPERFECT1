#!/usr/bin/env python3
"""
Database migration script to add practice_exam column to resumes table
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables
load_dotenv('env')

def add_practice_exam_column():
    """Add practice_exam column to resumes table if it doesn't exist"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        # Create database engine
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            # Check if column already exists
            check_column_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'resumes' 
                AND column_name = 'practice_exam'
            """)
            
            result = connection.execute(check_column_query)
            column_exists = result.fetchone() is not None
            
            if column_exists:
                print("✅ practice_exam column already exists in resumes table")
                return True
            
            # Add the column
            add_column_query = text("""
                ALTER TABLE resumes 
                ADD COLUMN practice_exam JSON
            """)
            
            connection.execute(add_column_query)
            connection.commit()
            
            print("✅ Successfully added practice_exam column to resumes table")
            return True
            
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Adding practice_exam column to resumes table...")
    success = add_practice_exam_column()
    
    if success:
        print("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1) 