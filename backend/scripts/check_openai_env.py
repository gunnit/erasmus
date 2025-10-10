#!/usr/bin/env python3
"""
Simple script to check OpenAI configuration without requiring the openai package
"""
import os
import sys

def check_openai_env():
    print("Checking OpenAI Configuration...")
    print("=" * 50)

    # Check environment variable
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("❌ OPENAI_API_KEY environment variable is NOT set!")
        print("\nTo fix this on Render:")
        print("1. Go to your Render dashboard")
        print("2. Select your backend service")
        print("3. Click on 'Environment' tab")
        print("4. Add OPENAI_API_KEY with your OpenAI API key")
        print("5. Click 'Save Changes' and wait for redeploy")
        return False

    if api_key == "your-openai-api-key-here":
        print("❌ OPENAI_API_KEY is set to placeholder value!")
        print("Please set it to your actual OpenAI API key")
        return False

    # Mask the key for security
    masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    print(f"✅ OPENAI_API_KEY is set: {masked_key}")
    print(f"   Length: {len(api_key)} characters")
    print(f"   Starts with: {'sk-' if api_key.startswith('sk-') else 'unknown prefix'}")

    # Check if it looks like a valid OpenAI key format
    if api_key.startswith("sk-") and len(api_key) > 40:
        print("✅ API key format looks valid")
    else:
        print("⚠️  API key format may be invalid (should start with 'sk-' and be 40+ chars)")

    print("\nEnvironment variable is configured locally.")
    print("Make sure the same key is set in your Render environment!")

    return True

if __name__ == "__main__":
    success = check_openai_env()
    sys.exit(0 if success else 1)