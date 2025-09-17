#!/usr/bin/env python3
"""
Test script for quality scoring functionality
"""
import asyncio
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.quality_scorer import QualityScorer

async def test_quality_scoring():
    """Test the quality scoring system with sample data"""
    print("🧪 Testing Quality Scoring System\n")
    print("=" * 50)

    # Initialize scorer
    scorer = QualityScorer()
    print("✓ Quality scorer initialized")

    # Sample proposal data (abbreviated for testing)
    test_proposal = {
        'title': 'Digital Skills for Adult Learners',
        'project_idea': 'A comprehensive digital skills training program for adults',
        'priorities': ['Digital transformation', 'Inclusion and diversity'],
        'target_groups': ['Adult learners', 'Educators'],
        'partners': [
            {'name': 'Tech University', 'country': 'Germany'},
            {'name': 'Adult Education Center', 'country': 'France'}
        ],
        'duration_months': 24,
        'budget': '250000',
        'answers': {
            'project_summary': {
                'objectives': {
                    'answer': 'Our project aims to develop comprehensive digital skills training for adult learners across Europe. We will create innovative online learning modules, train 50 educators, and reach 500 adult learners. The objectives are: 1) Develop 10 digital learning modules covering essential digital competences, 2) Train educators in digital pedagogical methods, 3) Create a sustainable online platform for continued learning, 4) Foster cross-border collaboration in adult education.',
                    'character_count': 450,
                    'character_limit': 2000
                },
                'implementation': {
                    'answer': 'Implementation will occur in three phases over 24 months. Phase 1 (Months 1-6): Needs assessment and curriculum development with all partners. Phase 2 (Months 7-18): Pilot training programs in each partner country, gathering feedback and refining materials. Phase 3 (Months 19-24): Full implementation, evaluation, and dissemination of results through conferences and publications.',
                    'character_count': 380,
                    'character_limit': 2000
                },
                'results': {
                    'answer': 'Expected results include: 10 comprehensive digital learning modules available in 4 languages, 50 trained educators with enhanced digital teaching skills, 500 adult learners with improved digital competences, 1 online learning platform, 3 national conferences, 2 academic publications, and sustainable partnerships for continued collaboration beyond the project period.',
                    'character_count': 360,
                    'character_limit': 2000
                }
            },
            'relevance': {
                'priority_addressing': {
                    'answer': 'This project directly addresses the Digital Transformation priority by developing digital skills essential for adult participation in modern society and the labor market. It also promotes Inclusion by ensuring accessibility for disadvantaged adult learners, including those with limited prior digital experience. Our innovative approach combines online and offline methods to reach diverse audiences.',
                    'character_count': 410,
                    'character_limit': 3000
                },
                'motivation': {
                    'answer': 'Recent studies show that 42% of EU adults lack basic digital skills, creating barriers to employment and social participation. The COVID-19 pandemic has accelerated digital transformation, making these skills more critical than ever. Our project responds to this urgent need by providing practical, accessible training that directly improves employability and social inclusion for adult learners.',
                    'character_count': 395,
                    'character_limit': 3000
                }
            },
            'needs_analysis': {
                'needs_addressed': {
                    'answer': 'Through surveys and focus groups with 200 adult learners and 30 educators, we identified critical needs: lack of basic digital skills for daily tasks, insufficient digital pedagogical training for educators, limited accessible learning materials for adults with varying abilities, and absence of sustainable support systems for continued learning.',
                    'character_count': 350,
                    'character_limit': 3000
                }
            },
            'partnership': {
                'partnership_formation': {
                    'answer': 'Partners were selected based on complementary expertise: Tech University brings technical knowledge and e-learning platform development, Adult Education Center contributes pedagogical expertise and direct access to target groups. This combination ensures both technical quality and educational effectiveness.',
                    'character_count': 310,
                    'character_limit': 3000
                }
            },
            'impact': {
                'sustainability': {
                    'answer': 'Sustainability is ensured through: integration of materials into partners regular programs, training of trainers approach creating multiplier effects, open-source licensing of all materials, establishment of community of practice for continued support, and partnership agreements for platform maintenance beyond project period.',
                    'character_count': 340,
                    'character_limit': 3000
                }
            },
            'project_management': {
                'monitoring': {
                    'answer': 'Project monitoring includes monthly partner meetings, quarterly progress reports, continuous quality assessment through learner feedback, external evaluation by independent expert, and KPI dashboard tracking participant numbers, completion rates, and skill improvements.',
                    'character_count': 280,
                    'character_limit': 2500
                }
            }
        }
    }

    print("\n📊 Calculating quality score for test proposal...")
    print(f"   Title: {test_proposal['title']}")
    print(f"   Sections with answers: {len(test_proposal['answers'])}")

    # Calculate score
    try:
        result = await scorer.calculate_proposal_score(
            proposal=test_proposal,
            detailed_feedback=True
        )

        print("\n✅ SCORING RESULTS:")
        print("-" * 50)
        print(f"Overall Score: {result['overall_score']:.1f}/100")
        print(f"Classification: {result['feedback']['classification'].upper()}")
        print(f"Pass Evaluation: {'YES' if result['pass_evaluation'] else 'NO'}")

        print("\n📈 Section Breakdown:")
        for section, score in result['section_scores'].items():
            status = "✓" if score >= 15 else "✗"
            print(f"  {status} {section.title()}: {score:.1f} points")

        print("\n🎯 Threshold Status:")
        for threshold, met in result['thresholds_met'].items():
            if threshold != 'all_thresholds_met':
                status = "PASS" if met else "FAIL"
                print(f"  {threshold.title()}: {status}")

        if result['feedback']:
            print("\n💪 Top Strengths:")
            for strength in result['feedback'].get('strengths', [])[:3]:
                print(f"  • {strength}")

            print("\n⚠️ Areas for Improvement:")
            for weakness in result['feedback'].get('weaknesses', [])[:3]:
                print(f"  • {weakness}")

            if result['feedback'].get('quick_wins'):
                print("\n🚀 Quick Wins (Easy Improvements):")
                for win in result['feedback']['quick_wins'][:2]:
                    print(f"  • {win['suggestion']}")
                    print(f"    Potential: +{win['potential_score_increase']} points")

        print("\n" + "=" * 50)
        print("✅ Quality scoring test completed successfully!")

        return True

    except Exception as e:
        print(f"\n❌ Error during quality scoring: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_quality_scoring())
    sys.exit(0 if success else 1)