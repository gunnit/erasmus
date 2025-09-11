#!/usr/bin/env python3
"""Test complete flow: login, generate answers, create proposal"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_complete_flow():
    # Step 1: Try to login
    print("Step 1: Logging in...")
    login_data = {
        "username": "testuser",
        "password": "Test123!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed, trying to register...")
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test123!",
            "full_name": "Test User",
            "organization": "Test Organization"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code != 200:
            print(f"Registration failed: {response.status_code} - {response.text}")
            return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ Authentication successful")
    
    # Step 2: Generate answers
    print("\nStep 2: Generating answers...")
    project_data = {
        "project": {
            "title": "Digital Skills for Seniors",
            "field": "Adult Education",
            "project_idea": "A comprehensive program to teach digital literacy to seniors aged 65 and above, focusing on essential digital skills including internet safety, online communication, digital banking, and government e-services. The project will use peer-to-peer learning methodologies and intergenerational exchanges to create a supportive learning environment.",
            "duration_months": 24,
            "budget_eur": 250000,
            "lead_organization": {
                "name": "Tech Education Foundation",
                "type": "NGO",
                "country": "Germany",
                "city": "Berlin",
                "experience": "15 years of experience in adult education and digital literacy programs"
            },
            "partner_organizations": [
                {"name": "Senior Community Center", "type": "PUBLIC", "country": "France", "role": "Local implementation and participant recruitment"},
                {"name": "Digital Inclusion Network", "type": "NGO", "country": "Spain", "role": "Curriculum development and trainer training"}
            ],
            "selected_priorities": ["HP-02"],
            "target_groups": "Seniors aged 65 and above, particularly those from disadvantaged backgrounds or rural areas with limited digital access"
        },
        "generate_pdf": False,
        "language": "en"
    }
    
    response = requests.post(
        f"{BASE_URL}/form/generate-answers", 
        json=project_data,
        headers=headers,
        timeout=120
    )
    
    if response.status_code != 200:
        print(f"Answer generation failed: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    answers = response.json()
    print(f"✓ Generated {len(answers.get('answers', {}))} answers")
    
    # Step 3: Create proposal
    print("\nStep 3: Creating proposal...")
    proposal_data = {
        "title": project_data["project"]["title"],
        "project_idea": project_data["project"]["project_idea"],
        "priorities": project_data["project"]["selected_priorities"],
        "target_groups": [project_data["project"]["target_groups"]],
        "partners": project_data["project"]["partner_organizations"],
        "duration_months": project_data["project"]["duration_months"],
        "budget": str(project_data["project"]["budget_eur"]),
        "answers": answers.get("answers", {})
    }
    
    response = requests.post(
        f"{BASE_URL}/proposals/",
        json=proposal_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"Proposal creation failed: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    proposal = response.json()
    print(f"✓ Proposal created with ID: {proposal['id']}")
    
    # Step 4: Get proposals list
    print("\nStep 4: Retrieving proposals...")
    response = requests.get(f"{BASE_URL}/proposals/", headers=headers)
    
    if response.status_code == 200:
        proposals = response.json()
        print(f"✓ Found {len(proposals)} proposals")
    
    print("\n✅ All tests passed successfully!")

if __name__ == "__main__":
    test_complete_flow()