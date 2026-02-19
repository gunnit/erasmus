from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from app.db.database import engine
import logging

logger = logging.getLogger(__name__)

# Whitelist of allowed table names and column types to prevent SQL injection
ALLOWED_TABLES = {"users", "proposals", "partners", "subscriptions", "payments", "generation_sessions"}
ALLOWED_COLUMN_TYPES = {"VARCHAR", "INTEGER", "FLOAT", "BOOLEAN", "TIMESTAMP", "JSON", "JSONB", "TEXT",
                        "NUMERIC", "SERIAL", "BIGINT", "SMALLINT", "DATE", "TIME"}

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_not_exists(db: Session, table_name: str, column_name: str, column_type: str):
    """Add a column to a table if it doesn't exist"""
    # Validate table name and column type against whitelists
    if table_name not in ALLOWED_TABLES:
        logger.error(f"Table name '{table_name}' not in allowed tables whitelist")
        return False
    base_type = column_type.split("(")[0].strip().upper()
    if base_type not in ALLOWED_COLUMN_TYPES:
        logger.error(f"Column type '{column_type}' not in allowed types whitelist")
        return False
    # Validate column name contains only safe characters
    if not column_name.isidentifier():
        logger.error(f"Invalid column name: '{column_name}'")
        return False

    if not column_exists(table_name, column_name):
        try:
            # Use identifier quoting for safe DDL construction
            # Table and column names are validated above; column_type is whitelisted
            stmt = text(f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{column_name}" {column_type}')
            db.execute(stmt)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add column {column_name} to {table_name}: {e}")
            return False
    return True