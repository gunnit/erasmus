# Quality Score Predictor Implementation Plan
## Erasmus+ Grant Application System Enhancement

### Executive Summary
Implement a comprehensive quality score prediction system that evaluates grant proposals against official Erasmus+ evaluation criteria to help users understand their likely success rate before submission. This feature addresses the critical need for applicants to self-assess their proposals against the same criteria evaluators use.

### Business Value
- **Reduced Rejection Rate**: Help applicants identify weaknesses before submission
- **Time Savings**: Focus efforts on sections that need improvement
- **Increased Success Rate**: Data-driven approach to meeting evaluation thresholds
- **User Confidence**: Clear understanding of proposal strengths and weaknesses

---

## 1. System Architecture

### 1.1 Evaluation Criteria Breakdown
Based on official Erasmus+ KA220-ADU scoring:

| Section | Weight | Min Score | Questions | Focus Areas |
|---------|--------|-----------|-----------|-------------|
| **Relevance** | 30% | 15 points | R-1 to R-6 | Priority alignment, EU value, Innovation |
| **Partnership** | 20% | - | P-1 to P-3 | Complementarity, Task distribution, Coordination |
| **Impact** | 25% | 15 points | I-1 to I-4 | Sustainability, Assessment, Wider impact |
| **Project Management** | 25% | 15 points | PM-1 to PM-7 | Monitoring, Budget, Risk, Quality |
| **Total** | 100% | 60 points | 27 questions | Overall coherence and feasibility |

### 1.2 Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  QualityScoreCard.jsx    │  Real-time Score Updates         │
│  - Visual Score Display  │  - Live calculation              │
│  - Radar Chart          │  - Improvement tips               │
│  - Section Breakdown    │  - Threshold indicators           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
├─────────────────────────────────────────────────────────────┤
│  /api/quality-score/calculate/{id}  │  POST                │
│  /api/quality-score/preview         │  POST                │
│  /api/quality-score/{id}           │  GET                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Quality Scorer Service                    │
├─────────────────────────────────────────────────────────────┤
│  • Answer Quality Analysis                                  │
│  • Keyword Extraction & Matching                           │
│  • Cross-reference Validation                              │
│  • Weighted Score Calculation                              │
│  • Feedback Generation                                     │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                              │
├─────────────────────────────────────────────────────────────┤
│  proposals table:                                          │
│  + quality_score (FLOAT)                                   │
│  + section_scores (JSON)                                   │
│  + quality_feedback (JSON)                                 │
│  + score_calculated_at (TIMESTAMP)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Implementation Details

### 2.1 Backend Implementation

#### 2.1.1 Quality Scoring Service (`backend/app/services/quality_scorer.py`)

```python
class QualityScorer:
    def __init__(self):
        self.section_weights = {
            'relevance': 0.30,
            'partnership': 0.20,
            'impact': 0.25,
            'project_management': 0.25
        }
        self.min_thresholds = {
            'total': 60,
            'relevance': 15,
            'quality': 15,  # Combined partnership + management
            'impact': 15
        }

    async def calculate_proposal_score(self, proposal: Dict) -> Dict:
        """
        Calculate comprehensive quality score for a proposal
        Returns:
        {
            'overall_score': 75.5,
            'section_scores': {...},
            'pass_thresholds': {...},
            'feedback': {...},
            'improvements': [...]
        }
        """
        # Implementation details...
```

#### 2.1.2 Scoring Algorithm Components

**1. Answer Completeness Score (0-100)**
```python
def calculate_completeness(answer, char_limit):
    if len(answer) >= char_limit * 0.9:
        return 100
    elif len(answer) >= char_limit * 0.7:
        return 85
    elif len(answer) >= char_limit * 0.5:
        return 70
    else:
        return (len(answer) / (char_limit * 0.5)) * 70
```

**2. Keyword Coverage Score (0-100)**
```python
def calculate_keyword_coverage(answer, question_metadata):
    keywords = extract_keywords(question_metadata)
    matched = count_keyword_matches(answer, keywords)
    return min(100, (matched / len(keywords)) * 120)
```

