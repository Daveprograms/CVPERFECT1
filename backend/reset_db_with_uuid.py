#!/usr/bin/env python3
"""
Drop all ORM tables and recreate them (PostgreSQL only). Run from backend/.

Usage:
  python reset_db_with_uuid.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

_BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_BACKEND_ROOT))

load_dotenv(_BACKEND_ROOT / ".env")
load_dotenv(_BACKEND_ROOT / "env")


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def reset_database() -> bool:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required (PostgreSQL).")
        return False

    database_url = _normalize_url(database_url)
    if not database_url.startswith("postgresql+psycopg://"):
        print("Only PostgreSQL URLs are supported.")
        return False

    from app.database import Base
    import app.models  # noqa: F401

    try:
        engine = create_engine(database_url)
        print("Dropping all tables registered on Base.metadata...")
        Base.metadata.drop_all(bind=engine)
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("Database reset complete.")
        return True
    except Exception as e:
        print("Error resetting database:", e)
        return False


if __name__ == "__main__":
    ok = reset_database()
    sys.exit(0 if ok else 1)
