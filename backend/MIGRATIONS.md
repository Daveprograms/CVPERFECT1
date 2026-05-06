# Database migrations (Alembic)

Schema changes are **only** applied through **Alembic**. The FastAPI app does **not** call `Base.metadata.create_all()`.

## Prerequisites

- **PostgreSQL** reachable from your machine (e.g. Supabase session pooler).
- `DATABASE_URL` in `backend/.env` (see `.env.example`). Use `postgresql://` or `postgresql+psycopg://`; the app normalizes to **psycopg v3**.

## Apply migrations

From the **`backend`** directory (where `alembic.ini` lives):

```bash
# Upgrade to latest (use `python -m alembic` if `alembic` is not on PATH)
python -m alembic upgrade head
```

Useful commands:

```bash
python -m alembic current
python -m alembic history
python -m alembic downgrade -1
```

## Revision chain

| Revision            | Purpose |
|---------------------|---------|
| `000_initial_core`  | Core tables from SQLAlchemy models (`users`, `resumes`, analyses, `analytics`, `chat_messages`, `dream_companies`, `developer_codes`, …) |
| `001_add_job_tables`| `job_applications`, `jobs` + enums |
| `002_add_interview_tables` | `interview_sessions`, `interview_questions` |
| `003_user_onboarding`    | Idempotent onboarding columns on `users` |
| `004_password_reset`     | `password_reset_token`, `password_reset_expires` on `users` |

## New environments (empty database)

1. Set `DATABASE_URL`.
2. Run `alembic upgrade head`.

Revision **000** creates baseline tables via `Base.metadata.create_all(..., tables=...)` so DDL tracks the current ORM definitions.

## Existing databases (created before `000_initial_core`)

If you already had tables from an older process and `alembic_version` points at `001_add_job_tables` (or later) **without** ever running `000`:

- You **do not** need to re-run `000` if `users` / `resumes` / etc. already exist.
- After pulling this change, run `alembic upgrade head`; Alembic applies only revisions **after** your stored version.

If you have **no** `alembic_version` row but tables already exist, align the stamp manually (example — adjust revision id to match what’s already applied):

```bash
alembic stamp 003_user_onboarding
```

Only stamp if you are sure the schema matches that revision; otherwise fix schema first, then stamp.

## Autogenerate (optional)

`alembic/env.py` sets `target_metadata = Base.metadata` so you can propose new revisions:

```bash
alembic revision --autogenerate -m "describe change"
```

Review the generated file carefully before upgrading production.




## Tests

`tests/conftest.py` still uses `Base.metadata.create_all` on a **dedicated test database** only. Production and normal local Postgres use **Alembic only**.
