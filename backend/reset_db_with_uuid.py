#!/usr/bin/env python3
"""
Script to reset database with UUID schema
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv('env')

def reset_database():
    """Reset database with new UUID schema"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return False
    
    # Update URL to use psycopg instead of psycopg2
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://")
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            print("🗑️ Dropping existing tables...")
            
            # Drop tables in correct order (reverse of dependencies)
            tables_to_drop = [
                'analytics',
                'resume_versions', 
                'resumes',
                'users'
            ]
            
            for table in tables_to_drop:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
                    print(f"   ✅ Dropped {table}")
                except Exception as e:
                    print(f"   ⚠️ Could not drop {table}: {e}")
            
            conn.commit()
            print("✅ Database reset completed")
            return True
            
    except Exception as e:
        print(f"❌ Error resetting database: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Resetting database with UUID schema...")
    success = reset_database()
    if success:
        print("🎉 Database reset completed! Restart the backend to recreate tables.")
    else:
        print("💥 Database reset failed!")
        sys.exit(1) 