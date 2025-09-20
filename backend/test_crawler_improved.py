#!/usr/bin/env python3
"""
Test script for improved web crawler functionality
"""

import asyncio
import json
from app.services.web_crawler_service import WebCrawlerService

async def test_crawler():
    """Test the improved crawler with sample websites"""
    crawler = WebCrawlerService()

    # Test with some sample websites
    test_urls = [
        "https://www.unicef.org",  # Large NGO
        "https://www.greenpeace.org",  # Environmental NGO
        "https://www.giz.de",  # Development agency
    ]

    print("Testing improved web crawler...\n")
    print("=" * 80)

    for url in test_urls:
        print(f"\n🔍 Testing: {url}")
        print("-" * 40)

        try:
            result = await crawler.crawl_website(url)

            # Print extracted information
            print(f"✅ Successfully crawled {url}")

            # Description
            if result.get('description'):
                print(f"\n📝 Description (first 200 chars):")
                print(f"   {result['description'][:200]}...")
                print(f"   [Total length: {len(result['description'])} chars]")
            else:
                print("\n❌ No description found")

            # Expertise areas
            if result.get('expertise'):
                print(f"\n💡 Expertise Areas ({len(result['expertise'])} found):")
                for i, expertise in enumerate(result['expertise'][:5], 1):
                    print(f"   {i}. {expertise[:100]}...")
            else:
                print("\n❌ No expertise areas found")

            # Services
            if result.get('services'):
                print(f"\n🛠️ Services ({len(result['services'])} found):")
                for i, service in enumerate(result['services'][:5], 1):
                    print(f"   {i}. {service[:100]}...")
            else:
                print("\n❌ No services found")

            # Contact info
            if result.get('contact'):
                print(f"\n📞 Contact Info:")
                for key, value in result['contact'].items():
                    print(f"   {key}: {value}")

            # Social links
            if result.get('social_links'):
                print(f"\n🌐 Social Links:")
                for platform, link in result['social_links'].items():
                    print(f"   {platform}: {link}")

            # Meta info
            if result.get('meta_info'):
                print(f"\n🏷️ Meta Information:")
                for key, value in result['meta_info'].items():
                    if value:
                        display_value = value[:100] + "..." if len(str(value)) > 100 else value
                        print(f"   {key}: {display_value}")

            print("\n" + "=" * 80)

        except Exception as e:
            print(f"❌ Error crawling {url}: {str(e)}")
            print("=" * 80)

    print("\n✅ Crawler test completed!")

def main():
    """Main function"""
    print("\n🚀 Improved Web Crawler Test")
    print("=" * 80)

    # Run the async test
    asyncio.run(test_crawler())

if __name__ == "__main__":
    main()