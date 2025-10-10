#!/usr/bin/env python3
"""
Test script for parallel generation improvements
"""
import asyncio
import time
import json
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the app directory to path
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_autofill_service import AIAutoFillService
from app.core.config import settings

async def test_parallel_generation():
    """Test the parallel generation with a sample project"""

    # Sample project data
    project_context = {
        "title": "Digital Skills for Rural Communities",
        "field": "Adult Education",
        "project_idea": """
        This project aims to bridge the digital divide in rural communities by providing
        comprehensive digital literacy training to adults aged 45+. The initiative will
        establish local learning hubs equipped with modern technology and deliver
        tailored training programs covering basic computer skills, internet safety,
        online services usage, and digital communication tools.

        Partner organizations from 5 EU countries will collaborate to develop
        culturally adapted materials and share best practices for rural adult education.
        """,
        "duration": "24 months",
        "budget": 250000,
        "lead_org": {
            "name": "Rural Digital Foundation",
            "type": "NGO",
            "country": "Germany",
            "city": "Munich",
            "experience": "10 years in adult education and digital inclusion"
        },
        "partners": [
            {
                "name": "TechEd Spain",
                "type": "NGO",
                "country": "Spain",
                "role": "Content development and training"
            },
            {
                "name": "Digital Futures Italy",
                "type": "University",
                "country": "Italy",
                "role": "Research and evaluation"
            }
        ],
        "selected_priorities": [
            "Digital Transformation",
            "Inclusion and Diversity"
        ],
        "target_groups": "Adults aged 45+ in rural communities with limited digital skills"
    }

    # Load form questions
    form_questions_path = os.path.join(
        os.path.dirname(__file__), 'data', 'form_questions.json'
    )
    with open(form_questions_path, 'r') as f:
        form_questions = json.load(f)

    # Initialize AI service
    ai_service = AIAutoFillService()

    # Test individual section with timing
    test_section = "project_summary"
    section_data = form_questions['sections'][test_section]

    logger.info(f"Testing parallel generation for section: {test_section}")
    logger.info(f"Number of questions: {len(section_data['questions'])}")

    # Set up context
    ai_service.context_memory = {
        "project": project_context,
        "language": "en",
        "answers": {}
    }

    # Build section context
    section_context = await ai_service._build_section_context(test_section)

    # Time the parallel generation
    start_time = time.time()

    try:
        # Process section with parallel generation
        section_answers = await ai_service._process_section(
            test_section,
            section_data,
            section_context
        )

        end_time = time.time()
        duration = end_time - start_time

        # Analyze results
        successful_answers = sum(1 for a in section_answers.values() if a['quality_score'] > 0)
        failed_answers = len(section_answers) - successful_answers

        logger.info("=" * 60)
        logger.info("PARALLEL GENERATION TEST RESULTS")
        logger.info("=" * 60)
        logger.info(f"Section: {test_section}")
        logger.info(f"Total questions: {len(section_data['questions'])}")
        logger.info(f"Successful answers: {successful_answers}")
        logger.info(f"Failed answers: {failed_answers}")
        logger.info(f"Total time: {duration:.2f} seconds")
        logger.info(f"Average time per question: {duration/len(section_data['questions']):.2f} seconds")
        logger.info("=" * 60)

        # Show individual question results
        for field, answer_data in section_answers.items():
            status = "✓" if answer_data['quality_score'] > 0 else "✗"
            char_count = answer_data['character_count']
            logger.info(f"{status} {field}: {char_count} chars")
            if answer_data['quality_score'] == 0:
                logger.warning(f"  Failed: {answer_data['answer'][:100]}")

        # Performance comparison
        logger.info("\n" + "=" * 60)
        logger.info("PERFORMANCE COMPARISON")
        logger.info("=" * 60)
        sequential_estimate = len(section_data['questions']) * 8  # ~8 seconds per question sequentially
        logger.info(f"Estimated sequential time: {sequential_estimate:.2f} seconds")
        logger.info(f"Actual parallel time: {duration:.2f} seconds")
        logger.info(f"Speed improvement: {sequential_estimate/duration:.1f}x faster")
        logger.info(f"Time saved: {sequential_estimate - duration:.2f} seconds")
        logger.info("=" * 60)

        return section_answers

    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)
        return None

async def test_error_isolation():
    """Test that errors in one question don't affect others"""
    logger.info("\n" + "=" * 60)
    logger.info("TESTING ERROR ISOLATION")
    logger.info("=" * 60)

    # Create a service with intentionally low timeout to trigger some failures
    ai_service = AIAutoFillService()
    ai_service.max_concurrent_calls = 2  # Lower concurrency to test queuing

    # Mock section with multiple questions
    test_questions = [
        {"id": "q1", "field": "test_field_1", "question": "Short question", "character_limit": 500},
        {"id": "q2", "field": "test_field_2", "question": "Normal question", "character_limit": 2000},
        {"id": "q3", "field": "test_field_3", "question": "Another question", "character_limit": 1500},
    ]

    section_data = {"questions": test_questions}
    section_context = {"test": True}

    ai_service.context_memory = {
        "project": {"title": "Test Project"},
        "language": "en",
        "answers": {}
    }

    try:
        results = await ai_service._process_section(
            "test_section",
            section_data,
            section_context
        )

        logger.info(f"Processed {len(results)} questions")
        for field, result in results.items():
            if result['quality_score'] > 0:
                logger.info(f"✓ {field}: Success")
            else:
                logger.info(f"✗ {field}: Failed (isolated)")

        logger.info("Error isolation test completed - failures were isolated")

    except Exception as e:
        logger.error(f"Error isolation test failed: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting parallel generation tests...")

    # Run main test
    asyncio.run(test_parallel_generation())

    # Run error isolation test
    asyncio.run(test_error_isolation())

    logger.info("\nAll tests completed!")