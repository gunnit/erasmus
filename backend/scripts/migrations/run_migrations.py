#!/usr/bin/env python3
"""
Script to run database migrations
Can be executed manually or as part of deployment
"""

import os
import sys
from alembic.config import Config
from alembic import command

def run_migrations():
    """Run all pending database migrations"""
    try:
        # Get the directory where this script is located
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(backend_dir, 'alembic.ini')

        # Create Alembic configuration
        alembic_cfg = Config(alembic_ini_path)

        # Run migrations to latest revision
        print("Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed successfully!")

        return 0
    except Exception as e:
        print(f"❌ Error running migrations: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(run_migrations())