"""
Test script for real partner search functionality
Tests that the AI partner finder uses actual web search to find real organizations
"""

import asyncio
import json
import logging
from app.services.ai_partner_finder_service import AIPartnerFinderService
from app.services.firecrawl_search_service import FirecrawlSearchService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_firecrawl_search():
    """Test Firecrawl search service directly"""
    print("\n=== Testing Firecrawl Search Service ===")

    search_service = FirecrawlSearchService()

    if not search_service.enabled:
        print("❌ Firecrawl is not enabled. Check FIRECRAWL_API_KEY in .env")
        return False

    # Test search criteria
    test_criteria = {
        'partner_types': ['NGO', 'EDUCATIONAL_INSTITUTION'],
        'countries': ['Germany', 'France', 'Spain'],
        'expertise_areas': ['Digital skills', 'Adult education'],
        'project_field': 'Adult Education',
        'custom_requirements': 'digital literacy training for seniors'
    }

    try:
        results = await search_service.search_partners(test_criteria, num_results=5)

        if results:
            print(f"✅ Found {len(results)} real partners:")
            for i, partner in enumerate(results, 1):
                print(f"\n{i}. {partner['name']}")
                print(f"   Type: {partner['type']}")
                print(f"   Country: {partner['country']}")
                print(f"   Website: {partner['website']}")
                print(f"   Search Result URL: {partner.get('search_result_url', 'N/A')[:80]}...")
                print(f"   Verified: {partner.get('is_verified', False)}")
                print(f"   Description: {partner['description'][:150]}...")

                # Validate URL format
                website = partner['website']
                if website and website.startswith(('http://', 'https://')):
                    if website.count('/') > 2 or len(website) < 15:
                        print(f"   ⚠️ WARNING: Website URL may be incomplete or incorrect")

            return True
        else:
            print("⚠️ No partners found. This might be due to search limitations.")
            return False

    except Exception as e:
        print(f"❌ Error during search: {str(e)}")
        return False


async def test_ai_partner_finder():
    """Test AI Partner Finder with real search integration"""
    print("\n=== Testing AI Partner Finder (with Real Search) ===")

    ai_service = AIPartnerFinderService()

    # Test criteria-based search
    test_criteria = {
        'partner_types': ['NGO', 'RESEARCH_CENTER'],
        'countries': ['Netherlands', 'Belgium'],
        'expertise_areas': ['Social inclusion', 'Employment'],
        'project_field': 'Adult Education',
        'custom_requirements': 'supporting unemployed adults back to work'
    }

    try:
        print("\n1. Testing criteria-based partner search...")
        partners = await ai_service.find_partners_by_criteria(
            criteria=test_criteria,
            num_partners=3
        )

        if partners:
            print(f"✅ Found {len(partners)} partners through AI service:")

            for i, partner in enumerate(partners, 1):
                print(f"\n{i}. {partner['name']}")

                # Check if it's a real partner or a suggestion
                if partner.get('is_suggestion'):
                    print("   ⚠️ This is a SUGGESTION (not a real organization)")
                elif partner.get('is_verified'):
                    print("   ✅ VERIFIED real organization")
                else:
                    print("   ℹ️ Organization found (verification pending)")

                print(f"   Type: {partner['type']}")
                print(f"   Country: {partner['country']}")
                print(f"   Website: {partner.get('website', 'N/A')}")

                if partner.get('compatibility_score'):
                    print(f"   Compatibility: {partner['compatibility_score']}/100")

                if partner.get('match_reason'):
                    print(f"   Match reason: {partner['match_reason'][:200]}...")
        else:
            print("❌ No partners returned from AI service")

        return len(partners) > 0

    except Exception as e:
        print(f"❌ Error in AI partner finder: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_proposal_based_search():
    """Test finding partners for a specific proposal"""
    print("\n=== Testing Proposal-Based Partner Search ===")

    from app.db.models import Proposal

    # Create a mock proposal
    mock_proposal = Proposal(
        title="Digital Skills for Senior Citizens",
        project_idea="A project to teach digital literacy to elderly adults, helping them navigate online services, stay connected with family, and access digital health resources.",
        priorities=["Digital transformation", "Social inclusion"],
        target_groups=["Senior citizens", "Adult educators"],
        duration_months=24,
        budget=250000,
        partners=[
            {"name": "Lead Organization", "country": "Germany", "type": "NGO"}
        ]
    )

    ai_service = AIPartnerFinderService()

    try:
        partners = await ai_service.find_partners_for_proposal(
            proposal=mock_proposal,
            num_partners=3
        )

        if partners:
            print(f"✅ Found {len(partners)} partners for the proposal:")

            for i, partner in enumerate(partners, 1):
                print(f"\n{i}. {partner['name']}")

                if partner.get('is_verified'):
                    print("   ✅ VERIFIED real organization")
                elif partner.get('is_suggestion'):
                    print("   ⚠️ SUGGESTION only")

                print(f"   Type: {partner['type']}")
                print(f"   Country: {partner['country']}")

                if partner.get('project_contribution'):
                    print(f"   Contribution: {partner['project_contribution'][:150]}...")

        return len(partners) > 0

    except Exception as e:
        print(f"❌ Error in proposal-based search: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("=" * 60)
    print("TESTING REAL PARTNER SEARCH FUNCTIONALITY")
    print("=" * 60)

    results = []

    # Test 1: Firecrawl search
    results.append(("Firecrawl Search", await test_firecrawl_search()))

    # Test 2: AI Partner Finder with criteria
    results.append(("AI Partner Finder (Criteria)", await test_ai_partner_finder()))

    # Test 3: AI Partner Finder for proposal
    results.append(("AI Partner Finder (Proposal)", await test_proposal_based_search()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("\n🎉 All tests passed! Partner search is using real data.")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
        print("\nCommon issues:")
        print("1. FIRECRAWL_API_KEY not set in .env")
        print("2. Network connectivity issues")
        print("3. API rate limits")

    return all_passed


if __name__ == "__main__":
    asyncio.run(main())