"""
Basic test to check if imports work
"""
print("Testing basic imports...")

try:
    import sys
    print(f"✓ Python version: {sys.version}")
except Exception as e:
    print(f"✗ Python error: {e}")

try:
    import fastapi
    print("✓ FastAPI imported successfully")
except ImportError:
    print("✗ FastAPI not installed - run: pip install fastapi")

try:
    import uvicorn
    print("✓ Uvicorn imported successfully")
except ImportError:
    print("✗ Uvicorn not installed - run: pip install uvicorn")

try:
    import openai
    print("✓ OpenAI imported successfully")
except ImportError:
    print("✗ OpenAI not installed - run: pip install openai")

try:
    import pydantic_settings
    print("✓ Pydantic Settings imported successfully")
except ImportError:
    print("✗ Pydantic Settings not installed - run: pip install pydantic-settings")

try:
    from app.main import app
    print("✓ Main app imported successfully")
    print("\nEverything looks good! You can run:")
    print("  uvicorn app.main:app --reload")
except Exception as e:
    print(f"✗ Error importing main app: {e}")
    print("\nCheck if app/main.py exists and has no syntax errors")