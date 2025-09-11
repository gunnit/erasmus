#!/usr/bin/env python3
"""
Test script to verify backend configuration
"""
import os
import sys

print("=" * 50)
print("Erasmus+ Backend Configuration Test")
print("=" * 50)

# Check Python version
print(f"\n✓ Python version: {sys.version}")

# Check environment variables
env_vars = {
    "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
    "DATABASE_URL": os.getenv("DATABASE_URL"),
}

print("\n Environment Variables:")
for key, value in env_vars.items():
    if value:
        if "KEY" in key:
            print(f"  ✓ {key}: {'*' * 10}{value[-4:]}")
        else:
            print(f"  ✓ {key}: {value[:30]}...")
    else:
        print(f"  ✗ {key}: NOT SET")

# Try to import required packages
print("\n Package Imports:")
packages = ["fastapi", "uvicorn", "pydantic", "openai"]

for package in packages:
    try:
        __import__(package)
        print(f"  ✓ {package} installed")
    except ImportError:
        print(f"  ✗ {package} NOT installed")

print("\n" + "=" * 50)
print("To install missing packages:")
print("  cd backend")
print("  python -m venv venv")
print("  venv\\Scripts\\activate (Windows)")
print("  pip install -r requirements.txt")
print("=" * 50)