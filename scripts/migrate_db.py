#!/usr/bin/env python3
"""
Database Migration Script
Handles database schema migrations and data updates
"""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base, engine
from backend.app.models import user, resume, analytics  # Import all models
from backend.app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create all database tables"""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def migrate_user_schema():
    """Migrate user table schema changes"""
    logger.info("Checking user table migrations...")
    
    with engine.connect() as conn:
        # Check if firebase_uid column exists
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='firebase_uid'
            """))
            
            if not result.fetchone():
                logger.info("Adding firebase_uid column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR"))
                conn.commit()
                logger.info("Added firebase_uid column")
        except Exception as e:
            logger.error(f"Error checking firebase_uid column: {e}")
        
        # Check if stripe_customer_id column exists
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='stripe_customer_id'
            """))
            
            if not result.fetchone():
                logger.info("Adding stripe_customer_id column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR"))
                conn.commit()
                logger.info("Added stripe_customer_id column")
        except Exception as e:
            logger.error(f"Error checking stripe_customer_id column: {e}")

def migrate_resume_schema():
    """Migrate resume table schema changes"""
    logger.info("Checking resume table migrations...")
    
    with engine.connect() as conn:
        # Check if practice_exam_data column exists
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='resumes' AND column_name='practice_exam_data'
            """))
            
            if not result.fetchone():
                logger.info("Adding practice_exam_data column to resumes table...")
                conn.execute(text("ALTER TABLE resumes ADD COLUMN practice_exam_data JSONB"))
                conn.commit()
                logger.info("Added practice_exam_data column")
        except Exception as e:
            logger.error(f"Error checking practice_exam_data column: {e}")

def update_subscription_types():
    """Update existing subscription types to new format"""
    logger.info("Updating subscription types...")
    
    with engine.connect() as conn:
        try:
            # Update old subscription types to new format
            conn.execute(text("""
                UPDATE users 
                SET subscription_type = 'free' 
                WHERE subscription_type IS NULL OR subscription_type = ''
            """))
            
            conn.execute(text("""
                UPDATE users 
                SET subscription_status = 'active' 
                WHERE subscription_status IS NULL OR subscription_status = ''
            """))
            
            conn.commit()
            logger.info("Updated subscription types successfully")
        except Exception as e:
            logger.error(f"Error updating subscription types: {e}")

def cleanup_orphaned_data():
    """Clean up orphaned data and inconsistencies"""
    logger.info("Cleaning up orphaned data...")
    
    with engine.connect() as conn:
        try:
            # Remove resume analyses without corresponding resumes
            result = conn.execute(text("""
                DELETE FROM resume_analyses 
                WHERE resume_id NOT IN (SELECT id FROM resumes)
            """))
            logger.info(f"Removed {result.rowcount} orphaned resume analyses")
            
            # Remove analytics data for deleted users
            result = conn.execute(text("""
                DELETE FROM user_analytics 
                WHERE user_id NOT IN (SELECT id FROM users)
            """))
            logger.info(f"Removed {result.rowcount} orphaned analytics records")
            
            conn.commit()
            logger.info("Cleanup completed successfully")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

def create_indexes():
    """Create database indexes for better performance"""
    logger.info("Creating database indexes...")
    
    with engine.connect() as conn:
        try:
            # Index on user email for faster login
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"))
            
            # Index on resume user_id for faster queries
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id)"))
            
            # Index on resume upload_date for sorting
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_resumes_upload_date ON resumes(upload_date)"))
            
            # Index on analytics user_id and date
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON user_analytics(user_id, created_at)"))
            
            conn.commit()
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

def verify_database():
    """Verify database integrity and structure"""
    logger.info("Verifying database structure...")
    
    with engine.connect() as conn:
        try:
            # Check table existence
            tables = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)).fetchall()
            
            table_names = [table[0] for table in tables]
            required_tables = ['users', 'resumes', 'resume_analyses', 'user_analytics']
            
            for table in required_tables:
                if table in table_names:
                    logger.info(f"✓ Table {table} exists")
                else:
                    logger.error(f"✗ Table {table} missing")
            
            # Check user count
            user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            logger.info(f"Total users: {user_count}")
            
            # Check resume count
            resume_count = conn.execute(text("SELECT COUNT(*) FROM resumes")).scalar()
            logger.info(f"Total resumes: {resume_count}")
            
            logger.info("Database verification completed")
        except Exception as e:
            logger.error(f"Error during verification: {e}")

def main():
    """Run all migrations"""
    logger.info("Starting database migration...")
    
    try:
        # Create tables if they don't exist
        create_tables()
        
        # Run schema migrations
        migrate_user_schema()
        migrate_resume_schema()
        
        # Update data
        update_subscription_types()
        
        # Clean up orphaned data
        cleanup_orphaned_data()
        
        # Create indexes
        create_indexes()
        
        # Verify everything is working
        verify_database()
        
        logger.info("Database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 