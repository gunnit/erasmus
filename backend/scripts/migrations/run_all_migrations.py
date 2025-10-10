#!/usr/bin/env python3
"""
Script to run all database migrations including subscription and payment tables
"""
import os
import sys
from alembic.config import Config
from alembic import command
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_all_migrations():
    """Run all database migrations"""
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

        print(f"Running all database migrations...")
        print(f"Database URL: {db_url[:30]}..." if db_url else "No DATABASE_URL set")

        # Run all migrations up to head
        command.upgrade(alembic_cfg, "head")

        print("✅ All migrations completed successfully!")
        print("Migrations applied:")
        print("- Initial schema")
        print("- Workplan column")
        print("- Quality scoring fields")
        print("- Subscription and payment tables")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_all_migrations()