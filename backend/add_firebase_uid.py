#!/usr/bin/env python3
"""
Script to add firebase_uid column to users table
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv('env')

def add_firebase_uid_column():
    """Add firebase_uid column to users table if it doesn't exist"""
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
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='firebase_uid';
            """))
            
            if result.fetchone():
                print("✅ firebase_uid column already exists")
                return True
            
            # Add the column
            print("📝 Adding firebase_uid column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN firebase_uid VARCHAR UNIQUE;
            """))
            
            # Create index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_users_firebase_uid 
                ON users (firebase_uid);
            """))
            
            conn.commit()
            print("✅ Successfully added firebase_uid column")
            return True
            
    except Exception as e:
        print(f"❌ Error adding firebase_uid column: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Adding firebase_uid column to users table...")
    success = add_firebase_uid_column()
    if success:
        print("🎉 Migration completed successfully!")
    else:
        print("💥 Migration failed!")
        sys.exit(1) 