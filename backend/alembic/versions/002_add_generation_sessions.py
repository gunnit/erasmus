"""Add generation_sessions table

Revision ID: 002
Revises: 001
Create Date: 2025-01-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum type for generation status
    generation_status_enum = sa.Enum(
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED',
        name='generationstatus'
    )
    generation_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create generation_sessions table
    op.create_table('generation_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', generation_status_enum, nullable=True),
        sa.Column('current_section', sa.String(), nullable=True),
        sa.Column('sections_order', sa.JSON(), nullable=True),
        sa.Column('completed_sections', sa.JSON(), nullable=True),
        sa.Column('failed_sections', sa.JSON(), nullable=True),
        sa.Column('project_context', sa.JSON(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('total_sections', sa.Integer(), nullable=True),
        sa.Column('completed_count', sa.Integer(), nullable=True),
        sa.Column('progress_percentage', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id for faster lookups
    op.create_index(op.f('ix_generation_sessions_user_id'), 'generation_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_generation_sessions_status'), 'generation_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_generation_sessions_created_at'), 'generation_sessions', ['created_at'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_generation_sessions_created_at'), table_name='generation_sessions')
    op.drop_index(op.f('ix_generation_sessions_status'), table_name='generation_sessions')
    op.drop_index(op.f('ix_generation_sessions_user_id'), table_name='generation_sessions')
    
    # Drop table
    op.drop_table('generation_sessions')
    
    # Drop enum type
    generation_status_enum = sa.Enum(name='generationstatus')
    generation_status_enum.drop(op.get_bind(), checkfirst=True)