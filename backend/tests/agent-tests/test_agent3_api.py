#!/usr/bin/env python3
"""
Agent 3: Comprehensive Backend API & Database Testing
Tests all CRUD operations, authentication, and data integrity on Render
"""
import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://erasmus-backend.onrender.com"
API_URL = f"{BASE_URL}/api"
TEST_USER_PREFIX = "agent3_test"
TEST_TIMESTAMP = int(time.time())

# Test results storage
results = {
    "auth": {},
    "proposals": {},
    "partners": {},
    "database": {},
    "endpoints": {},
    "errors": {},
    "security": {}
}

# Test user credentials
test_user = {
    "username": f"{TEST_USER_PREFIX}_{TEST_TIMESTAMP}",
    "email": f"{TEST_USER_PREFIX}_{TEST_TIMESTAMP}@test.com",
    "password": "TestPass123!",
    "full_name": "Agent Three Tester",
    "organization": "Test Organization"
}

jwt_token = None
test_proposal_id = None
test_partner_id = None

def log_test(category, test_name, status, details=""):
    """Log test result"""
    print(f"[{category.upper()}] {test_name}: {'✓ PASS' if status else '✗ FAIL'} {details}")
    if category not in results:
        results[category] = {}
    results[category][test_name] = {"status": status, "details": details}

