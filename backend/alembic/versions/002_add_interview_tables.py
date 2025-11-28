"""
Add interview tables

Revision ID: 002
Create Date: 2025-11-28
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '002_add_interview_tables'
down_revision = '001_add_job_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create interview_sessions table
    op.create_table(
        'interview_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('job_title', sa.String(), nullable=False),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('session_type', sa.Enum('technical', 'behavioral', 'mixed', 'system_design', name='sessiontype'), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('total_questions', sa.Integer(), default=0),
        sa.Column('questions_answered', sa.Integer(), default=0),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('status', sa.Enum('in_progress', 'completed', 'abandoned', name='sessionstatus'), nullable=False),
        sa.Column('feedback', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create indexes for interview_sessions
    op.create_index('ix_interview_sessions_user_id', 'interview_sessions', ['user_id'])
    op.create_index('ix_interview_sessions_status', 'interview_sessions', ['status'])
    op.create_index('ix_interview_sessions_started_at', 'interview_sessions', ['started_at'])
    
    # Create interview_questions table
    op.create_table(
        'interview_questions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.Enum('technical', 'behavioral', 'situational', 'system_design', 'coding', name='questiontype'), nullable=False),
        sa.Column('difficulty', sa.Enum('easy', 'medium', 'hard', name='questiondifficulty'), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('user_answer', sa.Text(), nullable=True),
        sa.Column('ai_feedback', sa.JSON(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('hints', sa.JSON(), nullable=True),
        sa.Column('sample_answer', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE')
    )
    
    # Create indexes for interview_questions
    op.create_index('ix_interview_questions_session_id', 'interview_questions', ['session_id'])
    op.create_index('ix_interview_questions_type', 'interview_questions', ['question_type'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_interview_questions_type', 'interview_questions')
    op.drop_index('ix_interview_questions_session_id', 'interview_questions')
    
    op.drop_index('ix_interview_sessions_started_at', 'interview_sessions')
    op.drop_index('ix_interview_sessions_status', 'interview_sessions')
    op.drop_index('ix_interview_sessions_user_id', 'interview_sessions')
    
    # Drop tables
    op.drop_table('interview_questions')
    op.drop_table('interview_sessions')
    
    # Drop enums
    sa.Enum(name='questiondifficulty').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='questiontype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='sessionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='sessiontype').drop(op.get_bind(), checkfirst=True)
