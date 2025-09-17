"""Add subscription and payment tables

Revision ID: 004_subscription_payment
Revises: 003_add_quality_scoring_fields
Create Date: 2025-01-18

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '004_subscription_payment'
down_revision = '003_add_quality_scoring_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types for PostgreSQL
    subscription_plan_enum = sa.Enum('STARTER', 'PROFESSIONAL', name='subscriptionplan')
    payment_status_enum = sa.Enum('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', name='paymentstatus')

    # Create subscription table
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_type', subscription_plan_enum, nullable=False),
        sa.Column('proposals_limit', sa.Integer(), nullable=False),
        sa.Column('proposals_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('amount_paid', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(), nullable=True, server_default='EUR'),
        sa.Column('started_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('auto_renew', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('paypal_subscription_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id')
    )

    # Create payment table
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(), nullable=True, server_default='EUR'),
        sa.Column('status', payment_status_enum, nullable=True, server_default='PENDING'),
        sa.Column('paypal_order_id', sa.String(), nullable=False),
        sa.Column('paypal_capture_id', sa.String(), nullable=True),
        sa.Column('paypal_payer_id', sa.String(), nullable=True),
        sa.Column('paypal_payer_email', sa.String(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True, server_default='paypal'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('refunded_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.UniqueConstraint('paypal_order_id')
    )

    # Add subscription fields to users table
    op.add_column('users', sa.Column('subscription_plan', subscription_plan_enum, nullable=True))
    op.add_column('users', sa.Column('proposals_remaining', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('users', sa.Column('subscription_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('subscription_started_at', sa.DateTime(), nullable=True))

    # Create indexes for better query performance
    op.create_index('ix_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('ix_subscriptions_is_active', 'subscriptions', ['is_active'])
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_payments_paypal_order_id', 'payments', ['paypal_order_id'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_payments_paypal_order_id', 'payments')
    op.drop_index('ix_payments_status', 'payments')
    op.drop_index('ix_payments_user_id', 'payments')
    op.drop_index('ix_subscriptions_is_active', 'subscriptions')
    op.drop_index('ix_subscriptions_user_id', 'subscriptions')

    # Remove subscription fields from users table
    op.drop_column('users', 'subscription_started_at')
    op.drop_column('users', 'subscription_expires_at')
    op.drop_column('users', 'proposals_remaining')
    op.drop_column('users', 'subscription_plan')

    # Drop tables
    op.drop_table('payments')
    op.drop_table('subscriptions')

    # Drop enum types
    sa.Enum('STARTER', 'PROFESSIONAL', name='subscriptionplan').drop(op.get_bind(), checkfirst=False)
    sa.Enum('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', name='paymentstatus').drop(op.get_bind(), checkfirst=False)