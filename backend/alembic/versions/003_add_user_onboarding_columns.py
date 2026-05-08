"""
Add onboarding columns to users (idempotent for existing Supabase schemas).

Revision ID: 003
"""
from alembic import op
from sqlalchemy import text

revision = "003_user_onboarding"
down_revision = "002_add_interview_tables"
branch_labels = None
depends_on = None

# Safe on Postgres 9.1+ / Supabase
_STEPS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE",
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS current_role VARCHAR',
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS job_search_status VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS internship_date_range VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_job_types JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS top_technologies JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS help_needed JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR",
]


def upgrade():
    conn = op.get_bind()
    for stmt in _STEPS:
        conn.execute(text(stmt))


def downgrade():
    pass
