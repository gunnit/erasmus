#!/usr/bin/env python3
"""
Script to run database migration to add workplan column
"""
import os
import sys
from alembic.config import Config
from alembic import command
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the migration to add workplan column"""
    try:
        # Create Alembic configuration
        alembic_cfg = Config("alembic.ini")

        # Override database URL from environment
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            # Convert postgres:// to postgresql:// if needed
            if db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://', 1)
            alembic_cfg.set_main_option("sqlalchemy.url", db_url)

        print(f"Running migration to add workplan column...")
        print(f"Database URL: {db_url[:30]}..." if db_url else "No DATABASE_URL set")

        # Run the migration
        command.upgrade(alembic_cfg, "head")

        print("✅ Migration completed successfully!")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()