#!/usr/bin/env python3
"""
Migration script to add onboarding fields to users table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.config import settings
from app.database import get_db

def migrate_onboarding_fields():
    """Add onboarding fields to users table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Add onboarding fields
        migration_queries = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"current_role\" VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS job_search_status VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS internship_date_range VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_job_types JSONB DEFAULT '[]'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS top_technologies JSONB DEFAULT '[]'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS help_needed JSONB DEFAULT '[]'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR"
        ]
        
        for query in migration_queries:
            try:
                conn.execute(text(query))
                print(f"✅ Executed: {query}")
            except Exception as e:
                print(f"⚠️  Warning for query '{query}': {e}")
        
        conn.commit()
        print("🎉 Onboarding fields migration completed!")

if __name__ == "__main__":
    migrate_onboarding_fields() 