"""add workplan column to proposals

Revision ID: add_workplan_column
Revises:
Create Date: 2025-09-16 17:38:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_workplan_column'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add workplan column to proposals table
    op.add_column('proposals', sa.Column('workplan', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove workplan column from proposals table
    op.drop_column('proposals', 'workplan')