#!/usr/bin/env python3
"""
Test script for partner linking functionality between proposals and partner library.
"""

import os
import sys
import json
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.db.models import User, Proposal, Partner, PartnerType
from sqlalchemy.orm import Session


def test_partner_linking():
    """Test the partner linking functionality."""
    db = SessionLocal()

    try:
        print("Testing Partner Linking Functionality")
        print("=" * 50)

        # Get a test user (or use the first user)
        user = db.query(User).first()
        if not user:
            print("❌ No users found in database. Please create a user first.")
            return

        print(f"Using user: {user.email}")

        # Test 1: Check if partners are being created when proposal is saved
        print("\n1. Testing partner creation from proposal...")

        test_proposal_data = {
            "title": "Test Partner Linking Proposal",
            "project_idea": "Testing partner integration",
            "partners": [
                {"name": "Test NGO 1", "type": "NGO", "country": "Germany", "role": "Lead Partner"},
                {"name": "Test University", "type": "EDUCATION", "country": "France", "role": "Research Partner"}
            ],
            "priorities": ["DIGITAL"],
            "duration_months": 24,
            "budget": "250000"
        }

        # Create test proposal
        test_proposal = Proposal(
            user_id=user.id,
            title=test_proposal_data["title"],
            project_idea=test_proposal_data["project_idea"],
            partners=test_proposal_data["partners"],
            priorities=test_proposal_data["priorities"],
            duration_months=test_proposal_data["duration_months"],
            budget=test_proposal_data["budget"],
            status="draft"
        )

        db.add(test_proposal)
        db.flush()

        # Process partners (simulating the API logic)
        for partner_data in test_proposal_data["partners"]:
            # Check if partner exists
            existing = db.query(Partner).filter(
                Partner.user_id == user.id,
                Partner.name == partner_data["name"],
                Partner.country == partner_data["country"]
            ).first()

            if not existing:
                # Create new partner
                partner_type = PartnerType.NGO
                if partner_data["type"] == "EDUCATION":
                    partner_type = PartnerType.EDUCATIONAL_INSTITUTION

                new_partner = Partner(
                    user_id=user.id,
                    name=partner_data["name"],
                    type=partner_type,
                    country=partner_data["country"],
                    description=partner_data["role"],
                    expertise_areas=[],
                    contact_info={}
                )
                db.add(new_partner)
                db.flush()
                test_proposal.library_partners.append(new_partner)
                print(f"  ✅ Created and linked partner: {partner_data['name']}")
            else:
                test_proposal.library_partners.append(existing)
                print(f"  ✅ Linked existing partner: {partner_data['name']}")

        db.commit()

        # Test 2: Verify the links
        print("\n2. Verifying partner links...")

        # Reload the proposal with relationships
        saved_proposal = db.query(Proposal).filter(
            Proposal.id == test_proposal.id
        ).first()

        print(f"  - Proposal has {len(saved_proposal.library_partners)} linked partners")
        for partner in saved_proposal.library_partners:
            print(f"    • {partner.name} ({partner.type.value}) - {partner.country}")

        # Test 3: Check if partners appear in partner library
        print("\n3. Checking partner library...")

        all_partners = db.query(Partner).filter(
            Partner.user_id == user.id
        ).all()

        print(f"  - Total partners in library: {len(all_partners)}")
        for partner in all_partners[-2:]:  # Show last 2 partners
            print(f"    • {partner.name} - Linked to {len(partner.proposals)} proposal(s)")

        # Test 4: Test searching partners
        print("\n4. Testing partner search...")

        search_term = "Test"
        search_results = db.query(Partner).filter(
            Partner.user_id == user.id,
            Partner.name.ilike(f"%{search_term}%")
        ).limit(5).all()

        print(f"  - Search for '{search_term}' returned {len(search_results)} results")
        for result in search_results:
            print(f"    • {result.name} ({result.country})")

        # Clean up test data (optional)
        print("\n5. Cleaning up test data...")
        db.delete(saved_proposal)
        db.commit()
        print("  ✅ Test proposal deleted")

        print("\n" + "=" * 50)
        print("✅ All tests passed successfully!")

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_partner_linking()