**3. Structure Quality Score (0-100)**
```python
def calculate_structure_score(answer):
    score = 0
    # Check for paragraphs
    if answer.count('\n\n') >= 2: score += 30
    # Check for lists
    if any(marker in answer for marker in ['•', '-', '1.']): score += 25
    # Check for quantifiable data
    if re.search(r'\d+[%€]?', answer): score += 25
    # Check for specific examples
    if contains_specific_examples(answer): score += 20
    return score
```

**4. Cross-reference Consistency (0-100)**
```python
def check_consistency(all_answers):
    # Check budget consistency across sections
    # Check timeline consistency
    # Check partner role consistency
    # Check objective alignment
    return consistency_score
```

#### 2.1.3 Database Schema Update

```sql
-- Migration: add_quality_scoring
ALTER TABLE proposals ADD COLUMN quality_score FLOAT;
ALTER TABLE proposals ADD COLUMN section_scores JSON;
ALTER TABLE proposals ADD COLUMN quality_feedback JSON;
ALTER TABLE proposals ADD COLUMN score_calculated_at TIMESTAMP;

-- Index for quick filtering
CREATE INDEX idx_proposals_quality_score ON proposals(quality_score);
```

### 2.2 Frontend Implementation

#### 2.2.1 Quality Score Card Component

```jsx
// frontend/src/components/QualityScoreCard.jsx
const QualityScoreCard = ({ score, sectionScores, feedback, thresholds }) => {
  return (
    <Card className="quality-score-card">
      {/* Overall Score Circle */}
      <div className="score-circle">
        <CircularProgress value={score} max={100}>
          <span className={getScoreClass(score)}>{score}</span>
        </CircularProgress>
      </div>

      {/* Section Breakdown */}
      <RadarChart data={sectionScores} />

      {/* Pass/Fail Indicators */}
      <ThresholdIndicators thresholds={thresholds} />

      {/* Improvement Suggestions */}
      <ImprovementList suggestions={feedback.improvements} />
    </Card>
  );
};
```

#### 2.2.2 Real-time Score Updates

```javascript
// In AnswerReview.jsx
const handleAnswerUpdate = async (sectionKey, fieldIndex, newAnswer) => {
  // Update local state
  updateAnswer(sectionKey, fieldIndex, newAnswer);

  // Debounced score recalculation
  debouncedCalculateScore(editedAnswers);
};

const debouncedCalculateScore = debounce(async (answers) => {
  const scoreData = await api.calculateQualityScore(answers);
  setQualityScore(scoreData);
}, 1000);
```

---

## 3. Scoring Methodology

### 3.1 Section-Specific Evaluation

#### Relevance Section (30%)
- **Priority Alignment (40%)**: Direct mapping to selected EU priorities
- **Innovation (20%)**: Novel approaches and methods
- **EU Added Value (20%)**: Transnational benefits
- **Objectives Clarity (20%)**: SMART objectives presence

#### Partnership Section (20%)
- **Complementarity (40%)**: Diverse expertise coverage
- **Task Distribution (30%)**: Clear role definition
- **Coordination (30%)**: Communication mechanisms

#### Impact Section (25%)
- **Sustainability (35%)**: Long-term viability
- **Dissemination (25%)**: Reach and channels
- **Measurability (25%)**: KPIs and assessment methods
- **Scalability (15%)**: Replication potential

#### Project Management (25%)
- **Risk Management (25%)**: Identified risks and mitigation
- **Quality Assurance (25%)**: Monitoring mechanisms
- **Budget Justification (25%)**: Cost-effectiveness
- **Timeline Realism (25%)**: Feasible milestones

### 3.2 Quality Indicators

**High-Quality Answer Indicators:**
- Character count > 80% of limit
- Contains 3+ specific examples
- References quantifiable metrics
- Aligns with previous answers
- Uses field-specific terminology
- Addresses all question sub-parts

**Red Flags:**
- Generic statements without specifics
- Inconsistent information across sections
- Missing key evaluation criteria
- Unrealistic claims or timelines
- Budget-activity misalignment

