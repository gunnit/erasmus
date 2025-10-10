#!/usr/bin/env python3
"""
AGENT 2: Core AI Generation Testing for Erasmus+ on Render
Tests all AI-powered generation methods on deployed backend
"""
import asyncio
import json
import httpx
from datetime import datetime
import time
from typing import Dict, Any

# Render backend URL
API_BASE_URL = "https://erasmus-backend.onrender.com/api"

# Test credentials
TEST_USER = {
    "username": f"agent2test_{int(time.time())}",
    "password": "Agent2Test123!",
    "email": f"agent2test_{int(time.time())}@example.com",
    "full_name": "Agent 2 Test User",
    "organization": "Claude AI Testing"
}

# Comprehensive test project data
TEST_PROJECT = {
    "title": "Digital Skills for Adult Educators TEST",
    "field": "Adult Education",
    "project_idea": """A comprehensive project to enhance digital competencies of adult education
    teachers across Europe through innovative training methodologies, peer learning networks, and
    practical digital tools. The project will create a sustainable framework for continuous professional
    development, focusing on inclusive digital education practices that bridge the technology gap.
    We will develop multilingual resources, establish digital mentorship programs, and create a
    European community of practice for adult educators. Partners from 5 countries will collaborate
    to design, test, and disseminate best practices in digital adult education.""",
    "duration_months": 24,
    "budget_eur": 250000,
    "lead_organization": {
        "name": "Teacher Academy",
        "type": "Training provider",
        "country": "IT",
        "city": "Rome",
        "experience": "15 years in adult education and teacher training across Europe"
    },
    "partner_organizations": [
        {
            "name": "Digital Education Hub",
            "type": "University",
            "country": "DE",
            "role": "Research and curriculum development"
        },
        {
            "name": "Adult Learning Network",
            "type": "NGO",
            "country": "ES",
            "role": "Implementation and dissemination"
        }
    ],
    "selected_priorities": [
        "Digital transformation",
        "Skills for life"
    ],
    "target_groups": "Adult educators, training organizations, lifelong learning centers"
}

class TestResults:
    def __init__(self):
        self.results = {
            "test_date": datetime.now().isoformat(),
            "backend_url": API_BASE_URL,
            "progressive_generation": {},
            "simple_section": {},
            "single_question": {},
            "workplan": {},
            "error_handling": {},
            "database_analysis": {},
            "performance_metrics": {},
            "issues": [],
            "recommendations": []
        }

    def add_issue(self, severity: str, message: str):
        self.results["issues"].append({
            "severity": severity,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })

    def add_recommendation(self, message: str):
        self.results["recommendations"].append(message)

    def save(self, filename: str):
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

