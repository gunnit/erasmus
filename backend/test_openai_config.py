#!/usr/bin/env python3
"""
Test script to verify OpenAI configuration on Render
"""
import os
import sys
import asyncio
from openai import AsyncOpenAI

async def test_openai_config():
    print("Testing OpenAI Configuration...")
    print("=" * 50)

    # Check environment variable
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("❌ OPENAI_API_KEY environment variable is NOT set!")
        print("\nTo fix this:")
        print("1. Go to https://dashboard.render.com/web/srv-d31gaqje5dus73atbsg0")
        print("2. Click on 'Environment' tab")
        print("3. Add OPENAI_API_KEY with your OpenAI API key")
        print("4. Click 'Save Changes' and wait for redeploy")
        return False

    if api_key == "your-openai-api-key-here":
        print("❌ OPENAI_API_KEY is set to placeholder value!")
        print("Please set it to your actual OpenAI API key")
        return False

    # Mask the key for security
    masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    print(f"✅ OPENAI_API_KEY is set: {masked_key}")

    # Test API connection
    try:
        print("\nTesting OpenAI API connection...")
        client = AsyncOpenAI(api_key=api_key)

        # Try a simple completion
        response = await client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a test assistant."},
                {"role": "user", "content": "Say 'API is working!' in 3 words."}
            ],
            max_tokens=10,
            temperature=0.1
        )

        print(f"✅ API Response: {response.choices[0].message.content}")
        print("\n✅ OpenAI configuration is working correctly!")
        return True

    except Exception as e:
        print(f"\n❌ Error testing OpenAI API: {e}")
        print("\nPossible issues:")
        print("1. Invalid API key")
        print("2. API key doesn't have access to gpt-4-turbo")
        print("3. Network connectivity issues")
        print("4. OpenAI service is down")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_openai_config())
    sys.exit(0 if success else 1)