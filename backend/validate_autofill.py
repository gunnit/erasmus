"""
Validation script to ensure auto-fill structure is correct
"""
import json
import sys
import os

def validate_autofill_setup():
    """Validate that all components are in place for auto-fill"""
    
    print("="*60)
    print("VALIDATING AUTO-FILL SETUP")
    print("="*60)
    
    issues = []
    
    # 1. Check if form_questions.json exists and has all sections
    print("\n1. Checking form_questions.json...")
    if os.path.exists('data/form_questions.json'):
        with open('data/form_questions.json', 'r') as f:
            form_questions = json.load(f)
        
        required_sections = [
            'project_summary',
            'relevance', 
            'needs_analysis',
            'partnership',
            'impact',
            'project_management'
        ]
        
        total_questions = 0
        questions_per_section = {}
        
        for section in required_sections:
            if section in form_questions['sections']:
                questions = form_questions['sections'][section].get('questions', [])
                count = len(questions)
                questions_per_section[section] = count
                total_questions += count
                print(f"   ✅ {section}: {count} questions")
            else:
                issues.append(f"Missing section: {section}")
                print(f"   ❌ {section}: MISSING")
        
        print(f"\n   Total questions: {total_questions}")
        
        # List all questions
        print("\n2. All questions that will be auto-filled:")
        print("-" * 40)
        question_number = 1
        for section_key, section_data in form_questions['sections'].items():
            print(f"\n   {section_key.upper()}:")
            for q in section_data.get('questions', []):
                print(f"   {question_number}. [{q['id']}] {q['field']}")
                print(f"      Question: {q['question'][:80]}...")
                print(f"      Limit: {q.get('character_limit', 'No limit')} chars")
                question_number += 1
    else:
        issues.append("form_questions.json not found")
        print("   ❌ File not found!")
    
    # 2. Check if AI services exist
    print("\n3. Checking AI services...")
    services = [
        'app/services/ai_autofill_service.py',
        'app/services/prompts_config.py',
        'app/services/openai_service.py'
    ]
    
    for service in services:
        if os.path.exists(service):
            print(f"   ✅ {service}")
        else:
            issues.append(f"Missing service: {service}")
            print(f"   ❌ {service}")
    
    # 3. Check if form_generator is updated
    print("\n4. Checking form_generator.py...")
    if os.path.exists('app/api/form_generator.py'):
        with open('app/api/form_generator.py', 'r') as f:
            content = f.read()
            
        if 'AIAutoFillService' in content:
            print("   ✅ Using AIAutoFillService")
        else:
            issues.append("form_generator.py not using AIAutoFillService")
            print("   ❌ Not using AIAutoFillService")
            
        if 'auto_fill_complete_application' in content:
            print("   ✅ Calling auto_fill_complete_application")
        else:
            issues.append("Not calling auto_fill_complete_application method")
            print("   ❌ Not calling auto_fill_complete_application")
    else:
        issues.append("form_generator.py not found")
        print("   ❌ File not found!")
    
    # 4. Check .env configuration
    print("\n5. Checking .env configuration...")
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            env_content = f.read()
        
        if 'OPENAI_API_KEY' in env_content:
            # Check if it's not empty
            lines = env_content.split('\n')
            for line in lines:
                if line.startswith('OPENAI_API_KEY='):
                    value = line.split('=', 1)[1].strip()
                    if value and value != 'your-api-key-here':
                        print("   ✅ OPENAI_API_KEY configured")
                    else:
                        issues.append("OPENAI_API_KEY not properly set")
                        print("   ❌ OPENAI_API_KEY not properly set")
                    break
        else:
            issues.append("OPENAI_API_KEY not in .env")
            print("   ❌ OPENAI_API_KEY not found in .env")
    else:
        issues.append(".env file not found")
        print("   ❌ .env file not found")
    
    # Summary
    print("\n" + "="*60)
    if not issues:
        print("✨ SUCCESS! Auto-fill system is properly configured!")
        print("\nThe system will auto-fill ALL {} questions when a user submits their project idea.".format(total_questions))
        print("\nQuestions are organized in these sections:")
        for section, count in questions_per_section.items():
            print(f"  • {section}: {count} questions")
    else:
        print("⚠️  ISSUES FOUND:")
        for issue in issues:
            print(f"  • {issue}")
        print("\nPlease fix these issues before testing.")
    
    return len(issues) == 0

if __name__ == "__main__":
    success = validate_autofill_setup()
    sys.exit(0 if success else 1)