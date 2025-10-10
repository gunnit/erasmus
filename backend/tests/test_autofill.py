"""
Test script to verify that ALL questions are being auto-filled
"""
import asyncio
import json
from datetime import datetime
from app.services.ai_autofill_service import AIAutoFillService
from app.core.config import settings

async def test_autofill():
    """Test the comprehensive auto-fill functionality"""
    
    print("="*60)
    print("TESTING COMPREHENSIVE AUTO-FILL FUNCTIONALITY")
    print("="*60)
    
    # Load form questions
    with open('data/form_questions.json', 'r') as f:
        form_questions = json.load(f)
    
    # Count total questions
    total_questions = 0
    for section_data in form_questions['sections'].values():
        total_questions += len(section_data.get('questions', []))
    
    print(f"\n📋 Total questions in form: {total_questions}")
    print(f"📂 Sections: {list(form_questions['sections'].keys())}")
    
    # Test project context
    test_project = {
        "title": "Digital Skills for Senior Citizens",
        "field": "Adult Education",
        "project_idea": """
        Our project aims to bridge the digital divide for senior citizens (65+) across Europe 
        by developing an innovative, accessible digital literacy program. The project will create 
        a comprehensive curriculum covering essential digital skills, online safety, and social 
        connectivity. We'll develop multilingual learning materials, train educators, and establish 
        local learning hubs in partner countries. The program uses gamification and peer learning 
        to make technology accessible and enjoyable for seniors, promoting active aging and 
        social inclusion. We'll also create a support network of digital mentors from younger 
        generations, fostering intergenerational dialogue.
        """,
        "duration": "24 months",
        "budget": 250000,
        "lead_org": {
            "name": "European Digital Inclusion Foundation",
            "type": "NGO",
            "country": "Germany",
            "city": "Berlin",
            "experience": "10 years experience in digital education and senior citizen programs",
            "staff_count": 25
        },
        "partners": [
            {
                "name": "Silver Surfers Association",
                "type": "NGO",
                "country": "Spain",
                "role": "Local implementation and senior outreach"
            },
            {
                "name": "TechEd University",
                "type": "University",
                "country": "Finland",
                "role": "Curriculum development and research"
            },
            {
                "name": "Digital Futures Institute",
                "type": "Research Institute",
                "country": "Netherlands",
                "role": "Impact assessment and evaluation"
            }
        ],
        "selected_priorities": [
            "Digital transformation",
            "Inclusion and diversity",
            "Key competences development"
        ],
        "target_groups": "Senior citizens aged 65+, adult educators, community centers, libraries"
    }
    
    # Initialize service
    print("\n🤖 Initializing AI Auto-fill Service...")
    service = AIAutoFillService()
    
    # Test auto-fill
    print("🚀 Starting comprehensive auto-fill process...")
    print("   This will fill ALL questions automatically...")
    
    start_time = datetime.now()
    
    try:
        # Run auto-fill
        results = await service.auto_fill_complete_application(
            project_context=test_project,
            form_questions=form_questions,
            language="en"
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Analyze results
        print(f"\n✅ Auto-fill completed in {duration:.1f} seconds")
        print("\n📊 RESULTS ANALYSIS:")
        print("-" * 40)
        
        answered_questions = 0
        section_summary = []
        
        for section_key, section_answers in results.items():
            section_count = len(section_answers)
            answered_questions += section_count
            
            section_summary.append(f"  • {section_key}: {section_count} questions")
            
            # Show sample answers
            if section_count > 0:
                first_field = list(section_answers.keys())[0]
                first_answer = section_answers[first_field]
                print(f"\n📝 Sample from {section_key}:")
                print(f"   Question: {first_field}")
                print(f"   Answer preview: {first_answer['answer'][:200]}...")
                print(f"   Character count: {first_answer['character_count']}/{first_answer['character_limit']}")
                if 'quality_score' in first_answer:
                    print(f"   Quality score: {first_answer['quality_score']:.2f}/1.00")
        
        print("\n📈 SECTION BREAKDOWN:")
        for summary in section_summary:
            print(summary)
        
        print(f"\n🎯 COMPLETION STATUS:")
        print(f"   Total questions: {total_questions}")
        print(f"   Questions answered: {answered_questions}")
        print(f"   Completion rate: {(answered_questions/total_questions)*100:.1f}%")
        
        if answered_questions == total_questions:
            print("\n✨ SUCCESS! All questions have been auto-filled!")
        else:
            missing = total_questions - answered_questions
            print(f"\n⚠️  WARNING: {missing} questions were not filled")
        
        # Check answer quality
        print("\n🔍 QUALITY CHECK:")
        total_quality = 0
        quality_count = 0
        
        for section_answers in results.values():
            for answer_data in section_answers.values():
                if 'quality_score' in answer_data:
                    total_quality += answer_data['quality_score']
                    quality_count += 1
        
        if quality_count > 0:
            avg_quality = total_quality / quality_count
            print(f"   Average quality score: {avg_quality:.2f}/1.00")
            
            if avg_quality >= 0.7:
                print("   ✅ High quality answers generated")
            elif avg_quality >= 0.5:
                print("   ⚠️  Moderate quality - may need review")
            else:
                print("   ❌ Low quality - needs improvement")
        
        # Save results for inspection
        output_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump({
                "test_date": datetime.now().isoformat(),
                "project": test_project,
                "results": results,
                "statistics": {
                    "total_questions": total_questions,
                    "answered_questions": answered_questions,
                    "completion_rate": (answered_questions/total_questions)*100,
                    "generation_time": duration,
                    "average_quality": avg_quality if quality_count > 0 else 0
                }
            }, f, indent=2, default=str)
        
        print(f"\n💾 Full results saved to: {output_file}")
        
        return results
        
    except Exception as e:
        print(f"\n❌ ERROR during auto-fill: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Check if API key is configured
    if not settings.OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not configured in .env file")
        print("Please add: OPENAI_API_KEY=your-api-key-here")
    else:
        print(f"✅ OpenAI API Key configured")
        print(f"🤖 Using model: {settings.OPENAI_MODEL}")
        
        # Run the test
        asyncio.run(test_autofill())