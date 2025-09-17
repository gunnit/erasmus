"""add quality scoring fields

Revision ID: 003_quality_scoring
Revises: 002_add_generation_sessions
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '003_quality_scoring'
down_revision = '002_add_generation_sessions'
branch_labels = None
depends_on = None


def upgrade():
    # Add quality scoring fields to proposals table
    op.add_column('proposals', sa.Column('quality_score', sa.Float(), nullable=True))
    op.add_column('proposals', sa.Column('section_scores', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('quality_feedback', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('score_calculated_at', sa.DateTime(), nullable=True))

    # Create index for quick filtering by quality score
    op.create_index('idx_proposals_quality_score', 'proposals', ['quality_score'])


def downgrade():
    # Remove index
    op.drop_index('idx_proposals_quality_score', table_name='proposals')

    # Remove columns
    op.drop_column('proposals', 'score_calculated_at')
    op.drop_column('proposals', 'quality_feedback')
    op.drop_column('proposals', 'section_scores')
    op.drop_column('proposals', 'quality_score')