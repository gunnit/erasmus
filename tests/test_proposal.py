#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/mnt/c/Dev/gyg4/backend')
os.environ.setdefault("DATABASE_URL", "postgresql://gyg4_user:Bb9NXHBbxxGLxQ5p9IkmI8KoU1dLzAQq@dpg-crr9s1jtq21c73fd9jf0-a.oregon-postgres.render.com/gyg4")

from app.db.database import engine, SessionLocal
from app.db.models import Proposal, User
from sqlalchemy import text

def test_proposals():
    db = SessionLocal()
    try:
        # Count proposals
        proposal_count = db.query(Proposal).count()
        print(f"Total proposals in database: {proposal_count}")

        # List all proposals
        proposals = db.query(Proposal).all()
        for p in proposals:
            print(f"  - ID: {p.id}, Title: {p.title}, User ID: {p.user_id}, Status: {p.status}")

        # Check users
        user_count = db.query(User).count()
        print(f"\nTotal users in database: {user_count}")

        users = db.query(User).all()
        for u in users:
            print(f"  - ID: {u.id}, Username: {u.username}, Email: {u.email}")
            user_proposals = db.query(Proposal).filter(Proposal.user_id == u.id).count()
            print(f"    Has {user_proposals} proposals")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_proposals()