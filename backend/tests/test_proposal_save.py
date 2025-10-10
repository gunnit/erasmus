#!/usr/bin/env python3
"""Test script to verify proposal saving with answers"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"

# Test data
test_user = {
    "email": f"test_{datetime.now().timestamp()}@example.com",
    "username": f"testuser_{int(datetime.now().timestamp())}",
    "password": "testpass123",
    "full_name": "Test User",
    "organization": "Test Organization"
}

test_proposal = {
    "title": "Digital Skills for Adult Learners",
    "project_idea": "A comprehensive project to enhance digital literacy among adults aged 45+",
    "priorities": ["Digital transformation", "Inclusion and diversity"],
    "target_groups": ["Adult learners", "Educators", "Senior citizens"],
    "partners": [
        {"name": "Partner Org 1", "country": "Germany", "type": "Education"},
        {"name": "Partner Org 2", "country": "France", "type": "NGO"}
    ],
    "duration_months": 24,
    "budget": "250000",
    "answers": {
        "project_summary": {
            "summary": "This is a test summary of the project focusing on digital skills...",
            "objectives": "To enhance digital literacy and reduce the digital divide...",
            "implementation": "We will implement training workshops and online courses...",
            "results": "Expected to train 500+ adult learners in digital skills..."
        },
        "relevance": {
            "motivation": "The digital divide affects millions of adults...",
            "innovation": "Our innovative approach combines traditional and digital methods...",
            "eu_value": "This project creates EU-wide impact through cross-border collaboration..."
        },
        "needs_analysis": {
            "identified_needs": "Research shows 40% of adults lack basic digital skills...",
            "target_groups": "Primary: Adults 45+, Secondary: Adult educators...",
            "addressing_needs": "Through targeted training programs and support..."
        }
    }
}

def test_proposal_save():
    """Test the complete flow of user registration, login, and proposal saving"""
    
    print("=" * 60)
    print("TESTING PROPOSAL SAVE WITH ANSWERS")
    print("=" * 60)
    
    # 1. Register user
    print("\n1. Registering user...")
    response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return
    
    user_data = response.json()
    token = user_data["access_token"]
    print(f"✅ User registered: {user_data['username']}")
    
    # 2. Create proposal with answers
    print("\n2. Creating proposal with answers...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/proposals/", json=test_proposal, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Proposal creation failed: {response.text}")
        return
    
    proposal_data = response.json()
    proposal_id = proposal_data["id"]
    print(f"✅ Proposal created with ID: {proposal_id}")
    
    # 3. Retrieve proposal to verify answers were saved
    print("\n3. Retrieving proposal to verify answers...")
    response = requests.get(f"{BASE_URL}/proposals/{proposal_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to retrieve proposal: {response.text}")
        return
    
    retrieved_proposal = response.json()
    
    # 4. Verify answers were saved
    print("\n4. Verifying saved data...")
    checks = [
        ("Title", retrieved_proposal.get("title") == test_proposal["title"]),
        ("Project Idea", retrieved_proposal.get("project_idea") == test_proposal["project_idea"]),
        ("Priorities", retrieved_proposal.get("priorities") == test_proposal["priorities"]),
        ("Budget", retrieved_proposal.get("budget") == test_proposal["budget"]),
        ("Answers Present", "answers" in retrieved_proposal and retrieved_proposal["answers"] is not None),
        ("Project Summary", retrieved_proposal.get("answers", {}).get("project_summary") is not None),
        ("Relevance", retrieved_proposal.get("answers", {}).get("relevance") is not None),
        ("Needs Analysis", retrieved_proposal.get("answers", {}).get("needs_analysis") is not None)
    ]
    
    all_passed = True
    for check_name, check_result in checks:
        status = "✅" if check_result else "❌"
        print(f"  {status} {check_name}: {'Saved correctly' if check_result else 'Failed'}")
        if not check_result:
            all_passed = False
    
    # 5. Display sample of saved answers
    if all_passed:
        print("\n5. Sample of saved answers:")
        if "answers" in retrieved_proposal and retrieved_proposal["answers"]:
            answers = retrieved_proposal["answers"]
            if "project_summary" in answers and answers["project_summary"]:
                summary = answers["project_summary"].get("summary", "")
                print(f"  Summary (first 100 chars): {summary[:100]}...")
            print(f"  Total answer sections: {len(answers)}")
            print(f"  Answer sections: {', '.join(answers.keys())}")
    
    # 6. Test dashboard stats
    print("\n6. Testing dashboard stats...")
    response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Dashboard stats retrieved:")
        print(f"  Total proposals: {stats['stats']['total_proposals']}")
        print(f"  Draft proposals: {stats['stats']['draft_proposals']}")
    else:
        print(f"❌ Failed to get dashboard stats: {response.text}")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Proposals with answers are being saved correctly!")
    else:
        print("❌ Some tests failed - Check the implementation")
    print("=" * 60)

if __name__ == "__main__":
    test_proposal_save()