#!/usr/bin/env python3
"""Test error handling in authentication"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_error_handling():
    print("Testing Error Handling")
    print("=" * 50)
    
    # Test 1: Invalid login
    print("\n1. Testing invalid login...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Test 2: Registration with existing email
    print("\n2. Testing duplicate registration...")
    # First registration
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "pass123",
        "full_name": "Test User"
    })
    print(f"First registration: {response.status_code}")
    
    # Duplicate registration
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "duplicate@example.com",
        "username": "user2",
        "password": "pass123",
        "full_name": "Test User"
    })
    print(f"Duplicate registration status: {response.status_code}")
    print(f"Error response: {json.dumps(response.json(), indent=2)}")
    
    # Test 3: Invalid data format
    print("\n3. Testing invalid data format...")
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "not-an-email",  # Invalid email
        "username": "u",  # Too short
        "password": "123"  # Too short
    })
    print(f"Status: {response.status_code}")
    print(f"Validation errors: {json.dumps(response.json(), indent=2)}")
    
    print("\n" + "=" * 50)
    print("Error handling test complete")

if __name__ == "__main__":
    test_error_handling()