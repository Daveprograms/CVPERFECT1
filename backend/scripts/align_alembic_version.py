"""
Align Alembic history with an existing database.

Use when the DB already has tables but Alembic isn't tracking them (missing `alembic_version`)
or is tracking the wrong revision, causing `DuplicateTable` / `DuplicateObject`.

This script is intentionally conservative:
- It does NOT drop anything.
- It only creates/updates `alembic_version`.

Typical flow for your current Supabase DB:
1) Run this script to set version to 004_password_reset (the last pre-resume-engine revision)
2) Run `python -m alembic upgrade head`
"""

from __future__ import annotations

import os
from pathlib import Path

import sqlalchemy as sa
from dotenv import load_dotenv
from sqlalchemy import text


def main() -> None:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if not url:
        raise RuntimeError("DATABASE_URL is required")

    engine = sa.create_engine(url, pool_pre_ping=True)

    # Heuristic: if these tables exist, the DB is at least past 002.
    required_tables = [
        "users",
        "resumes",
        "job_applications",
        "jobs",
        "interview_sessions",
        "interview_questions",
    ]

    with engine.begin() as conn:
        existing = {}
        for t in required_tables:
            reg = conn.execute(text("select to_regclass(:t)"), {"t": t}).scalar()
            existing[t] = bool(reg)

        print("table_presence:", existing)

        # Ensure alembic_version exists.
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)"
            )
        )

        row = conn.execute(text("select version_num from alembic_version")).fetchone()
        if row:
            print("alembic_version currently:", row[0])
            return

        # Stamp to the latest *pre-existing* revision before the new resume engine tables.
        # This matches your current repo's chain: 000 -> 001 -> 002 -> 003 -> 004.
        stamp = "004_password_reset"
        conn.execute(text("insert into alembic_version (version_num) values (:v)"), {"v": stamp})
        print("alembic_version set to:", stamp)


if __name__ == "__main__":
    main()

