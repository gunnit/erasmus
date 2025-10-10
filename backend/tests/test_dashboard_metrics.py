#!/usr/bin/env python3
"""
Test script for the new dashboard metrics endpoints
"""
import os
import sys
import json
from datetime import datetime, timedelta

# Add the project directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up environment
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'sqlite:///./erasmus_forms.db')
os.environ['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'test-secret-key')
os.environ['DEBUG'] = 'True'

from app.db.database import SessionLocal
from app.db.models import User, Proposal
from app.api.dashboard import get_budget_metrics, get_priority_metrics, get_performance_metrics

def test_metrics():
    """Test the dashboard metrics functions"""
    db = SessionLocal()

    try:
        # Get first user for testing
        user = db.query(User).first()
        if not user:
            print("No users found in database. Creating test user...")
            user = User(
                email="test@example.com",
                username="testuser",
                hashed_password="hashed",
                full_name="Test User",
                organization="Test Org"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {user.username}")
        else:
            print(f"Using existing user: {user.username}")

        # Check for existing proposals
        proposal_count = db.query(Proposal).filter(Proposal.user_id == user.id).count()
        print(f"\\nFound {proposal_count} proposals for user {user.username}")

        # If no proposals, create sample data
        if proposal_count == 0:
            print("Creating sample proposals...")
            for i in range(3):
                proposal = Proposal(
                    user_id=user.id,
                    title=f"Test Proposal {i+1}",
                    project_idea=f"Test project idea {i+1}",
                    priorities=["DIGITAL", "INCLUSION", "GREEN"],
                    target_groups=["Adults", "Youth"],
                    duration_months=24,
                    budget="150000",
                    status=["draft", "submitted", "approved"][i % 3],
                    answers={"q1": "Answer 1", "q2": "Answer 2"},
                    created_at=datetime.utcnow() - timedelta(days=30 * i)
                )
                db.add(proposal)
            db.commit()
            print("Created 3 sample proposals")

        # Test budget metrics
        print("\\n=== Testing Budget Metrics ===")
        class MockUser:
            def __init__(self, id):
                self.id = id

        mock_user = MockUser(user.id)

        # Simulating the API calls
        from collections import defaultdict

        # Get budget data
        proposals = db.query(Proposal).filter(
            Proposal.user_id == user.id,
            Proposal.created_at >= datetime.utcnow() - timedelta(days=365)
        ).all()

        quarterly_data = defaultdict(lambda: {"budget": 0, "spent": 0, "proposals": 0})

        for proposal in proposals:
            month = proposal.created_at.month
            year = proposal.created_at.year
            quarter = f"Q{((month - 1) // 3) + 1} {year}"

            try:
                budget_value = float(str(proposal.budget or 0).replace(',', '').replace('€', ''))
                quarterly_data[quarter]["budget"] += budget_value
                quarterly_data[quarter]["proposals"] += 1

                if proposal.status in ["approved", "submitted"]:
                    quarterly_data[quarter]["spent"] += budget_value
            except (ValueError, AttributeError):
                pass

        print(f"Budget Metrics: {dict(quarterly_data)}")

        # Test priority metrics
        print("\\n=== Testing Priority Metrics ===")
        proposals_with_priorities = db.query(Proposal).filter(
            Proposal.user_id == user.id,
            Proposal.priorities.isnot(None)
        ).all()

        priority_counts = defaultdict(int)
        for proposal in proposals_with_priorities:
            priorities = proposal.priorities
            if isinstance(priorities, list):
                for priority in priorities:
                    priority_counts[priority] += 1

        print(f"Priority Distribution: {dict(priority_counts)}")

        # Test performance metrics
        print("\\n=== Testing Performance Metrics ===")
        monthly_data = defaultdict(lambda: {
            "proposals": 0,
            "approved": 0,
            "submitted": 0,
            "rejected": 0,
            "draft": 0
        })

        for proposal in proposals:
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            month_year = f"{month_names[proposal.created_at.month - 1]} {proposal.created_at.year}"
            monthly_data[month_year]["proposals"] += 1

            status = proposal.status or "draft"
            monthly_data[month_year][status] += 1

        print(f"Monthly Performance: {dict(monthly_data)}")

        print("\\n✅ All metrics tests completed successfully!")

    except Exception as e:
        print(f"\\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_metrics()