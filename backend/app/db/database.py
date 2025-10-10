from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create database engine with optimized connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,    # Verify connections before using them
    pool_size=10,          # Maximum number of permanent connections
    max_overflow=20,       # Allow up to 20 additional temporary connections
    pool_timeout=30,       # Wait up to 30 seconds for connection from pool
    pool_recycle=3600,     # Recycle connections after 1 hour (3600 seconds)
    echo=False             # Set to True to log all SQL queries (debug only)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()