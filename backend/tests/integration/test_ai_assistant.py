#!/usr/bin/env python3
"""
Test script for AI Assistant authentication and functionality
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.auth import create_access_token, verify_token, SECRET_KEY
from datetime import timedelta

def test_jwt_consistency():
    """Test that JWT creation and verification use the same SECRET_KEY"""
    print("=" * 50)
    print("Testing JWT Token Consistency")
    print("=" * 50)

    # Show current configuration
    print(f"\nCurrent Configuration:")
    print(f"SECRET_KEY from settings: {settings.SECRET_KEY}")
    print(f"SECRET_KEY from auth module: {SECRET_KEY}")
    print(f"ALGORITHM: {settings.ALGORITHM}")
    print(f"Token expiry minutes: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")

    # Check if they match
    if settings.SECRET_KEY == SECRET_KEY:
        print("\n✅ SECRET_KEY is consistent across modules")
    else:
        print("\n❌ SECRET_KEY mismatch detected!")
        return False

    # Create a test token
    print("\n" + "=" * 50)
    print("Creating and Verifying Test Token")
    print("=" * 50)

    test_user_id = "123"
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create token
    token = create_access_token(
        data={"sub": test_user_id},
        expires_delta=expires_delta
    )
    print(f"\nCreated token: {token[:50]}...")

    # Verify token
    payload = verify_token(token)

    if payload:
        print(f"\n✅ Token verified successfully!")
        print(f"Payload: {payload}")
        if payload.get("sub") == test_user_id:
            print(f"✅ User ID matches: {test_user_id}")
        else:
            print(f"❌ User ID mismatch: expected {test_user_id}, got {payload.get('sub')}")
    else:
        print("\n❌ Token verification failed!")
        return False

    print("\n" + "=" * 50)
    print("All tests passed! JWT authentication is properly configured.")
    print("=" * 50)

    print("\n📝 Next Steps:")
    print("1. Restart your backend server: cd backend && uvicorn app.main:app --reload --port 8000")
    print("2. Clear browser localStorage: Open DevTools Console and run: localStorage.clear()")
    print("3. Login again to get a new token")
    print("4. Try the AI Assistant - it should work now!")

    return True

if __name__ == "__main__":
    success = test_jwt_consistency()
    sys.exit(0 if success else 1)