"""Add credit_used field to proposals table

Revision ID: 006_add_credit_used
Revises: 005_add_partners
Create Date: 2025-09-20
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '006_add_credit_used'
down_revision = '005_add_partners'
branch_labels = None
depends_on = None

def upgrade():
    # Add credit_used column to proposals table
    op.add_column('proposals',
        sa.Column('credit_used', sa.Boolean(), nullable=True, server_default='false')
    )

    # Update existing rows to have credit_used = False
    op.execute("UPDATE proposals SET credit_used = false WHERE credit_used IS NULL")

    # Make the column non-nullable after setting default values
    op.alter_column('proposals', 'credit_used',
                    nullable=False,
                    server_default='false')

def downgrade():
    # Remove the credit_used column
    op.drop_column('proposals', 'credit_used')