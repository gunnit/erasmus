#!/usr/bin/env python3
"""
Migration script to link existing proposal partners to the partner library.

This script will:
1. Go through all existing proposals
2. For each partner in the partners JSON field:
   - Check if a matching partner exists in the library
   - If not, create a new partner in the library
   - Link the partner to the proposal via the association table
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.db.models import Proposal, Partner, PartnerType
from sqlalchemy.orm import Session


def migrate_partners():
    """Migrate partners from JSON to library and link them."""
    db = SessionLocal()

    try:
        # Get all proposals
        proposals = db.query(Proposal).all()

        print(f"Found {len(proposals)} proposals to process")

        for proposal in proposals:
            if not proposal.partners:
                continue

            print(f"\nProcessing proposal {proposal.id}: {proposal.title}")

            # Process each partner in the JSON field
            for partner_data in proposal.partners:
                if isinstance(partner_data, str):
                    # Old format - just a string name
                    partner_name = partner_data
                    partner_type = PartnerType.NGO
                    partner_country = ""
                    partner_role = ""
                else:
                    # New format - dictionary
                    partner_name = partner_data.get('name', '')
                    partner_type_str = partner_data.get('type', 'NGO').upper()
                    partner_country = partner_data.get('country', '')
                    partner_role = partner_data.get('role', '')

                    # Map type string to enum
                    type_mapping = {
                        'NGO': PartnerType.NGO,
                        'PUBLIC': PartnerType.PUBLIC_INSTITUTION,
                        'PUBLIC_INSTITUTION': PartnerType.PUBLIC_INSTITUTION,
                        'PRIVATE': PartnerType.PRIVATE_COMPANY,
                        'PRIVATE_COMPANY': PartnerType.PRIVATE_COMPANY,
                        'EDUCATION': PartnerType.EDUCATIONAL_INSTITUTION,
                        'EDUCATIONAL_INSTITUTION': PartnerType.EDUCATIONAL_INSTITUTION,
                        'RESEARCH': PartnerType.RESEARCH_CENTER,
                        'RESEARCH_CENTER': PartnerType.RESEARCH_CENTER,
                        'SOCIAL': PartnerType.SOCIAL_ENTERPRISE,
                        'SOCIAL_ENTERPRISE': PartnerType.SOCIAL_ENTERPRISE
                    }
                    partner_type = type_mapping.get(partner_type_str, PartnerType.NGO)

                if not partner_name:
                    continue

                # Check if partner already exists in library
                existing_partner = db.query(Partner).filter(
                    Partner.user_id == proposal.user_id,
                    Partner.name == partner_name,
                    Partner.country == partner_country
                ).first()

                if existing_partner:
                    print(f"  - Found existing partner: {partner_name}")
                    # Link to proposal if not already linked
                    if existing_partner not in proposal.library_partners:
                        proposal.library_partners.append(existing_partner)
                        print(f"    Linked to proposal")
                else:
                    # Create new partner
                    new_partner = Partner(
                        user_id=proposal.user_id,
                        name=partner_name,
                        type=partner_type,
                        country=partner_country,
                        description=partner_role,
                        expertise_areas=[],
                        contact_info={}
                    )
                    db.add(new_partner)
                    db.flush()

                    # Link to proposal
                    proposal.library_partners.append(new_partner)
                    print(f"  - Created and linked new partner: {partner_name}")

            db.commit()
            print(f"  Completed proposal {proposal.id}")

        print("\n✅ Migration completed successfully!")

        # Print summary
        total_partners = db.query(Partner).count()
        print(f"\nSummary:")
        print(f"- Total partners in library: {total_partners}")

        # Count proposals with linked partners
        proposals_with_links = 0
        for proposal in proposals:
            if proposal.library_partners:
                proposals_with_links += 1
        print(f"- Proposals with linked partners: {proposals_with_links}/{len(proposals)}")

    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting partner migration...")
    migrate_partners()