---

## 4. User Interface Design

### 4.1 Visual Components

```
┌─────────────────────────────────────────┐
│         Quality Score: 78/100           │
├─────────────────────────────────────────┤
│                                         │
│           [Circular Progress]           │
│               78 GOOD                   │
│                                         │
├─────────────────────────────────────────┤
│ Section Scores:                        │
│ ▓▓▓▓▓▓▓▓░░ Relevance      24/30       │
│ ▓▓▓▓▓▓▓░░░ Partnership    16/20       │
│ ▓▓▓▓▓▓▓▓░░ Impact         20/25       │
│ ▓▓▓▓▓▓░░░░ Management     18/25       │
├─────────────────────────────────────────┤
│ ✓ Meets minimum total score (60)       │
│ ✓ Meets relevance threshold (15)       │
│ ⚠ Close to impact threshold (15)       │
│ ✓ Meets quality threshold (15)         │
└─────────────────────────────────────────┘
```

### 4.2 Score Interpretation

| Score Range | Classification | Visual | Recommendation |
|------------|----------------|--------|----------------|
| 90-100 | Excellent | 🟢 Green | Ready for submission |
| 75-89 | Good | 🔵 Blue | Minor improvements recommended |
| 60-74 | Acceptable | 🟡 Yellow | Significant improvements needed |
| 45-59 | Poor | 🟠 Orange | Major revisions required |
| 0-44 | Failing | 🔴 Red | Substantial rework needed |

---

## 5. API Specification

### 5.1 Calculate Quality Score
```http
POST /api/quality-score/calculate/{proposal_id}
Authorization: Bearer {token}

Response:
{
  "overall_score": 78.5,
  "section_scores": {
    "relevance": 24.2,
    "partnership": 16.1,
    "impact": 20.3,
    "project_management": 17.9
  },
  "thresholds_met": {
    "total": true,
    "relevance": true,
    "quality": true,
    "impact": true
  },
  "feedback": {
    "strengths": [
      "Strong alignment with EU digital transformation priority",
      "Clear and measurable objectives"
    ],
    "weaknesses": [
      "Limited evidence of target group consultation",
      "Dissemination strategy lacks specific channels"
    ],
    "improvements": [
      {
        "section": "needs_analysis",
        "field": "needs_identification",
        "suggestion": "Add specific data sources and consultation methods",
        "priority": "high",
        "potential_score_increase": 3.5
      }
    ]
  },
  "calculated_at": "2024-01-15T10:30:00Z"
}
```

### 5.2 Preview Score (without saving)
```http
POST /api/quality-score/preview
Content-Type: application/json

{
  "answers": {...},
  "project_context": {...}
}

Response: Same as calculate endpoint
```

### 5.3 Get Cached Score
```http
GET /api/quality-score/{proposal_id}
Authorization: Bearer {token}

Response: Same as calculate endpoint (from cache)
```

---

## 6. Implementation Timeline

### Phase 1: Core Scoring Engine (Week 1-2)
- [ ] Implement QualityScorer service
- [ ] Create scoring algorithms
- [ ] Add database fields via migration
- [ ] Unit tests for scoring logic

### Phase 2: API Integration (Week 2-3)
- [ ] Create API endpoints
- [ ] Integrate with existing proposal workflow
- [ ] Add caching mechanism
- [ ] API documentation and tests

### Phase 3: Frontend Components (Week 3-4)
- [ ] Build QualityScoreCard component
- [ ] Integrate into ProposalDetailNew
- [ ] Add real-time updates to AnswerReview
- [ ] Create visualization components

### Phase 4: Testing & Refinement (Week 4-5)
- [ ] End-to-end testing
- [ ] Score accuracy validation
- [ ] Performance optimization
- [ ] User acceptance testing

### Phase 5: Documentation & Deployment (Week 5)
- [ ] User documentation
- [ ] Deployment guide
- [ ] Training materials
- [ ] Production rollout

---

## 7. Success Metrics

