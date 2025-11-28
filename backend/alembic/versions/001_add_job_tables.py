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
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create job_applications table
    op.create_table(
        'job_applications',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('company_name', sa.String(), nullable=False),
        sa.Column('job_title', sa.String(), nullable=False),
        sa.Column('job_url', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('salary_range', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('applied', 'interview', 'offer', 'rejected', 'withdrawn', name='applicationstatus'), nullable=False),
        sa.Column('applied_date', sa.DateTime(), nullable=False),
        sa.Column('match_score', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('resume_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL')
    )
    
    # Create indexes for job_applications
    op.create_index('ix_job_applications_user_id', 'job_applications', ['user_id'])
    op.create_index('ix_job_applications_status', 'job_applications', ['status'])
    op.create_index('ix_job_applications_applied_date', 'job_applications', ['applied_date'])
    
    # Create jobs table
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('salary_range', sa.String(), nullable=True),
        sa.Column('job_type', sa.Enum('full-time', 'part-time', 'contract', 'internship', 'freelance', name='jobtype'), nullable=True),
        sa.Column('source', sa.Enum('manual', 'linkedin', 'indeed', 'glassdoor', 'company_website', name='jobsource'), nullable=False),
        sa.Column('external_id', sa.String(), nullable=True),
        sa.Column('job_url', sa.String(), nullable=True),
        sa.Column('posted_date', sa.DateTime(), nullable=True),
        sa.Column('expires_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for jobs
    op.create_index('ix_jobs_company', 'jobs', ['company'])
    op.create_index('ix_jobs_location', 'jobs', ['location'])
    op.create_index('ix_jobs_posted_date', 'jobs', ['posted_date'])
    op.create_index('ix_jobs_source', 'jobs', ['source'])


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
