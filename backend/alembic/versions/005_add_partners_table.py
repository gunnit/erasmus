"""Add partners table and association

Revision ID: 005_add_partners
Revises: 004_add_subscription_payment_tables
Create Date: 2025-09-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '005_add_partners'
down_revision = '004_add_subscription_payment_tables'
branch_labels = None
depends_on = None

def upgrade():
    # Create partners table
    op.create_table('partners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('NGO', 'PUBLIC_INSTITUTION', 'PRIVATE_COMPANY',
                                  'EDUCATIONAL_INSTITUTION', 'RESEARCH_CENTER', 'SOCIAL_ENTERPRISE',
                                  name='partnertype'), nullable=False),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('expertise_areas', sa.JSON(), nullable=True),
        sa.Column('contact_info', sa.JSON(), nullable=True),
        sa.Column('affinity_score', sa.Float(), nullable=True),
        sa.Column('affinity_explanation', sa.Text(), nullable=True),
        sa.Column('crawled_data', sa.JSON(), nullable=True),
        sa.Column('last_crawled', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(op.f('ix_partners_id'), 'partners', ['id'], unique=False)
    op.create_index(op.f('ix_partners_name'), 'partners', ['name'], unique=False)

    # Create partner_proposal association table
    op.create_table('partner_proposal',
        sa.Column('partner_id', sa.Integer(), nullable=False),
        sa.Column('proposal_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['partner_id'], ['partners.id'], ),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ),
        sa.PrimaryKeyConstraint('partner_id', 'proposal_id')
    )

def downgrade():
    # Drop association table
    op.drop_table('partner_proposal')

    # Drop indexes and table
    op.drop_index(op.f('ix_partners_name'), table_name='partners')
    op.drop_index(op.f('ix_partners_id'), table_name='partners')
    op.drop_table('partners')

    # Drop enum type
    op.execute("DROP TYPE IF EXISTS partnertype")