### Quantitative Metrics
- **Accuracy**: Score predictions within ±10% of actual evaluation scores
- **Engagement**: 80% of users check quality score before submission
- **Improvement**: 30% increase in proposals meeting minimum thresholds
- **Time-to-value**: Score calculation < 2 seconds
- **User satisfaction**: > 4.5/5 rating for feature usefulness

### Qualitative Metrics
- User feedback on score transparency
- Evaluator feedback on proposal quality improvement
- Reduction in common proposal weaknesses
- Increased user confidence in submissions

---

## 8. Technical Considerations

### 8.1 Performance Optimization
- Cache calculated scores for 24 hours
- Use Redis for real-time score updates
- Implement progressive calculation for large proposals
- Batch database updates

### 8.2 Scalability
- Horizontal scaling of scorer service
- Queue-based processing for bulk calculations
- CDN for static scoring assets
- Database indexing on quality_score field

### 8.3 Security
- Rate limiting on score calculations
- User authentication for all endpoints
- Audit logging for score modifications
- Data encryption for sensitive feedback

---

## 9. Future Enhancements

### Version 2.0
- **Machine Learning Model**: Train on successful proposals
- **Comparative Analysis**: Compare with similar successful proposals
- **Auto-improvement Suggestions**: AI-generated text improvements
- **Historical Tracking**: Score evolution over time

### Version 3.0
- **Peer Review Integration**: Anonymous peer scoring
- **Success Prediction**: ML-based success probability
- **Sector-specific Scoring**: Customized for different fields
- **Multi-language Support**: Scoring for non-English proposals

---

## 10. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Inaccurate scoring | High | Validate against 100+ real evaluations |
| Performance degradation | Medium | Implement caching and async processing |
| User over-reliance | Medium | Clear disclaimers about predictive nature |
| Algorithm gaming | Low | Regular algorithm updates and validation |

---

## Appendix A: Scoring Algorithm Pseudocode

```python
def calculate_proposal_score(proposal):
    section_scores = {}

    for section in SECTIONS:
        questions = get_questions_for_section(section)
        section_score = 0

        for question in questions:
            answer = proposal.answers[section][question.field]

            # Base scoring
            completeness = calculate_completeness(answer, question.char_limit)
            keywords = calculate_keyword_coverage(answer, question)
            structure = calculate_structure_score(answer)

            # Weight by evaluation_weight from form_questions.json
            question_score = (
                completeness * 0.3 +
                keywords * 0.4 +
                structure * 0.3
            ) * (question.evaluation_weight / 10)

            section_score += question_score

        # Apply section weight
        section_scores[section] = section_score * SECTION_WEIGHTS[section]

    # Calculate overall score
    overall_score = sum(section_scores.values())

    # Check thresholds
    thresholds_met = check_thresholds(overall_score, section_scores)

    # Generate feedback
    feedback = generate_feedback(proposal, section_scores)

    return {
        'overall_score': overall_score,
        'section_scores': section_scores,
        'thresholds_met': thresholds_met,
        'feedback': feedback
    }
```

---

## Appendix B: Sample Quality Feedback

```json
{
  "feedback": {
    "overall_assessment": "Your proposal shows strong potential but needs improvement in impact and sustainability sections.",
    "strengths": [
      "Excellent alignment with digital transformation priority",
      "Clear partnership roles and responsibilities",
      "Well-defined target groups with specific numbers"
    ],
    "critical_improvements": [
      {
        "section": "impact",
        "issue": "Sustainability plan lacks concrete funding sources",
        "suggestion": "Specify how activities will continue after EU funding ends",
        "example": "Include partnership agreements for continued support, revenue models, or integration into existing programs"
      }
    ],
    "quick_wins": [
      {
        "section": "relevance",
        "field": "innovation",
        "current_score": 6,
        "potential_score": 8,
        "action": "Add 2-3 specific examples of innovative methods not used in your country"
      }
    ]
  }
}
```

---

## Document Version
- **Version**: 1.0
- **Date**: January 2024
- **Author**: Erasmus+ Development Team
- **Status**: Ready for Implementation
- **Review Date**: February 2024