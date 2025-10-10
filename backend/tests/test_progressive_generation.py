#!/usr/bin/env python3
"""
Test script for progressive generation functionality
"""
import asyncio
import json
import httpx
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api"
TEST_USER = {
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com",
    "full_name": "Test User",
    "organization": "Test Org"
}

TEST_PROJECT = {
    "title": "Innovative Adult Education for Digital Skills",
    "field": "Adult Education",
    "project_idea": """
    This project aims to bridge the digital divide in adult education by developing 
    innovative methodologies and tools that enhance digital literacy among adults 
    aged 45+. The project will create a comprehensive framework for digital skills 
    training, incorporating gamification, peer learning, and practical applications 
    relevant to daily life and professional development. Through partnerships across 
    5 EU countries, we will develop, test, and disseminate best practices that can 
    be scaled across Europe.
    """,
    "duration_months": 24,
    "budget_eur": 250000,
    "lead_organization": {
        "name": "Digital Education Foundation",
        "type": "NGO",
        "country": "Germany",
        "city": "Berlin",
        "experience": "10 years in adult education and digital literacy programs"
    },
    "partner_organizations": [
        {
            "name": "Adult Learning Institute",
            "type": "EDUCATION",
            "country": "Spain",
            "role": "Curriculum development and pilot testing"
        },
        {
            "name": "Tech for Seniors Association",
            "type": "NGO",
            "country": "Italy",
            "role": "Technology adaptation and user testing"
        }
    ],
    "selected_priorities": [
        "HP-02 - Digital Transformation",
        "AE-01 - Key Competences"
    ],
    "target_groups": "Adults aged 45+, educators in adult learning centers, social workers"
}

