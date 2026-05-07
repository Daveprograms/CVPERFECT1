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
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP",
        "CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)",
    ]

    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))

    print("ok")


if __name__ == "__main__":
    main()