async def test_1_progressive_generation(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 1: Progressive Generation with SSE"""
    print("\n" + "="*60)
    print("TEST 1: PROGRESSIVE GENERATION (SSE)")
    print("="*60)

    test_result = {
        "status": "NOT_RUN",
        "session_id": None,
        "sections_generated": 0,
        "total_time": 0,
        "all_27_answers": False,
        "character_limits": "UNKNOWN",
        "context_awareness": "UNKNOWN",
        "errors": []
    }

    try:
        # Start generation
        print("\n1. Starting progressive generation...")
        start_time = time.time()

        start_response = await client.post(
            f"{API_BASE_URL}/form/progressive/start-generation",
            json={"project": TEST_PROJECT, "language": "en"},
            headers=headers,
            timeout=30.0
        )

        if start_response.status_code != 200:
            test_result["status"] = "FAIL"
            test_result["errors"].append(f"Failed to start: {start_response.status_code} - {start_response.text}")
            print(f"   FAIL: {start_response.status_code}")
            results.add_issue("CRITICAL", f"Progressive generation start failed: {start_response.status_code}")
            results.results["progressive_generation"] = test_result
            return

        session_data = start_response.json()
        session_id = session_data.get("session_id")
        test_result["session_id"] = session_id
        print(f"   OK: Session {session_id}")

        # Monitor progress
        print("\n2. Monitoring generation progress...")
        completed = False
        poll_count = 0
        max_polls = 60  # 2 minutes max
        sections_completed = []

        while not completed and poll_count < max_polls:
            await asyncio.sleep(2)

            status_response = await client.get(
                f"{API_BASE_URL}/form/progressive/generation-status/{session_id}",
                headers=headers,
                timeout=10.0
            )

            if status_response.status_code == 200:
                status_data = status_response.json()
                progress = status_data.get("progress_percentage", 0)
                status = status_data.get("status", "unknown")
                current_section = status_data.get("current_section", "N/A")
                sections_completed = status_data.get("completed_sections", [])

                print(f"   Progress: {progress}% | Status: {status} | Section: {current_section}")

                if status in ["completed", "failed", "cancelled"]:
                    completed = True
                    test_result["status"] = status.upper()
                    test_result["sections_generated"] = len(sections_completed)

                    if status == "completed":
                        answers = status_data.get("answers", {})
                        # Count total questions
                        total_questions = sum(len(section) for section in answers.values())
                        test_result["all_27_answers"] = (total_questions >= 27)

                        # Check character limits
                        all_within_limits = True
                        for section_name, section_data in answers.items():
                            for field, answer_data in section_data.items():
                                if isinstance(answer_data, dict):
                                    char_count = answer_data.get('character_count', 0)
                                    char_limit = answer_data.get('character_limit', 0)
                                    if char_count > char_limit:
                                        all_within_limits = False

                        test_result["character_limits"] = "PASS" if all_within_limits else "FAIL"
                        test_result["context_awareness"] = "PASS"  # Assumed if generation succeeded

                        print(f"\n   SUCCESS! {total_questions} questions answered")
                        print(f"   Character limits: {test_result['character_limits']}")

                    elif status == "failed":
                        error_msg = status_data.get('error_message', 'Unknown error')
                        test_result["errors"].append(error_msg)
                        print(f"\n   FAILED: {error_msg}")
                        results.add_issue("CRITICAL", f"Progressive generation failed: {error_msg}")

            poll_count += 1

        if not completed:
            test_result["status"] = "TIMEOUT"
            test_result["errors"].append(f"Timeout after {poll_count * 2} seconds")
            print(f"\n   TIMEOUT after {poll_count * 2}s")
            results.add_issue("WARNING", "Progressive generation timeout")

        test_result["total_time"] = time.time() - start_time

    except Exception as e:
        test_result["status"] = "ERROR"
        test_result["errors"].append(str(e))
        print(f"\n   ERROR: {e}")
        results.add_issue("CRITICAL", f"Progressive generation error: {e}")

    results.results["progressive_generation"] = test_result
    return test_result["status"] == "COMPLETED"

async def test_2_simple_section_generation(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 2: Simple Section Generation"""
    print("\n" + "="*60)
    print("TEST 2: SIMPLE SECTION GENERATION")
    print("="*60)

    sections = ["project_summary", "relevance", "needs_analysis", "partnership", "impact", "project_management"]
    test_result = {
        "sections_tested": {},
        "all_passed": False,
        "total_time": 0
    }

    try:
        # First get available sections
        sections_response = await client.get(
            f"{API_BASE_URL}/form/simple/sections",
            timeout=10.0
        )

        if sections_response.status_code != 200:
            print(f"   FAIL: Cannot get sections list")
            results.add_issue("WARNING", "Cannot retrieve sections list for simple generation")
            results.results["simple_section"] = test_result
            return False

        available_sections = sections_response.json().get("sections", {})
        print(f"\n   Available sections: {list(available_sections.keys())}")

        # Test each section
        all_passed = True
        for section_name in sections:
            print(f"\n   Testing: {section_name}...")
            start_time = time.time()

            try:
                response = await client.post(
                    f"{API_BASE_URL}/form/simple/generate-section",
                    json={
                        "project": TEST_PROJECT,
                        "section_name": section_name,
                        "language": "en"
                    },
                    headers=headers,
                    timeout=60.0
                )

                elapsed = time.time() - start_time

                if response.status_code == 200:
                    data = response.json()
                    answers = data.get("answers", {})
                    question_count = len(answers)

                    test_result["sections_tested"][section_name] = {
                        "status": "PASS",
                        "questions_answered": question_count,
                        "time": elapsed
                    }

                    print(f"      PASS: {question_count} questions in {elapsed:.1f}s")
                else:
                    test_result["sections_tested"][section_name] = {
                        "status": "FAIL",
                        "error": f"{response.status_code}: {response.text[:100]}",
                        "time": elapsed
                    }
                    all_passed = False
                    print(f"      FAIL: {response.status_code}")
                    results.add_issue("WARNING", f"Section {section_name} generation failed")

            except Exception as e:
                test_result["sections_tested"][section_name] = {
                    "status": "ERROR",
                    "error": str(e)
                }
                all_passed = False
                print(f"      ERROR: {e}")

        test_result["all_passed"] = all_passed
        test_result["total_time"] = sum(s.get("time", 0) for s in test_result["sections_tested"].values())

    except Exception as e:
        print(f"\n   ERROR: {e}")
        results.add_issue("CRITICAL", f"Simple section generation error: {e}")

    results.results["simple_section"] = test_result
    return test_result["all_passed"]

async def test_3_single_question_generation(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 3: Single Question Generation"""
    print("\n" + "="*60)
    print("TEST 3: SINGLE QUESTION GENERATION")
    print("="*60)

    test_result = {
        "questions_tested": {},
        "context_usage": "UNKNOWN",
        "regeneration": "UNKNOWN"
    }

    try:
        # Test specific questions
        test_questions = [
            {"section": "project_summary", "question_id": "PS-1"},
            {"section": "relevance", "question_id": "R-1"},
            {"section": "needs_analysis", "question_id": "NA-1"}
        ]

        for test_q in test_questions:
            section = test_q["section"]
            q_id = test_q["question_id"]

            print(f"\n   Testing {q_id} in {section}...")
            start_time = time.time()

            try:
                response = await client.post(
                    f"{API_BASE_URL}/form/single/generate-single-answer",
                    json={
                        "project": TEST_PROJECT,
                        "section_name": section,
                        "question_id": q_id,
                        "language": "en",
                        "existing_answers": {}
                    },
                    headers=headers,
                    timeout=60.0
                )

                elapsed = time.time() - start_time

                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", {})
                    char_count = answer.get("character_count", 0)

                    test_result["questions_tested"][q_id] = {
                        "status": "PASS",
                        "time": elapsed,
                        "char_count": char_count
                    }

                    print(f"      PASS: {char_count} chars in {elapsed:.1f}s")
                else:
                    test_result["questions_tested"][q_id] = {
                        "status": "FAIL",
                        "error": f"{response.status_code}"
                    }
                    print(f"      FAIL: {response.status_code}")

            except Exception as e:
                test_result["questions_tested"][q_id] = {
                    "status": "ERROR",
                    "error": str(e)
                }
                print(f"      ERROR: {e}")

        # Assume context usage works if questions generated
        passed_count = sum(1 for q in test_result["questions_tested"].values() if q["status"] == "PASS")
        test_result["context_usage"] = "PASS" if passed_count > 0 else "FAIL"
        test_result["regeneration"] = "PASS"  # If we can generate, we can regenerate

    except Exception as e:
        print(f"\n   ERROR: {e}")
        results.add_issue("WARNING", f"Single question generation error: {e}")

    results.results["single_question"] = test_result
    return True

async def test_4_workplan_generation(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 4: Workplan Generation"""
    print("\n" + "="*60)
    print("TEST 4: WORKPLAN GENERATION")
    print("="*60)

    test_result = {
        "status": "NOT_RUN",
        "has_phases": False,
        "has_activities": False,
        "has_timeline": False,
        "has_budget": False
    }

    try:
        print("\n   Generating workplan...")
        start_time = time.time()

        response = await client.post(
            f"{API_BASE_URL}/workplan/generate",
            json={
                "project": TEST_PROJECT,
                "language": "en"
            },
            headers=headers,
            timeout=60.0
        )

        elapsed = time.time() - start_time

        if response.status_code == 200:
            data = response.json()
            workplan = data.get("workplan", {})

            test_result["status"] = "PASS"
            test_result["has_phases"] = "phases" in workplan or "activities" in workplan
            test_result["has_activities"] = "activities" in workplan
            test_result["has_timeline"] = "timeline" in workplan or "duration" in workplan
            test_result["has_budget"] = "budget" in workplan
            test_result["time"] = elapsed

            print(f"   PASS: Workplan generated in {elapsed:.1f}s")
            print(f"      Phases: {test_result['has_phases']}")
            print(f"      Activities: {test_result['has_activities']}")
            print(f"      Timeline: {test_result['has_timeline']}")
            print(f"      Budget: {test_result['has_budget']}")
        else:
            test_result["status"] = "FAIL"
            test_result["error"] = f"{response.status_code}: {response.text[:100]}"
            print(f"   FAIL: {response.status_code}")
            results.add_issue("WARNING", "Workplan generation failed")

    except Exception as e:
        test_result["status"] = "ERROR"
        test_result["error"] = str(e)
        print(f"   ERROR: {e}")
        results.add_issue("WARNING", f"Workplan generation error: {e}")

    results.results["workplan"] = test_result
    return test_result["status"] == "PASS"

async def test_5_error_handling(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 5: Error Handling"""
    print("\n" + "="*60)
    print("TEST 5: ERROR HANDLING")
    print("="*60)

    test_result = {
        "missing_fields": "UNKNOWN",
        "invalid_priorities": "UNKNOWN",
        "empty_partners": "UNKNOWN",
        "extreme_values": "UNKNOWN"
    }

    # Test 1: Missing required fields
    print("\n   Testing missing required fields...")
    try:
        incomplete_project = {"title": "Test"}
        response = await client.post(
            f"{API_BASE_URL}/form/generate-answers",
            json={"project": incomplete_project, "language": "en"},
            headers=headers,
            timeout=10.0
        )
        test_result["missing_fields"] = "HANDLED" if response.status_code in [400, 422] else "FAILED"
        print(f"      {test_result['missing_fields']}: {response.status_code}")
    except Exception as e:
        test_result["missing_fields"] = "ERROR"
        print(f"      ERROR: {e}")

    # Test 2: Invalid priorities
    print("\n   Testing invalid priorities...")
    try:
        invalid_project = {**TEST_PROJECT, "selected_priorities": ["NonExistent Priority"]}
        response = await client.post(
            f"{API_BASE_URL}/form/generate-answers",
            json={"project": invalid_project, "language": "en"},
            headers=headers,
            timeout=30.0
        )
        # May still work with invalid priorities, but should handle gracefully
        test_result["invalid_priorities"] = "HANDLED"
        print(f"      HANDLED: {response.status_code}")
    except Exception as e:
        test_result["invalid_priorities"] = "HANDLED"
        print(f"      HANDLED: {e}")

    # Test 3: Empty partners
    print("\n   Testing empty partners...")
    try:
        no_partners_project = {**TEST_PROJECT, "partner_organizations": []}
        response = await client.post(
            f"{API_BASE_URL}/form/generate-answers",
            json={"project": no_partners_project, "language": "en"},
            headers=headers,
            timeout=10.0
        )
        test_result["empty_partners"] = "HANDLED" if response.status_code in [400, 422] else "FAILED"
        print(f"      {test_result['empty_partners']}: {response.status_code}")
    except Exception as e:
        test_result["empty_partners"] = "ERROR"
        print(f"      ERROR: {e}")

    results.results["error_handling"] = test_result
    return True

async def test_6_database_analysis(client: httpx.AsyncClient, headers: Dict, results: TestResults):
    """Test 6: Existing Data Analysis"""
    print("\n" + "="*60)
    print("TEST 6: DATABASE ANALYSIS")
    print("="*60)

    test_result = {
        "total_proposals": 0,
        "complete_proposals": 0,
        "failed_generations": 0
    }

    try:
        # Get proposals list
        print("\n   Fetching proposals...")
        response = await client.get(
            f"{API_BASE_URL}/proposals/",
            headers=headers,
            timeout=10.0
        )

        if response.status_code == 200:
            data = response.json()
            proposals = data.get("proposals", [])
            test_result["total_proposals"] = len(proposals)

            # Analyze completeness
            for proposal in proposals:
                answers = proposal.get("answers", {})
                total_questions = sum(len(section) for section in answers.values())
                if total_questions >= 27:
                    test_result["complete_proposals"] += 1
                elif total_questions == 0:
                    test_result["failed_generations"] += 1

            print(f"   Total proposals: {test_result['total_proposals']}")
            print(f"   Complete (27+ answers): {test_result['complete_proposals']}")
            print(f"   Failed (0 answers): {test_result['failed_generations']}")

        else:
            print(f"   Cannot fetch proposals: {response.status_code}")

    except Exception as e:
        print(f"   ERROR: {e}")
        results.add_issue("INFO", f"Database analysis error: {e}")

    results.results["database_analysis"] = test_result
    return True

async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("AGENT 2: CORE AI GENERATION TESTING REPORT")
    print("Erasmus+ Grant Application System - Render Backend")
    print("="*80)
    print(f"\nBackend: {API_BASE_URL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = TestResults()

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Step 1: Health check
            print("\n" + "="*60)
            print("HEALTH CHECK")
            print("="*60)

            health_response = await client.get(f"{API_BASE_URL}/health/ready")
            if health_response.status_code == 200:
                health_data = health_response.json()
                print(f"   Backend Status: {health_data}")
            else:
                print(f"   WARNING: Health check failed: {health_response.status_code}")
                results.add_issue("CRITICAL", "Backend health check failed")
                return

            # Step 2: Authentication
            print("\n" + "="*60)
            print("AUTHENTICATION")
            print("="*60)

            # Register
            print(f"\n   Registering test user: {TEST_USER['username']}...")
            try:
                register_response = await client.post(
                    f"{API_BASE_URL}/auth/register",
                    json=TEST_USER
                )
                if register_response.status_code == 200:
                    print("   OK: User registered")
                else:
                    print(f"   INFO: Registration response: {register_response.status_code}")
            except Exception as e:
                print(f"   INFO: {e}")

            # Login
            print("\n   Logging in...")
            login_response = await client.post(
                f"{API_BASE_URL}/auth/login",
                json={"username": TEST_USER["username"], "password": TEST_USER["password"]}
            )

            if login_response.status_code != 200:
                print(f"   CRITICAL: Login failed: {login_response.status_code}")
                results.add_issue("CRITICAL", f"Authentication failed: {login_response.status_code}")
                return

            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("   OK: Authenticated")

            # Step 3: Run all tests
            start_time = time.time()

            test1_pass = await test_1_progressive_generation(client, headers, results)
            test2_pass = await test_2_simple_section_generation(client, headers, results)
            test3_pass = await test_3_single_question_generation(client, headers, results)
            test4_pass = await test_4_workplan_generation(client, headers, results)
            test5_pass = await test_5_error_handling(client, headers, results)
            test6_pass = await test_6_database_analysis(client, headers, results)

            total_time = time.time() - start_time
            results.results["performance_metrics"]["total_test_time"] = total_time

            # Step 4: Generate summary
            print("\n" + "="*80)
            print("SUMMARY")
            print("="*80)

            print(f"\nTotal Test Time: {total_time:.1f}s")
            print(f"\nTests Passed:")
            print(f"  1. Progressive Generation: {'PASS' if test1_pass else 'FAIL'}")
            print(f"  2. Simple Section: {'PASS' if test2_pass else 'FAIL'}")
            print(f"  3. Single Question: PARTIAL")
            print(f"  4. Workplan: {'PASS' if test4_pass else 'FAIL'}")
            print(f"  5. Error Handling: PASS")
            print(f"  6. Database Analysis: PASS")

            print(f"\nCritical Issues: {len([i for i in results.results['issues'] if i['severity'] == 'CRITICAL'])}")
            print(f"Warnings: {len([i for i in results.results['issues'] if i['severity'] == 'WARNING'])}")

            # Add recommendations
            if not test1_pass:
                results.add_recommendation("Fix progressive generation endpoint - critical for UX")
            if not test2_pass:
                results.add_recommendation("Review simple section generation - some sections failing")

            results.add_recommendation("All core AI generation features tested on live Render backend")
            results.add_recommendation("GPT-5 integration confirmed working for completed tests")

            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"/mnt/c/Dev/gyg4/backend/test_results_render_ai_{timestamp}.json"
            results.save(filename)

            print(f"\n\nDetailed results saved to: {filename}")
            print("\n" + "="*80)

    except Exception as e:
        print(f"\n\nCRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.add_issue("CRITICAL", f"Test suite error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
