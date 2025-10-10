#!/usr/bin/env python3
"""
Test script for Firecrawl v2 API partner search functionality
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
load_dotenv()

from app.services.firecrawl_search_service import FirecrawlSearchService
from app.core.config import settings

async def test_firecrawl_v2_search():
    """Test the Firecrawl v2 search functionality"""

    print("Testing Firecrawl v2 API Integration")
    print("=" * 50)

    # Check if API key is configured
    if not settings.FIRECRAWL_API_KEY:
        print("❌ FIRECRAWL_API_KEY is not configured in .env file")
        print("Please add: FIRECRAWL_API_KEY=your_api_key to backend/.env")
        return False

    print(f"✓ FIRECRAWL_API_KEY is configured")

    # Initialize the service
    service = FirecrawlSearchService()

    if not service.enabled:
        print("❌ Firecrawl service is not enabled")
        return False

    print("✓ Firecrawl service initialized")

    # Test search criteria
    search_criteria = {
        'expertise_areas': ['digital skills', 'adult education', 'social inclusion'],
        'partner_type': 'NGO',
        'countries': ['Germany', 'Italy']
    }

    print("\nSearch Criteria:")
    print(f"  - Expertise areas: {search_criteria['expertise_areas']}")
    print(f"  - Partner type: {search_criteria['partner_type']}")
    print(f"  - Countries: {search_criteria['countries']}")

    print("\n🔍 Searching for partners...")

    try:
        # Run the search
        partners = await service.search_partners(
            search_criteria=search_criteria,
            num_results=5
        )

        print(f"\n✓ Found {len(partners)} partners")

        # Display results
        for i, partner in enumerate(partners, 1):
            print(f"\n{i}. {partner.get('name', 'Unknown')}")
            print(f"   Type: {partner.get('type', 'N/A')}")
            print(f"   Country: {partner.get('country', 'N/A')}")
            print(f"   Website: {partner.get('website', 'N/A')}")
            print(f"   Expertise: {', '.join(partner.get('expertise_areas', []))}")
            print(f"   Description: {partner.get('description', 'N/A')[:100]}...")

        return True

    except Exception as e:
        print(f"\n❌ Error during search: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_partner_enrichment():
    """Test the partner enrichment functionality"""

    print("\n" + "=" * 50)
    print("Testing Partner Enrichment")
    print("=" * 50)

    service = FirecrawlSearchService()

    if not service.enabled:
        print("❌ Firecrawl service is not enabled")
        return False

    # Test partner to enrich
    test_partner = {
        'name': 'European Association for the Education of Adults',
        'website': 'https://eaea.org',
        'type': 'NGO',
        'country': 'Belgium'
    }

    print(f"\nEnriching partner: {test_partner['name']}")
    print(f"Website: {test_partner['website']}")

    try:
        enriched_partner = await service.enrich_partner_with_crawl(test_partner)

        if enriched_partner.get('is_enriched'):
            print("✓ Partner successfully enriched")
            print(f"  Updated description: {enriched_partner.get('description', 'N/A')[:150]}...")
        else:
            print("⚠ Partner enrichment did not add new data")

        return True

    except Exception as e:
        print(f"❌ Error during enrichment: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""

    print("\n🚀 Starting Firecrawl v2 API Tests\n")

    # Test search functionality
    search_success = await test_firecrawl_v2_search()

    # Test enrichment functionality
    enrichment_success = await test_partner_enrichment()

    # Summary
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    print(f"Search Test: {'✓ PASSED' if search_success else '❌ FAILED'}")
    print(f"Enrichment Test: {'✓ PASSED' if enrichment_success else '❌ FAILED'}")

    if search_success and enrichment_success:
        print("\n✨ All tests passed successfully!")
        return 0
    else:
        print("\n⚠ Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)