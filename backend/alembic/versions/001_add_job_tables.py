"""
Add job applications and jobs tables

Revision ID: 001
Create Date: 2025-11-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_add_job_tables'
down_revision = '000_initial_core'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Create enums idempotently (migration may be re-run after partial failure)
    applicationstatus = postgresql.ENUM(
        'applied',
        'interview',
        'offer',
        'rejected',
        'withdrawn',
        name='applicationstatus',
        create_type=False,
    )
    jobtype = postgresql.ENUM(
        'full-time',
        'part-time',
        'contract',
        'internship',
        'freelance',
        name='jobtype',
        create_type=False,
    )
    jobsource = postgresql.ENUM(
        'manual',
        'linkedin',
        'indeed',
        'glassdoor',
        'company_website',
        name='jobsource',
        create_type=False,
    )

    applicationstatus.create(bind, checkfirst=True)
    jobtype.create(bind, checkfirst=True)
    jobsource.create(bind, checkfirst=True)

    # Create job_applications table (UUIDs align with app.models.job_application)
    if not insp.has_table("job_applications"):
        op.create_table(
            'job_applications',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('company_name', sa.String(), nullable=False),
            sa.Column('job_title', sa.String(), nullable=False),
            sa.Column('job_url', sa.String(), nullable=True),
            sa.Column('location', sa.String(), nullable=True),
            sa.Column('salary_range', sa.String(), nullable=True),
            sa.Column('status', applicationstatus, nullable=False),
            sa.Column('applied_date', sa.DateTime(), nullable=False),
            sa.Column('match_score', sa.Float(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL')
        )

    # Create indexes for job_applications (idempotent)
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_applications_user_id ON job_applications (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_applications_status ON job_applications (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_applications_applied_date ON job_applications (applied_date)")
    
    # Create jobs table
    if not insp.has_table("jobs"):
        op.create_table(
            'jobs',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('company', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('location', sa.String(), nullable=True),
            sa.Column('salary_range', sa.String(), nullable=True),
            sa.Column('job_type', jobtype, nullable=True),
            sa.Column('source', jobsource, nullable=False),
            sa.Column('external_id', sa.String(), nullable=True),
            sa.Column('job_url', sa.String(), nullable=True),
            sa.Column('posted_date', sa.DateTime(), nullable=True),
            sa.Column('expires_date', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )

    # Create indexes for jobs (idempotent)
    op.execute("CREATE INDEX IF NOT EXISTS ix_jobs_company ON jobs (company)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_jobs_location ON jobs (location)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_jobs_posted_date ON jobs (posted_date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_jobs_source ON jobs (source)")


def downgrade():
    # Drop indexes
    op.drop_index('ix_jobs_source', 'jobs')
    op.drop_index('ix_jobs_posted_date', 'jobs')
    op.drop_index('ix_jobs_location', 'jobs')
    op.drop_index('ix_jobs_company', 'jobs')
    
    op.drop_index('ix_job_applications_applied_date', 'job_applications')
    op.drop_index('ix_job_applications_status', 'job_applications')
    op.drop_index('ix_job_applications_user_id', 'job_applications')
    
    # Drop tables
    op.drop_table('jobs')
    op.drop_table('job_applications')
    
    # Drop enums
    sa.Enum(name='jobsource').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='jobtype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='applicationstatus').drop(op.get_bind(), checkfirst=True)
