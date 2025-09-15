#!/usr/bin/env python3
"""
Script to check Render service configuration via their API
This requires the Render API key to be set
"""
import os
import sys
import json

def check_render_env():
    print("Checking Render Service Configuration...")
    print("=" * 50)

    # Check if we're running on Render
    is_render = os.getenv("RENDER") == "true"
    render_service_id = os.getenv("RENDER_SERVICE_ID")

    if is_render:
        print("✅ Running on Render")
        print(f"   Service ID: {render_service_id}")
    else:
        print("⚠️  Not running on Render (running locally)")
        print("   To check Render configuration, deploy this script to Render")

    # Check critical environment variables
    print("\nEnvironment Variables Check:")
    print("-" * 30)

    env_vars = {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "SECRET_KEY": os.getenv("SECRET_KEY"),
        "RENDER": os.getenv("RENDER"),
        "RENDER_SERVICE_ID": os.getenv("RENDER_SERVICE_ID"),
    }

    for key, value in env_vars.items():
        if value:
            if key == "OPENAI_API_KEY":
                masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
                print(f"✅ {key}: {masked}")
            elif key in ["DATABASE_URL", "SECRET_KEY"]:
                print(f"✅ {key}: [SET - {len(value)} chars]")
            else:
                print(f"✅ {key}: {value}")
        else:
            print(f"❌ {key}: NOT SET")

    # Check if running in production mode
    print("\nApplication Settings:")
    print("-" * 30)

    debug_mode = os.getenv("DEBUG", "False").lower() == "true"
    print(f"DEBUG mode: {'⚠️ ON (should be OFF in production)' if debug_mode else '✅ OFF'}")

    # Suggest fixes if needed
    missing_vars = [k for k, v in env_vars.items() if not v and k != "RENDER" and k != "RENDER_SERVICE_ID"]
    if missing_vars and not is_render:
        print("\n⚠️ Missing environment variables (when deployed to Render):")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nTo fix on Render:")
        print("1. Go to https://dashboard.render.com")
        print("2. Select your backend service")
        print("3. Go to 'Environment' tab")
        print("4. Add the missing variables")
        print("5. Save and redeploy")

if __name__ == "__main__":
    check_render_env()