async def test_progressive_generation():
    """Test the progressive generation endpoints"""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        print("\n" + "="*50)
        print("PROGRESSIVE GENERATION TEST")
        print("="*50)
        
        # Step 1: Register/Login
        print("\n1. Authenticating...")
        
        # Try to register (may fail if user exists)
        try:
            register_response = await client.post(
                f"{API_BASE_URL}/auth/register",
                json=TEST_USER
            )
            print(f"   ✓ User registered: {register_response.status_code}")
        except:
            print("   - User already exists, proceeding to login")
        
        # Login
        login_response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"username": TEST_USER["username"], "password": TEST_USER["password"]}
        )
        
        if login_response.status_code != 200:
            print(f"   ✗ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   ✓ Logged in successfully")
        
        # Step 2: Start Progressive Generation
        print("\n2. Starting progressive generation...")
        start_response = await client.post(
            f"{API_BASE_URL}/form/progressive/start-generation",
            json={"project": TEST_PROJECT, "language": "en"},
            headers=headers
        )
        
        if start_response.status_code != 200:
            print(f"   ✗ Failed to start generation: {start_response.status_code}")
            print(f"   Response: {start_response.text}")
            return
        
        session_data = start_response.json()
        session_id = session_data["session_id"]
        print(f"   ✓ Generation started - Session ID: {session_id}")
        
        # Step 3: Poll for status updates
        print("\n3. Monitoring generation progress...")
        completed = False
        max_polls = 60  # Max 2 minutes of polling
        poll_count = 0
        
        while not completed and poll_count < max_polls:
            await asyncio.sleep(2)  # Poll every 2 seconds
            
            status_response = await client.get(
                f"{API_BASE_URL}/form/progressive/generation-status/{session_id}",
                headers=headers
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                progress = status_data["progress_percentage"]
                status = status_data["status"]
                current_section = status_data.get("current_section", "N/A")
                completed_sections = status_data.get("completed_sections", [])
                
                print(f"   Progress: {progress}% | Status: {status} | Current: {current_section}")
                print(f"   Completed sections: {', '.join(completed_sections) if completed_sections else 'None'}")
                
                if status in ["completed", "failed", "cancelled"]:
                    completed = True
                    
                    if status == "completed":
                        print(f"\n   ✓ Generation completed successfully!")
                        
                        # Display generated answers summary
                        answers = status_data.get("answers", {})
                        print(f"\n   Generated sections: {len(answers)}")
                        
                        for section_name, section_data in answers.items():
                            print(f"\n   Section: {section_name}")
                            for field, answer_data in section_data.items():
                                if isinstance(answer_data, dict):
                                    char_count = answer_data.get('character_count', 0)
                                    print(f"     - {field}: {char_count} characters")
                    
                    elif status == "failed":
                        print(f"\n   ✗ Generation failed: {status_data.get('error_message', 'Unknown error')}")
                    
                    elif status == "cancelled":
                        print(f"\n   ⚠ Generation was cancelled")
            
            poll_count += 1
        
        if not completed:
            print(f"\n   ⚠ Generation timed out after {poll_count * 2} seconds")
        
        # Step 4: Test individual section generation (if not all completed)
        if completed and status_data.get("completed_sections"):
            print("\n4. Testing individual section retry...")
            
            # Try to regenerate the first section
            first_section = "project_summary"
            retry_response = await client.post(
                f"{API_BASE_URL}/form/progressive/generate-section",
                json={
                    "session_id": session_id,
                    "section_name": first_section,
                    "retry": True
                },
                headers=headers
            )
            
            if retry_response.status_code == 200:
                retry_data = retry_response.json()
                print(f"   ✓ Section '{first_section}' regenerated successfully")
            else:
                print(f"   ✗ Failed to regenerate section: {retry_response.status_code}")
        
        # Step 5: Test cancellation (with a new session)
        print("\n5. Testing cancellation...")
        cancel_start_response = await client.post(
            f"{API_BASE_URL}/form/progressive/start-generation",
            json={"project": TEST_PROJECT, "language": "en"},
            headers=headers
        )
        
        if cancel_start_response.status_code == 200:
            cancel_session_id = cancel_start_response.json()["session_id"]
            print(f"   Started new session: {cancel_session_id}")
            
            # Wait a moment then cancel
            await asyncio.sleep(2)
            
            cancel_response = await client.post(
                f"{API_BASE_URL}/form/progressive/cancel-generation/{cancel_session_id}",
                headers=headers
            )
            
            if cancel_response.status_code == 200:
                print(f"   ✓ Generation cancelled successfully")
            else:
                print(f"   ✗ Failed to cancel: {cancel_response.status_code}")
        
        print("\n" + "="*50)
        print("TEST COMPLETED")
        print("="*50)

async def test_traditional_generation():
    """Test the traditional (non-progressive) generation for comparison"""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        print("\n" + "="*50)
        print("TRADITIONAL GENERATION TEST")
        print("="*50)
        
        # Login
        login_response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"username": TEST_USER["username"], "password": TEST_USER["password"]}
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\nStarting traditional generation (this may take 30-60 seconds)...")
        start_time = datetime.now()
        
        response = await client.post(
            f"{API_BASE_URL}/form/generate-answers",
            json={
                "project": TEST_PROJECT,
                "generate_pdf": False,
                "language": "en"
            },
            headers=headers
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Generation completed in {duration:.1f} seconds")
            print(f"  Sections generated: {len(data.get('sections', {}))}")
            print(f"  Total generation time reported: {data.get('total_generation_time', 0):.1f}s")
        else:
            print(f"✗ Generation failed: {response.status_code}")
            print(f"  Response: {response.text}")

async def main():
    """Run all tests"""
    
    print("\n" + "="*60)
    print("ERASMUS+ PROGRESSIVE GENERATION TEST SUITE")
    print("="*60)
    print("\nMake sure the backend is running on http://localhost:8000")
    print("and the database migrations have been applied.")
    
    try:
        # Test progressive generation
        await test_progressive_generation()
        
        # Test traditional generation for comparison
        await test_traditional_generation()
        
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())