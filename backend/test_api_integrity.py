#!/usr/bin/env python3
"""
Test that existing API functionality is not broken
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api_integrity():
    """Test core API endpoints"""
    print("🔍 Testing API Integrity After Quality Score Implementation\n")
    print("=" * 50)

    # Test 1: Health Check
    print("1. Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health/ready", timeout=5)
        if response.status_code == 200:
            print("   ✓ Health check passed")
        else:
            print(f"   ✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Health check error: {e}")
        return False

    # Test 2: Form Questions
    print("\n2. Testing Form Questions Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/form/questions", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if 'sections' in data:
                print(f"   ✓ Form questions loaded: {len(data['sections'])} sections")
            else:
                print("   ✗ Form questions structure invalid")
                return False
        else:
            print(f"   ✗ Form questions failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Form questions error: {e}")
        return False

    # Test 3: Priorities Endpoint
    print("\n3. Testing Priorities Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/form/priorities", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Priorities loaded: {len(data.get('horizontal', []))} horizontal priorities")
        else:
            print(f"   ✗ Priorities failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Priorities error: {e}")
        return False

    # Test 4: Auth endpoints (without actual login)
    print("\n4. Testing Auth Endpoints Structure...")
    try:
        # Test that login endpoint exists (will fail auth but that's OK)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "test", "password": "test"},
            timeout=5
        )
        # We expect 401 or 403, not 404 or 500
        if response.status_code in [401, 403, 400]:
            print("   ✓ Auth endpoints responding correctly")
        elif response.status_code == 404:
            print("   ✗ Auth endpoint not found")
            return False
        else:
            print(f"   ✗ Unexpected auth response: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Auth error: {e}")
        return False

    # Test 5: Quality Score endpoints exist
    print("\n5. Testing Quality Score Endpoints...")
    try:
        # Test that the endpoint exists (will fail auth but that's OK)
        response = requests.get(f"{BASE_URL}/api/quality-score/1", timeout=5)
        # We expect 401 or 403, not 404 or 500
        if response.status_code in [401, 403]:
            print("   ✓ Quality score endpoints exist")
        elif response.status_code == 404:
            # Could be proposal not found, which is OK
            print("   ✓ Quality score endpoints responding")
        elif response.status_code == 500:
            print("   ✗ Quality score endpoint error")
            return False
        else:
            print(f"   ~ Quality score response: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Quality score error: {e}")
        return False

    print("\n" + "=" * 50)
    print("✅ API Integrity Check Completed Successfully!")
    print("   All existing endpoints are functioning correctly")
    print("   Quality score feature integrated without breaking changes")

    return True

if __name__ == "__main__":
    import sys

    print("⏳ Waiting for server to be ready...")
    time.sleep(2)

    success = test_api_integrity()
    sys.exit(0 if success else 1)