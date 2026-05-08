"""
Baseline ORM schema: users, resumes, analytics, chat, watchlist, developer codes.

Creates only tables that must exist before job_applications / jobs (001).
Uses SQLAlchemy metadata + create_all(..., tables=...) so DDL stays aligned with models.

Revision ID: 000_initial_core
Revises: None
"""
from alembic import op

revision = "000_initial_core"
down_revision = None
branch_labels = None
depends_on = None

# Order respects foreign keys
_TABLE_ORDER = [
    "users",
    "resumes",
    "resume_versions",
    "resume_analyses",
    "analytics",
    "developer_codes",
    "chat_messages",
    "dream_companies",
]


def upgrade() -> None:
    from app.database import Base
    import app.models  # noqa: F401 — register all mapped tables

    bind = op.get_bind()
    tables = [Base.metadata.tables[name] for name in _TABLE_ORDER if name in Base.metadata.tables]
    Base.metadata.create_all(bind=bind, tables=tables)


def downgrade() -> None:
    from app.database import Base
    import app.models  # noqa: F401

    bind = op.get_bind()
    for name in reversed(_TABLE_ORDER):
        if name in Base.metadata.tables:
            Base.metadata.tables[name].drop(bind=bind, checkfirst=True)
