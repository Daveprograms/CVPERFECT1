"""
Add password reset token columns to users.

Revision ID: 004
"""
from alembic import op
from sqlalchemy import text

revision = "004_password_reset"
down_revision = "003_user_onboarding"
branch_labels = None
depends_on = None

_STEPS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP",
    "CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)",
]


def upgrade():
    conn = op.get_bind()
    for stmt in _STEPS:
        conn.execute(text(stmt))


def downgrade():
    pass
