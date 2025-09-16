from sqlalchemy import inspect
from sqlalchemy.orm import Session
from app.db.database import engine

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_not_exists(db: Session, table_name: str, column_name: str, column_type: str):
    """Add a column to a table if it doesn't exist"""
    if not column_exists(table_name, column_name):
        try:
            db.execute(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_type}")
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Failed to add column {column_name} to {table_name}: {e}")
            return False
    return True