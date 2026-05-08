#!/usr/bin/env python3
"""
Migration script to add onboarding fields to users table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

from app.database import engine


def migrate_onboarding_fields():
    """Add onboarding fields to users table"""
    with engine.begin() as conn:
        # Add onboarding fields
        migration_queries = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"current_role\" VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS job_search_status VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS internship_date_range VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_job_types JSONB DEFAULT '[]'::jsonb",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS top_technologies JSONB DEFAULT '[]'::jsonb",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS help_needed JSONB DEFAULT '[]'::jsonb",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR"
        ]
        
        for query in migration_queries:
            try:
                conn.execute(text(query))
                print(f"OK: {query}")
            except Exception as e:
                print(f"WARN: {query!r}: {e}")
        print("Onboarding fields migration finished.")

if __name__ == "__main__":
    migrate_onboarding_fields() 