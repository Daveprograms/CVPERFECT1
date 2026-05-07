"""
Add resumes.processing_status_at for correct analyze in-flight stale detection.

Without this, stuck processing_status='analyzing' uses upload_date age and can block
new analyses for up to 45 minutes after upload even when analysis crashed immediately.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def main() -> None:
    backend_root = Path(__file__).resolve().parents[1]
    load_dotenv(backend_root / ".env")

    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError("DATABASE_URL is not set in backend/.env")

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    engine = create_engine(url)

    stmts = [
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_status_at TIMESTAMPTZ",
        # Backfill: approximate last activity from upload time for existing rows.
        """UPDATE resumes
           SET processing_status_at = upload_date
           WHERE processing_status_at IS NULL AND upload_date IS NOT NULL""",
        # Wedged "analyzing" rows: mark timestamp old so stale logic allows retry immediately.
        """UPDATE resumes
           SET processing_status_at = NOW() - INTERVAL '2 hours'
           WHERE processing_status IS NOT NULL
             AND lower(trim(processing_status)) = 'analyzing'""",
    ]

    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))

    print("ok")


if __name__ == "__main__":
    main()
