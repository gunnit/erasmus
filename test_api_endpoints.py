#!/usr/bin/env python3
"""Test script to verify API endpoints are working correctly"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_login():
    """Test login with demo2 account"""
    print("\n=== Testing Login ===")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "demo2",
        "password": "demo123"
    })
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Login successful! User ID: {data.get('id')}")
        return data.get('access_token')
    else:
        print(f"Login failed: {response.text}")
        return None

def test_get_proposals(token):
    """Test fetching proposals"""
    print("\n=== Testing Get Proposals ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/proposals/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {data.get('total', 0)} proposals")
        if data.get('proposals'):
            for p in data['proposals']:
                print(f"  - ID: {p['id']}, Title: {p['title']}, Status: {p['status']}")
    else:
        print(f"Failed: {response.text}")

def test_dashboard_stats(token):
    """Test dashboard stats"""
    print("\n=== Testing Dashboard Stats ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Stats: {json.dumps(data, indent=2)}")
    else:
        print(f"Failed: {response.text}")

def main():
    print("Testing API Endpoints...")
    print(f"Base URL: {BASE_URL}")

    # Test login
    token = test_login()
    if not token:
        print("\nCannot proceed without authentication token")
        return

    # Test proposals endpoint
    test_get_proposals(token)

    # Test dashboard stats
    test_dashboard_stats(token)

    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()