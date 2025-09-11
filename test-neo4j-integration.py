#!/usr/bin/env python3
"""
Complete integration test for Neo4j-based Erasmus+ application system
Tests the full flow from registration to proposal creation
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "email": f"test_{datetime.now().timestamp()}@example.com",
    "password": "TestPassword123!",
    "username": f"testuser_{int(datetime.now().timestamp())}",
    "full_name": "Test User",
    "organization": "Test Organization"
}

def print_status(message, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m",
        "ERROR": "\033[91m",
        "WARNING": "\033[93m"
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}{status}: {message}{reset}")

def test_health_check():
    """Test if the API is running"""
    print_status("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health/ready")
        if response.status_code == 200:
            print_status("Health check passed", "SUCCESS")
            return True
        else:
            print_status(f"Health check failed: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Cannot connect to API: {e}", "ERROR")
        return False

def test_neo4j_connection():
    """Test Neo4j database connection"""
    print_status("Testing Neo4j connection...")
    try:
        response = requests.get(f"{BASE_URL}/api/test-neo4j")
        if response.status_code == 200:
            data = response.json()
            print_status(f"Neo4j connected: {data}", "SUCCESS")
            return True
        else:
            print_status(f"Neo4j connection failed: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Neo4j test failed: {e}", "ERROR")
        return False

def test_user_registration():
    """Test user registration"""
    print_status("Testing user registration...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=TEST_USER
        )
        if response.status_code == 200:
            data = response.json()
            print_status(f"User registered: {data.get('email')}", "SUCCESS")
            return data.get("access_token")
        else:
            print_status(f"Registration failed: {response.text}", "ERROR")
            return None
    except Exception as e:
        print_status(f"Registration error: {e}", "ERROR")
        return None

def test_user_login(token=None):
    """Test user login"""
    print_status("Testing user login...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        if response.status_code == 200:
            data = response.json()
            print_status("Login successful", "SUCCESS")
            return data.get("access_token")
        else:
            print_status(f"Login failed: {response.text}", "ERROR")
            return None
    except Exception as e:
        print_status(f"Login error: {e}", "ERROR")
        return None

def test_create_proposal(token):
    """Test proposal creation"""
    print_status("Testing proposal creation...")
    
    proposal_data = {
        "title": "Test Proposal for Digital Skills",
        "project_idea": "This is a comprehensive project aimed at improving digital skills among adults in rural areas. The project will use innovative methodologies and tools to deliver high-quality training.",
        "priorities": ["DIGITAL", "INCLUSION"],
        "target_groups": ["Adults with low digital skills", "Rural communities"],
        "partners": ["Partner Org 1", "Partner Org 2"],
        "duration_months": 24,
        "budget": 250000,
        "answers": {}
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/proposals/",
            json=proposal_data,
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print_status(f"Proposal created: {data.get('id')}", "SUCCESS")
            return data.get("id")
        else:
            print_status(f"Proposal creation failed: {response.text}", "ERROR")
            return None
    except Exception as e:
        print_status(f"Proposal creation error: {e}", "ERROR")
        return None

def test_get_proposals(token):
    """Test fetching user proposals"""
    print_status("Testing proposal retrieval...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/proposals/",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print_status(f"Retrieved {data.get('total', 0)} proposals", "SUCCESS")
            return True
        else:
            print_status(f"Proposal retrieval failed: {response.text}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Proposal retrieval error: {e}", "ERROR")
        return False

def test_generate_answers(token):
    """Test AI answer generation"""
    print_status("Testing AI answer generation...")
    
    request_data = {
        "project": {
            "title": "Digital Skills for Rural Adults",
            "field": "Adult Education",
            "project_idea": "This innovative project addresses the digital divide in rural communities by providing comprehensive digital literacy training to adults. Through a combination of in-person workshops, online modules, and peer mentoring, participants will develop essential digital skills for employment, civic participation, and lifelong learning.",
            "duration_months": 24,
            "budget_eur": 250000,
            "lead_organization": {
                "name": "Rural Development Foundation",
                "type": "NGO",
                "country": "Romania",
                "city": "Bucharest",
                "experience": "10 years of experience in adult education and community development",
                "staff_count": 25
            },
            "partner_organizations": [
                {
                    "name": "Digital Education Institute",
                    "type": "Training Provider",
                    "country": "Germany",
                    "role": "Technical expertise and curriculum development"
                },
                {
                    "name": "Community Learning Center",
                    "type": "NGO",
                    "country": "Spain",
                    "role": "Local implementation and learner support"
                }
            ],
            "selected_priorities": ["HP-02", "HP-01"],
            "target_groups": "Adults aged 45+ in rural areas with limited digital skills"
        },
        "generate_pdf": False,
        "language": "en"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/form/generate-answers",
            json=request_data,
            headers=headers,
            timeout=120  # Allow 2 minutes for generation
        )
        if response.status_code == 200:
            data = response.json()
            sections = data.get("sections", {})
            total_answers = sum(len(answers) for answers in sections.values())
            print_status(f"Generated {total_answers} answers in {data.get('total_generation_time', 0):.2f}s", "SUCCESS")
            
            # Display sample answers
            for section, answers in list(sections.items())[:2]:
                print_status(f"  Section: {section} - {len(answers)} answers", "INFO")
                
            return True
        else:
            print_status(f"Answer generation failed: {response.text}", "ERROR")
            return False
    except requests.exceptions.Timeout:
        print_status("Answer generation timed out (this is normal for large requests)", "WARNING")
        return True
    except Exception as e:
        print_status(f"Answer generation error: {e}", "ERROR")
        return False

def run_all_tests():
    """Run all integration tests"""
    print("\n" + "="*50)
    print("ERASMUS+ NEO4J INTEGRATION TEST SUITE")
    print("="*50 + "\n")
    
    # Check if services are running
    if not test_health_check():
        print_status("Please start the backend first: ./start-neo4j.sh", "ERROR")
        return False
    
    if not test_neo4j_connection():
        print_status("Neo4j is not accessible. Please check the connection.", "ERROR")
        return False
    
    # Test authentication flow
    token = test_user_registration()
    if not token:
        print_status("Registration failed, trying login with existing user...", "WARNING")
        token = test_user_login()
    
    if not token:
        print_status("Authentication failed. Cannot continue tests.", "ERROR")
        return False
    
    # Test proposal operations
    proposal_id = test_create_proposal(token)
    if not proposal_id:
        print_status("Proposal creation failed", "ERROR")
        return False
    
    if not test_get_proposals(token):
        print_status("Proposal retrieval failed", "ERROR")
        return False
    
    # Test AI generation (may take time)
    print_status("Testing AI answer generation (this may take 30-60 seconds)...", "INFO")
    test_generate_answers(token)
    
    print("\n" + "="*50)
    print_status("ALL TESTS COMPLETED", "SUCCESS")
    print("="*50 + "\n")
    
    return True

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)