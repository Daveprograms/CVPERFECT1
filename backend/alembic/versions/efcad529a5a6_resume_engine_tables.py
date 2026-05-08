"""resume engine tables

Revision ID: efcad529a5a6
Revises: 004_password_reset
Create Date: 2026-05-07 01:47:54.727128

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'efcad529a5a6'
down_revision: Union[str, None] = '004_password_reset'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    resumevariantkind = postgresql.ENUM(
        "master",
        "enhanced",
        "tailored",
        "manual_edit",
        name="resumevariantkind",
        create_type=False,
    )
    exportformat = postgresql.ENUM(
        "pdf",
        "docx",
        "txt",
        "json",
        name="exportformat",
        create_type=False,
    )
    exportstatus = postgresql.ENUM(
        "queued",
        "rendering",
        "done",
        "failed",
        name="exportstatus",
        create_type=False,
    )
    airunkind = postgresql.ENUM(
        "resume_analyze",
        "resume_enhance",
        "resume_tailor",
        "resume_parse",
        "cover_letter_outline",
        "cover_letter_write",
        "learning_path",
        "practice_exam",
        "job_match",
        "interview_question",
        "interview_feedback",
        "chat",
        name="airunkind",
        create_type=False,
    )
    airunstatus = postgresql.ENUM(
        "queued",
        "running",
        "succeeded",
        "failed",
        "timeout",
        "rate_limited",
        name="airunstatus",
        create_type=False,
    )
    crediteventkind = postgresql.ENUM(
        "grant",
        "consume",
        "refund",
        "expire",
        "adjust",
        name="crediteventkind",
        create_type=False,
    )
    bgjobstatus = postgresql.ENUM(
        "queued",
        "running",
        "succeeded",
        "failed",
        "retrying",
        "cancelled",
        name="bgjobstatus",
        create_type=False,
    )

    for enum_t in (
        resumevariantkind,
        exportformat,
        exportstatus,
        airunkind,
        airunstatus,
        crediteventkind,
        bgjobstatus,
    ):
        enum_t.create(bind, checkfirst=True)

    # --- resumes: add structured document + immutable source text split ---
    # Add columns idempotently. `batch_alter_table.add_column` isn't IF NOT EXISTS on Postgres,
    # so we use safe DDL for existing databases.
    op.execute("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS source_text TEXT")
    op.execute("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS document_json JSONB")
    op.execute("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64)")
    op.execute("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ")

    # Backfill `source_text` from legacy `content` if present.
    op.execute(
        sa.text(
            "UPDATE resumes SET source_text = content WHERE source_text IS NULL AND content IS NOT NULL"
        )
    )

    op.create_index(
        "ix_resumes_user_content_hash_active",
        "resumes",
        ["user_id", "content_hash"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    # --- templates + themes ---
    op.create_table(
        "resume_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tier_required", sa.String(length=32), nullable=False, server_default=sa.text("'free'")),
        sa.Column("layout_engine", sa.String(length=32), nullable=False),
        sa.Column("layout_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("preview_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("slug", name="uq_resume_templates_slug"),
    )

    op.create_table(
        "resume_themes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("palette", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["template_id"], ["resume_templates.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("template_id", "slug", name="uq_resume_themes_template_slug"),
    )
    op.create_index("ix_resume_themes_template_id", "resume_themes", ["template_id"])

    # --- job descriptions (for tailoring + ATS scoring) ---
    op.create_table(
        "job_descriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("structured", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("text_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "text_hash", name="uq_job_descriptions_user_hash"),
    )
    op.create_index("ix_job_descriptions_user_id", "job_descriptions", ["user_id"])

    # --- resume variants (versions + per-job tailoring) ---
    op.create_table(
        "resume_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("job_description_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("kind", resumevariantkind, nullable=False),
        sa.Column("label", sa.String(length=128), nullable=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("content_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ai_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_variant_id"], ["resume_variants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["job_description_id"], ["job_descriptions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["template_id"], ["resume_templates.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["theme_id"], ["resume_themes.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("resume_id", "version_number", name="uq_resume_variants_resume_version"),
    )
    op.create_index("ix_resume_variants_resume_id", "resume_variants", ["resume_id"])
    op.create_index("ix_resume_variants_job_description_id", "resume_variants", ["job_description_id"])
    op.create_index(
        "uq_resume_variants_current_per_resume",
        "resume_variants",
        ["resume_id"],
        unique=True,
        postgresql_where=sa.text("is_current = true"),
    )

    # --- exports (artifacts in object storage) ---
    op.create_table(
        "resume_exports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resume_variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("format", exportformat, nullable=False),
        sa.Column("status", exportstatus, nullable=False, server_default=sa.text("'queued'")),
        sa.Column("storage_key", sa.Text(), nullable=True),
        sa.Column("byte_size", sa.Integer(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_variant_id"], ["resume_variants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["resume_templates.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["theme_id"], ["resume_themes.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "resume_variant_id",
            "format",
            "template_id",
            "theme_id",
            name="uq_resume_exports_variant_format_template_theme",
        ),
    )
    op.create_index("ix_resume_exports_user_time", "resume_exports", ["user_id", "requested_at"])

    # --- AI runs (auditable LLM calls) ---
    op.create_table(
        "ai_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", airunkind, nullable=False),
        sa.Column("status", airunstatus, nullable=False, server_default=sa.text("'queued'")),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("prompt_hash", sa.String(length=64), nullable=False),
        sa.Column("request_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("response_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Numeric(10, 6), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("resume_variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("job_description_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("background_job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["resume_variant_id"], ["resume_variants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["job_description_id"], ["job_descriptions.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_ai_runs_user_time", "ai_runs", ["user_id", "created_at"])
    op.create_index("ix_ai_runs_kind_time", "ai_runs", ["kind", "created_at"])

    # --- credit ledger ---
    op.create_table(
        "credit_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", crediteventkind, nullable=False),
        sa.Column("feature", sa.String(length=64), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=128), nullable=True),
        sa.Column("related_ai_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_resume_variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_export_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_ai_run_id"], ["ai_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_resume_variant_id"], ["resume_variants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_export_id"], ["resume_exports.id"], ondelete="SET NULL"),
        sa.CheckConstraint("balance_after >= 0", name="ck_credit_ledger_nonneg"),
    )
    op.create_index(
        "ix_credit_ledger_user_feature_time",
        "credit_ledger",
        ["user_id", "feature", "occurred_at"],
    )

    # --- background jobs ---
    op.create_table(
        "background_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("job_type", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", bgjobstatus, nullable=False, server_default=sa.text("'queued'")),
        sa.Column("priority", sa.SmallInteger(), nullable=False, server_default=sa.text("100")),
        sa.Column("attempts", sa.SmallInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("max_attempts", sa.SmallInteger(), nullable=False, server_default=sa.text("5")),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("worker_id", sa.String(length=64), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("related_resume_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_variant_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_variant_id"], ["resume_variants.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_background_jobs_pickup",
        "background_jobs",
        ["status", "available_at"],
        postgresql_where=sa.text("status in ('queued','retrying')"),
    )
    op.create_index(
        "ix_background_jobs_user_time",
        "background_jobs",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_background_jobs_user_time", table_name="background_jobs")
    op.drop_index("ix_background_jobs_pickup", table_name="background_jobs")
    op.drop_table("background_jobs")

    op.drop_index("ix_credit_ledger_user_feature_time", table_name="credit_ledger")
    op.drop_table("credit_ledger")

    op.drop_index("ix_ai_runs_kind_time", table_name="ai_runs")
    op.drop_index("ix_ai_runs_user_time", table_name="ai_runs")
    op.drop_table("ai_runs")

    op.drop_index("ix_resume_exports_user_time", table_name="resume_exports")
    op.drop_table("resume_exports")

    op.drop_index("uq_resume_variants_current_per_resume", table_name="resume_variants")
    op.drop_index("ix_resume_variants_job_description_id", table_name="resume_variants")
    op.drop_index("ix_resume_variants_resume_id", table_name="resume_variants")
    op.drop_table("resume_variants")

    op.drop_index("ix_job_descriptions_user_id", table_name="job_descriptions")
    op.drop_table("job_descriptions")

    op.drop_index("ix_resume_themes_template_id", table_name="resume_themes")
    op.drop_table("resume_themes")

    op.drop_table("resume_templates")

    op.drop_index("ix_resumes_user_content_hash_active", table_name="resumes")
    with op.batch_alter_table("resumes") as b:
        b.drop_column("deleted_at")
        b.drop_column("content_hash")
        b.drop_column("document_json")
        b.drop_column("source_text")

    # Drop enums last
    bind = op.get_bind()
    for name in (
        "bgjobstatus",
        "crediteventkind",
        "airunstatus",
        "airunkind",
        "exportstatus",
        "exportformat",
        "resumevariantkind",
    ):
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)