def test_health_check():
    """Test health check endpoint"""
    try:
        r = requests.get(f"{API_URL}/health/ready", timeout=10)
        success = r.status_code == 200
        log_test("health", "Health Check", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("health", "Health Check", False, str(e))
        return False

def test_register():
    """Test user registration"""
    global jwt_token
    try:
        r = requests.post(f"{API_URL}/auth/register", json=test_user, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            jwt_token = data.get("access_token")
            success = jwt_token is not None
            log_test("auth", "Register User", success, f"Token received: {bool(jwt_token)}")
            return success
        elif r.status_code == 400 and "already exists" in r.text:
            log_test("auth", "Register User", True, "User exists - proceeding to login")
            return True
        else:
            log_test("auth", "Register User", False, f"Status: {r.status_code}, Body: {r.text[:200]}")
            return False
    except Exception as e:
        log_test("auth", "Register User", False, str(e))
        return False

def test_login():
    """Test user login - CRITICAL: Investigate bcrypt errors"""
    global jwt_token
    try:
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        r = requests.post(f"{API_URL}/auth/login", json=login_data, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            jwt_token = data.get("access_token")
            success = jwt_token is not None
            log_test("auth", "Login Success", success, f"Token: {jwt_token[:20] if jwt_token else 'None'}...")
            return success
        else:
            log_test("auth", "Login Success", False, f"Status: {r.status_code}, Body: {r.text[:300]}")
            # Check for bcrypt error
            if "bcrypt" in r.text.lower() or r.status_code == 500:
                log_test("auth", "bcrypt Error Detected", False, "500 error - password hashing issue")
            return False
    except Exception as e:
        log_test("auth", "Login Success", False, str(e))
        return False

def test_wrong_password():
    """Test login with wrong password"""
    try:
        login_data = {
            "username": test_user["username"],
            "password": "WrongPassword123!"
        }
        r = requests.post(f"{API_URL}/auth/login", json=login_data, timeout=10)
        success = r.status_code in [401, 403]
        log_test("auth", "Wrong Password Rejected", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("auth", "Wrong Password Rejected", False, str(e))
        return False

def test_get_profile():
    """Test get user profile"""
    if not jwt_token:
        log_test("auth", "Get Profile", False, "No JWT token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.get(f"{API_URL}/profile/", headers=headers, timeout=10)
        success = r.status_code == 200
        if success:
            profile = r.json()
            log_test("auth", "Get Profile", True, f"User: {profile.get('username')}")
        else:
            log_test("auth", "Get Profile", False, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("auth", "Get Profile", False, str(e))
        return False

def test_unauthorized_access():
    """Test access without token"""
    try:
        r = requests.get(f"{API_URL}/profile/", timeout=10)
        success = r.status_code in [401, 403]
        log_test("auth", "Unauthorized Blocked", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("auth", "Unauthorized Blocked", False, str(e))
        return False

def test_create_proposal():
    """Test create proposal with auto-partner linking"""
    global test_proposal_id
    if not jwt_token:
        log_test("proposals", "Create Proposal", False, "No JWT token")
        return False
    
    try:
        proposal_data = {
            "title": f"Test Proposal {TEST_TIMESTAMP}",
            "project_idea": "Testing proposal creation with auto-partner linking from Agent 3",
            "priorities": ["Digital transformation"],
            "target_groups": ["Adult educators"],
            "partners": [
                {
                    "name": f"Test Partner {TEST_TIMESTAMP}",
                    "country": "IT",
                    "type": "NGO",
                    "email": "test@partner.it"
                }
            ],
            "answers": {
                "1_1": "Test answer for project summary - digital skills for adult educators",
                "1_2": "Test answer for objectives - improve digital literacy"
            },
            "status": "draft"
        }
        
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.post(f"{API_URL}/proposals/", json=proposal_data, headers=headers, timeout=15)
        
        if r.status_code == 200:
            data = r.json()
            test_proposal_id = data.get("id")
            success = test_proposal_id is not None
            log_test("proposals", "Create Proposal", success, f"ID: {test_proposal_id}")
            return success
        else:
            log_test("proposals", "Create Proposal", False, f"Status: {r.status_code}, Body: {r.text[:200]}")
            return False
    except Exception as e:
        log_test("proposals", "Create Proposal", False, str(e))
        return False

def test_list_proposals():
    """Test list user proposals"""
    if not jwt_token:
        log_test("proposals", "List Proposals", False, "No JWT token")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.get(f"{API_URL}/proposals/?skip=0&limit=10", headers=headers, timeout=10)
        
        if r.status_code == 200:
            proposals = r.json()
            count = len(proposals)
            log_test("proposals", "List Proposals", True, f"Found {count} proposals")
            return True
        else:
            log_test("proposals", "List Proposals", False, f"Status: {r.status_code}")
            return False
    except Exception as e:
        log_test("proposals", "List Proposals", False, str(e))
        return False

def test_get_proposal():
    """Test get specific proposal"""
    if not jwt_token or not test_proposal_id:
        log_test("proposals", "Get Proposal", False, "No JWT token or proposal ID")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.get(f"{API_URL}/proposals/{test_proposal_id}", headers=headers, timeout=10)
        
        if r.status_code == 200:
            proposal = r.json()
            has_partners = "library_partners" in proposal or "partners" in proposal
            log_test("proposals", "Get Proposal", True, f"Partners loaded: {has_partners}")
            return True
        else:
            log_test("proposals", "Get Proposal", False, f"Status: {r.status_code}")
            return False
    except Exception as e:
        log_test("proposals", "Get Proposal", False, str(e))
        return False

def test_update_proposal():
    """Test update proposal"""
    if not jwt_token or not test_proposal_id:
        log_test("proposals", "Update Proposal", False, "No JWT token or proposal ID")
        return False
    
    try:
        update_data = {
            "title": f"Updated Test Proposal {TEST_TIMESTAMP}",
            "status": "review"
        }
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.put(f"{API_URL}/proposals/{test_proposal_id}", json=update_data, headers=headers, timeout=10)
        
        success = r.status_code == 200
        log_test("proposals", "Update Proposal", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("proposals", "Update Proposal", False, str(e))
        return False

def test_search_partners():
    """Test partner search"""
    if not jwt_token:
        log_test("partners", "Search Partners", False, "No JWT token")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.get(f"{API_URL}/partners/search?q=test", headers=headers, timeout=10)
        
        if r.status_code == 200:
            partners = r.json()
            log_test("partners", "Search Partners", True, f"Found {len(partners)} partners")
            return True
        else:
            log_test("partners", "Search Partners", False, f"Status: {r.status_code}")
            return False
    except Exception as e:
        log_test("partners", "Search Partners", False, str(e))
        return False

def test_create_partner():
    """Test create partner in library"""
    global test_partner_id
    if not jwt_token:
        log_test("partners", "Create Partner", False, "No JWT token")
        return False
    
    try:
        partner_data = {
            "name": f"Test Partner Library {TEST_TIMESTAMP}",
            "type": "University",
            "country": "DE",
            "website": "https://example.edu",
            "description": "Test partner for library validation",
            "expertise_areas": ["Digital education", "Adult learning"]
        }
        
        headers = {"Authorization": f"Bearer {jwt_token}"}
        r = requests.post(f"{API_URL}/partners/", json=partner_data, headers=headers, timeout=10)
        
        if r.status_code == 200:
            partner = r.json()
            test_partner_id = partner.get("id")
            log_test("partners", "Create Partner", True, f"ID: {test_partner_id}")
            return True
        else:
            log_test("partners", "Create Partner", False, f"Status: {r.status_code}, Body: {r.text[:200]}")
            return False
    except Exception as e:
        log_test("partners", "Create Partner", False, str(e))
        return False

def test_dashboard_stats():
    """Test dashboard statistics"""
    if not jwt_token:
        log_test("endpoints", "Dashboard Stats", False, "No JWT token")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {jwt_token}"}
        start = time.time()
        r = requests.get(f"{API_URL}/dashboard/stats", headers=headers, timeout=10)
        elapsed = time.time() - start
        
        if r.status_code == 200:
            stats = r.json()
            log_test("endpoints", "Dashboard Stats", True, f"Response time: {elapsed:.2f}s")
            return True
        else:
            log_test("endpoints", "Dashboard Stats", False, f"Status: {r.status_code}")
            return False
    except Exception as e:
        log_test("endpoints", "Dashboard Stats", False, str(e))
        return False

def test_invalid_json():
    """Test error handling for invalid JSON"""
    try:
        headers = {"Content-Type": "application/json"}
        r = requests.post(f"{API_URL}/auth/register", data="invalid json{", headers=headers, timeout=10)
        success = r.status_code in [400, 422]
        log_test("errors", "Invalid JSON Handled", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("errors", "Invalid JSON Handled", False, str(e))
        return False

def test_missing_fields():
    """Test validation for missing required fields"""
    try:
        incomplete_user = {"username": "test"}  # Missing required fields
        r = requests.post(f"{API_URL}/auth/register", json=incomplete_user, timeout=10)
        success = r.status_code in [400, 422]
        log_test("errors", "Missing Fields Validated", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("errors", "Missing Fields Validated", False, str(e))
        return False

def test_sql_injection():
    """Test SQL injection protection"""
    try:
        malicious_user = {
            "username": "admin' OR '1'='1",
            "email": "test@test.com",
            "password": "test123",
            "full_name": "Test"
        }
        r = requests.post(f"{API_URL}/auth/register", json=malicious_user, timeout=10)
        # Should either reject or sanitize, not cause server error
        success = r.status_code != 500
        log_test("security", "SQL Injection Blocked", success, f"Status: {r.status_code}")
        return success
    except Exception as e:
        log_test("security", "SQL Injection Blocked", False, str(e))
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("=" * 80)
    print("AGENT 3: BACKEND API & DATABASE TESTING")
    print(f"Backend URL: {BASE_URL}")
    print(f"Test timestamp: {TEST_TIMESTAMP}")
    print("=" * 80)
    print()
    
    # Health check
    print("--- HEALTH CHECK ---")
    test_health_check()
    print()
    
    # Authentication tests
    print("--- AUTHENTICATION & USER MANAGEMENT ---")
    test_register()
    time.sleep(1)
    test_login()
    test_wrong_password()
    test_get_profile()
    test_unauthorized_access()
    print()
    
    # Proposal tests
    print("--- PROPOSAL MANAGEMENT ---")
    test_create_proposal()
    time.sleep(1)
    test_list_proposals()
    test_get_proposal()
    test_update_proposal()
    print()
    
    # Partner tests
    print("--- PARTNER LIBRARY ---")
    test_search_partners()
    test_create_partner()
    print()
    
    # Additional endpoints
    print("--- ADDITIONAL ENDPOINTS ---")
    test_dashboard_stats()
    print()
    
    # Error handling
    print("--- ERROR HANDLING ---")
    test_invalid_json()
    test_missing_fields()
    print()
    
    # Security
    print("--- SECURITY ---")
    test_sql_injection()
    print()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for category, tests in results.items():
        for test_name, result in tests.items():
            total_tests += 1
            if result["status"]:
                passed_tests += 1
            else:
                failed_tests.append(f"{category}/{test_name}: {result['details']}")
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    if failed_tests:
        print("\nFailed Tests:")
        for failure in failed_tests:
            print(f"  ✗ {failure}")
    
    # Save results
    with open(f"test_results_agent3_{TEST_TIMESTAMP}.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: test_results_agent3_{TEST_TIMESTAMP}.json")

if __name__ == "__main__":
    run_all_tests()
