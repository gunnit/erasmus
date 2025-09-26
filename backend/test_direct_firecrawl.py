#!/usr/bin/env python3
"""
Direct test of Firecrawl v2 API to understand the response format
"""

import os
from dotenv import load_dotenv
from firecrawl import Firecrawl

# Load environment variables
load_dotenv()

def test_direct_search():
    """Test direct Firecrawl search API"""

    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        print("❌ FIRECRAWL_API_KEY not found")
        return

    print("Testing Direct Firecrawl v2 Search")
    print("=" * 50)

    # Initialize client
    app = Firecrawl(api_key=api_key)

    # Test 1: Simple search
    print("\n1. Testing simple search:")
    try:
        result = app.search(
            query="Erasmus+ adult education partner Germany",
            limit=3
        )
        print(f"Result type: {type(result)}")

        # Check object attributes
        if hasattr(result, "__dict__"):
            print(f"Result attributes: {dir(result)}")

        # Try to access data attribute
        if hasattr(result, "data"):
            data = result.data
            print(f"Data type: {type(data)}")
            if isinstance(data, list):
                print(f"Found {len(data)} results")
                if len(data) > 0:
                    print("\nFirst result:")
                    first = data[0]
                    if hasattr(first, "__dict__"):
                        for attr in dir(first):
                            if not attr.startswith("_"):
                                value = getattr(first, attr, None)
                                if callable(value):
                                    continue
                                if isinstance(value, str):
                                    print(f"    {attr}: {value[:100] if len(value) > 100 else value}")
                                else:
                                    print(f"    {attr}: {type(value)}")

        # Try to convert to dict
        if hasattr(result, "model_dump"):
            result_dict = result.model_dump()
            print(f"\nAs dict - keys: {result_dict.keys()}")
            if "web" in result_dict and result_dict["web"]:
                print(f"Web results: {len(result_dict['web'])}")
                for i, item in enumerate(result_dict["web"][:2], 1):
                    print(f"\n  Result {i}:")
                    print(f"    URL: {item.get('url', 'N/A')}")
                    print(f"    Title: {item.get('title', 'N/A')}")
                    print(f"    Description: {item.get('description', 'N/A')[:100]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # Test 2: Search with scraping
    print("\n2. Testing search with scraping:")
    try:
        result = app.search(
            query="adult education NGO Europe",
            limit=2
        )
        print(f"Result type: {type(result)}")

        if isinstance(result, dict) and "data" in result:
            data = result["data"]
            print(f"Data length: {len(data) if isinstance(data, list) else 'Not a list'}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Scrape a specific URL
    print("\n3. Testing direct scrape:")
    try:
        result = app.scrape(
            url="https://eaea.org",
            formats=["markdown"]
        )
        print(f"Scrape result type: {type(result)}")
        if isinstance(result, dict):
            print(f"Scrape result keys: {result.keys()}")
            if "markdown" in result:
                print(f"Markdown content length: {len(result['markdown'])}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_direct_search()