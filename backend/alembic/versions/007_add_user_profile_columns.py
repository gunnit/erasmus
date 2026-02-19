"""Add user profile columns and ensure workplan column exists

Revision ID: 007_add_user_profile_columns
Revises: 006_add_credit_used
Create Date: 2026-02-19

Adds profile fields to users table:
- phone, country, bio, avatar_url, organization_role
- profile_data (JSON), settings_json (JSON)

Also ensures the workplan column exists on proposals table
(previously added by orphan migration add_workplan_column which
was not chained into the main migration sequence).
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '007_add_user_profile_columns'
down_revision = '006_add_credit_used'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column already exists in a table."""
    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :col"
        ),
        {"table": table_name, "col": column_name}
    )
    return result.fetchone() is not None


def upgrade():
    # ------------------------------------------------------------------
    # 1. Add profile fields to users table
    # ------------------------------------------------------------------
    if not column_exists('users', 'phone'):
        op.add_column('users',
            sa.Column('phone', sa.String(), nullable=True)
        )

    if not column_exists('users', 'country'):
        op.add_column('users',
            sa.Column('country', sa.String(), nullable=True)
        )

    if not column_exists('users', 'bio'):
        op.add_column('users',
            sa.Column('bio', sa.Text(), nullable=True)
        )

    if not column_exists('users', 'avatar_url'):
        op.add_column('users',
            sa.Column('avatar_url', sa.Text(), nullable=True)
        )

    if not column_exists('users', 'organization_role'):
        op.add_column('users',
            sa.Column('organization_role', sa.String(), nullable=True)
        )

    if not column_exists('users', 'profile_data'):
        op.add_column('users',
            sa.Column('profile_data', sa.JSON(), nullable=True, server_default='{}')
        )

    if not column_exists('users', 'settings_json'):
        op.add_column('users',
            sa.Column('settings_json', sa.JSON(), nullable=True, server_default='{}')
        )

    # ------------------------------------------------------------------
    # 2. Ensure workplan column exists on proposals table
    #    (may already exist from orphan migration add_workplan_column)
    # ------------------------------------------------------------------
    if not column_exists('proposals', 'workplan'):
        op.add_column('proposals',
            sa.Column('workplan', sa.JSON(), nullable=True)
        )


def downgrade():
    # Remove workplan from proposals (only if we added it)
    op.drop_column('proposals', 'workplan')

    # Remove profile fields from users (reverse order of addition)
    op.drop_column('users', 'settings_json')
    op.drop_column('users', 'profile_data')
    op.drop_column('users', 'organization_role')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'country')
    op.drop_column('users', 'phone')
