# Erasmus+ Knowledge Base Schema Design

**Document Purpose**: Comprehensive schema design for Erasmus+ knowledge base to support AI-powered proposal generation  
**Source**: Analysis of all extracted Erasmus+ documentation  
**Created**: 2025-01-07 13:52:00 UTC  
**Task**: 2.2.1 - Design knowledge base schema for Erasmus+ data  
**Status**: Completed

---

## SCHEMA OVERVIEW

### Design Principles:
- **Hierarchical Structure**: Organized taxonomy for efficient retrieval
- **Semantic Relationships**: Cross-references and connections between entities
- **Version Control**: Support for annual updates and changes
- **Search Optimization**: Structured for vector embeddings and semantic search
- **AI Integration**: Designed for automated reasoning and content generation

### Schema Architecture:
1. **Core Entities**: Primary data structures (partnerships, priorities, criteria)
2. **Relationship Mappings**: Connections between entities
3. **Metadata Layer**: Versioning, sources, and context information
4. **Search Indexes**: Optimized structures for retrieval
5. **Validation Rules**: Compliance and consistency checking

---

## 1. CORE ENTITY SCHEMAS

### 1.1 Partnership Types Schema

```json
{
  "partnership_types": {
    "id": "string (unique identifier)",
    "name": "string (Small-scale Partnerships | Cooperation Partnerships)",
    "code": "string (SP | CP)",
    "description": "string (detailed description)",
    "target_audience": "array[string] (target organization types)",
    "philosophy": "string (core philosophy and approach)",
    "characteristics": {
      "funding_amounts": "array[integer] (available lump sums)",
      "duration_range": {
        "min_months": "integer",
        "max_months": "integer"
      },
      "partner_requirements": {
        "min_partners": "integer",
        "min_countries": "integer",
        "geographic_scope": "array[string]"
      },
      "management_authority": "array[string] (NA | EACEA)",
      "complexity_level": "string (Basic | Moderate | High | Very High)"
    },
    "objectives": "array[string] (primary objectives)",
    "eligibility": {
      "organizational_requirements": "array[object]",
      "sectoral_eligibility": "array[string]",
      "geographic_eligibility": "array[string]",
      "exclusions": "array[string]"
    },
    "financial_framework": {
      "lump_sum_options": "array[object]",
      "co_financing_requirements": "object",
      "payment_structure": "object"
    },
    "evaluation_criteria": "array[object] (references to evaluation schema)",
    "success_factors": "array[string]",
    "common_pitfalls": "array[string]",
    "decision_support": {
      "selection_criteria": "array[string]",
      "when_to_choose": "array[string]",
      "not_suitable_if": "array[string]"
    },
    "metadata": {
      "version": "string",
      "last_updated": "datetime",
      "source_documents": "array[string]",
      "ai_integration_notes": "string"
    }
  }
}
```

### 1.2 Priorities Schema

```json
{
  "priorities": {
    "id": "string (unique identifier)",
    "code": "string (HP-01, HE-01, etc.)",
    "name": "string (priority name)",
    "type": "string (horizontal | sector_specific)",
    "sector": "string (null for horizontal, sector code for specific)",
    "weight": "string (High | Medium-High | Medium | Low)",
    "mandatory": "boolean",
    "description": {
      "core_focus": "string",
      "objective": "string",
      "key_areas": "array[string]",
      "target_groups": "array[string]"
    },
    "implementation": {
      "strategies": "array[string]",
      "approaches": "array[string]",
      "best_practices": "array[string]"
    },
    "expected_outcomes": {
      "results": "array[string]",
      "impact_indicators": "array[string]",
      "success_metrics": "array[string]"
    },
    "evaluation_criteria": {
      "assessment_points": "array[string]",
      "scoring_weight": "float",
      "evidence_requirements": "array[string]"
    },
    "relationships": {
      "compatible_priorities": "array[string] (priority IDs)",
      "synergistic_combinations": "array[array[string]]",
      "sector_crossovers": "array[string]"
    },
    "ai_integration": {
      "recommendation_triggers": "array[string]",
      "content_generation_prompts": "array[string]",
      "compliance_checks": "array[string]"
    },
    "metadata": {
      "version": "string",
      "last_updated": "datetime",
      "source_documents": "array[string]",
      "annual_updates": "array[object]"
    }
  }
}
```

### 1.3 Evaluation Criteria Schema

```json
{
  "evaluation_criteria": {
    "id": "string (unique identifier)",
    "partnership_type": "string (small_scale | cooperation)",
    "category": {
      "name": "string (Relevance | Quality | Partnership | Impact)",
      "weight_percentage": "float",
      "max_points": "integer",
      "min_points": "integer"
    },
    "subcriteria": [
      {
        "id": "string",
        "name": "string",
        "max_points": "integer",
        "assessment_criteria": "array[string]",
        "scoring_rubric": [
          {
            "points": "integer",
            "description": "string",
            "requirements": "array[string]"
          }
        ],
        "evaluation_questions": "array[string]",
        "evidence_requirements": "array[string]",
        "common_weaknesses": "array[string]",
        "excellence_indicators": "array[string]"
      }
    ],
    "scoring_calculation": {
      "total_max_points": "integer",
      "minimum_threshold": "integer",
      "category_minimums": "object",
      "bonus_opportunities": "array[object]"
    },
    "ai_integration": {
      "automated_scoring_factors": "array[string]",
      "quality_indicators": "array[string]",
      "improvement_suggestions": "array[string]"
    },
    "metadata": {
      "version": "string",
      "last_updated": "datetime",
      "source_documents": "array[string]"
    }
  }
}
```

### 1.4 Funding Rules Schema

```json
{
  "funding_rules": {
    "id": "string (unique identifier)",
    "partnership_type": "string (small_scale | cooperation)",
    "lump_sum_structure": [
      {
        "amount": "integer",
        "currency": "string (EUR)",
        "typical_profile": {
          "duration_months": "object (min/max)",
          "partner_count": "object (min/max)",
          "activity_count": "object (min/max)",
          "scope": "string",
          "complexity": "string"
        },
        "recommended_use_cases": "array[string]",
        "activity_distribution": {
          "project_management": "object (percentage_range, amount_range)",
          "learning_activities": "object (percentage_range, amount_range)",
          "innovation_development": "object (percentage_range, amount_range)",
          "dissemination": "object (percentage_range, amount_range)",
          "evaluation": "object (percentage_range, amount_range)",
          "other_categories": "array[object]"
        },
        "selection_criteria": "array[string]"
      }
    ],
    "co_financing": {
      "minimum_percentage": "float",
      "recommended_percentage": "float",
      "maximum_recognition": "float",
      "acceptable_forms": {
        "financial": "array[string]",
        "in_kind": "array[string]"
      },
      "calculation_methods": "object",
      "documentation_requirements": "array[string]"
    },
    "payment_procedures": {
      "pre_financing": {
        "percentage": "float",
        "timing": "string",
        "conditions": "array[string]"
      },
      "final_payment": {
        "percentage": "float",
        "timing": "string",
        "conditions": "array[string]"
      },
      "reduction_scenarios": "array[object]"
    },
    "compliance_requirements": {
      "financial_regulations": "array[string]",
      "reporting_obligations": "array[string]",
      "audit_requirements": "array[string]",
      "documentation_retention": "string"
    },
    "ai_integration": {
      "budget_optimization_factors": "array[string]",
      "cost_efficiency_indicators": "array[string]",
      "compliance_checks": "array[string]"
    },
    "metadata": {
      "version": "string",
      "last_updated": "datetime",
      "source_documents": "array[string]"
    }
  }
}
```

### 1.5 Application Process Schema

```json
{
  "application_process": {
    "id": "string (unique identifier)",
    "partnership_type": "string (small_scale | cooperation)",
    "steps": [
      {
        "step_number": "integer",
        "name": "string",
        "description": "string",
        "requirements": "array[string]",
        "deliverables": "array[string]",
        "timeline": "string",
        "common_issues": "array[string]",
        "best_practices": "array[string]"
      }
    ],
    "deadlines": [
      {
        "deadline_type": "string",
        "date": "string",
        "time": "string",
        "timezone": "string",
        "applicable_sectors": "array[string]",
        "management_authority": "string"
      }
    ],
    "submission_requirements": {
      "format": "string",
      "platform": "string",
      "documents": "array[string]",
      "technical_requirements": "array[string]"
    },
    "evaluation_process": {
      "phases": "array[object]",
      "timeline": "string",
      "notification_process": "string"
    },
    "ai_integration": {
      "guidance_prompts": "array[string]",
      "compliance_checks": "array[string]",
      "optimization_suggestions": "array[string]"
    },
    "metadata": {
      "version": "string",
      "last_updated": "datetime",
      "source_documents": "array[string]"
    }
  }
}
```

---

## 2. RELATIONSHIP MAPPINGS

### 2.1 Priority-Partnership Relationships

```json
{
  "priority_partnership_mapping": {
    "priority_id": "string",
    "applicable_partnerships": "array[string]",
    "relevance_weight": "float",
    "integration_requirements": "array[string]",
    "evaluation_impact": "object"
  }
}
```

### 2.2 Criteria-Priority Relationships

```json
{
  "criteria_priority_mapping": {
    "criteria_id": "string",
    "related_priorities": "array[string]",
    "priority_scoring_impact": "object",
    "evidence_alignment": "array[string]"
  }
}
```

### 2.3 Funding-Activity Relationships

```json
{
  "funding_activity_mapping": {
    "funding_level": "integer",
    "optimal_activities": "array[object]",
    "budget_allocation_guidelines": "object",
    "efficiency_benchmarks": "object"
  }
}
```

---

## 3. SEARCH AND RETRIEVAL OPTIMIZATION

### 3.1 Vector Embedding Structure

```json
{
  "embeddings": {
    "entity_id": "string",
    "entity_type": "string",
    "content_vector": "array[float] (1536 dimensions for OpenAI)",
    "metadata": {
      "content_type": "string",
      "keywords": "array[string]",
      "semantic_tags": "array[string]",
      "relevance_score": "float"
    },
    "relationships": "array[string] (related entity IDs)",
    "last_updated": "datetime"
  }
}
```

### 3.2 Search Index Structure

```json
{
  "search_indexes": {
    "primary_index": {
      "entity_type": "string",
      "searchable_fields": "array[string]",
      "facet_fields": "array[string]",
      "ranking_factors": "object"
    },
    "semantic_index": {
      "vector_field": "string",
      "similarity_threshold": "float",
      "max_results": "integer"
    },
    "contextual_index": {
      "context_fields": "array[string]",
      "relevance_scoring": "object"
    }
  }
}
```

---

## 4. AI INTEGRATION LAYER

### 4.1 Content Generation Templates

```json
{
  "content_templates": {
    "template_id": "string",
    "template_type": "string (section | activity | objective)",
    "partnership_type": "string",
    "applicable_priorities": "array[string]",
    "template_structure": {
      "prompt_template": "string",
      "required_variables": "array[string]",
      "optional_variables": "array[string]",
      "output_format": "string"
    },
    "quality_criteria": "array[string]",
    "validation_rules": "array[string]",
    "examples": "array[object]"
  }
}
```

### 4.2 Compliance Checking Rules

```json
{
  "compliance_rules": {
    "rule_id": "string",
    "rule_type": "string (eligibility | evaluation | funding)",
    "applicable_entities": "array[string]",
    "rule_logic": {
      "conditions": "array[object]",
      "validation_method": "string",
      "error_messages": "array[string]",
      "suggestions": "array[string]"
    },
    "severity": "string (error | warning | info)",
    "auto_fix_available": "boolean"
  }
}
```

### 4.3 Recommendation Engine Schema

```json
{
  "recommendation_engine": {
    "recommendation_type": "string",
    "input_parameters": "array[string]",
    "decision_logic": {
      "scoring_algorithm": "string",
      "weighting_factors": "object",
      "threshold_values": "object"
    },
    "output_format": {
      "recommendations": "array[object]",
      "confidence_scores": "array[float]",
      "explanations": "array[string]"
    },
    "learning_feedback": {
      "success_metrics": "array[string]",
      "improvement_tracking": "object"
    }
  }
}
```

---

## 5. VERSION CONTROL AND METADATA

### 5.1 Version Control Schema

```json
{
  "version_control": {
    "entity_id": "string",
    "version_history": [
      {
        "version": "string",
        "release_date": "datetime",
        "changes": "array[string]",
        "change_type": "string (major | minor | patch)",
        "backward_compatible": "boolean",
        "migration_required": "boolean"
      }
    ],
    "current_version": "string",
    "deprecation_schedule": "object"
  }
}
```

### 5.2 Source Documentation Schema

```json
{
  "source_documentation": {
    "document_id": "string",
    "title": "string",
    "type": "string (official_guide | regulation | handbook)",
    "version": "string",
    "publication_date": "datetime",
    "authority": "string",
    "url": "string",
    "sections_extracted": "array[object]",
    "extraction_date": "datetime",
    "extraction_method": "string",
    "quality_score": "float"
  }
}
```

---

## 6. IMPLEMENTATION SPECIFICATIONS

### 6.1 Database Schema (PostgreSQL)

```sql
-- Core Tables
CREATE TABLE partnership_types (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE priorities (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    sector VARCHAR(50),
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY,
    partnership_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funding_rules (
    id UUID PRIMARY KEY,
    partnership_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Relationship Tables
CREATE TABLE priority_partnerships (
    priority_id UUID REFERENCES priorities(id),
    partnership_type_id UUID REFERENCES partnership_types(id),
    relevance_weight FLOAT,
    PRIMARY KEY (priority_id, partnership_type_id)
);

CREATE TABLE criteria_priorities (
    criteria_id UUID REFERENCES evaluation_criteria(id),
    priority_id UUID REFERENCES priorities(id),
    scoring_impact JSONB,
    PRIMARY KEY (criteria_id, priority_id)
);

-- Vector Storage
CREATE TABLE embeddings (
    id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    content_vector VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_priorities_type_sector ON priorities(type, sector);
CREATE INDEX idx_evaluation_criteria_partnership ON evaluation_criteria(partnership_type);
CREATE INDEX idx_embeddings_entity ON embeddings(entity_id, entity_type);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (content_vector vector_cosine_ops);
```

### 6.2 API Endpoints Structure

```yaml
# Knowledge Base API Endpoints
/api/v1/partnerships:
  GET: List all partnership types
  GET /{id}: Get specific partnership type
  
/api/v1/priorities:
  GET: List all priorities
  GET /{id}: Get specific priority
  GET /search: Search priorities by criteria
  
/api/v1/evaluation:
  GET /{partnership_type}: Get evaluation criteria
  POST /score: Calculate evaluation score
  
/api/v1/funding:
  GET /{partnership_type}: Get funding rules
  POST /optimize: Get budget optimization suggestions
  
/api/v1/search:
  POST /semantic: Semantic search across knowledge base
  POST /recommendations: Get AI recommendations
  
/api/v1/compliance:
  POST /check: Validate proposal compliance
  POST /suggestions: Get improvement suggestions
```

---

## 7. QUALITY ASSURANCE AND VALIDATION

### 7.1 Data Quality Rules

```json
{
  "quality_rules": {
    "completeness": {
      "required_fields": "array[string]",
      "minimum_content_length": "integer",
      "reference_completeness": "float"
    },
    "consistency": {
      "cross_reference_validation": "array[string]",
      "terminology_consistency": "object",
      "format_standardization": "object"
    },
    "accuracy": {
      "source_verification": "boolean",
      "expert_review_required": "boolean",
      "automated_fact_checking": "array[string]"
    },
    "timeliness": {
      "update_frequency": "string",
      "staleness_threshold": "integer (days)",
      "version_synchronization": "boolean"
    }
  }
}
```

### 7.2 Validation Procedures

```json
{
  "validation_procedures": {
    "data_ingestion": {
      "schema_validation": "boolean",
      "content_validation": "array[string]",
      "relationship_validation": "boolean"
    },
    "periodic_review": {
      "frequency": "string",
      "review_criteria": "array[string]",
      "update_triggers": "array[string]"
    },
    "user_feedback": {
      "feedback_collection": "object",
      "quality_scoring": "object",
      "improvement_tracking": "object"
    }
  }
}
```

---

## 8. PERFORMANCE OPTIMIZATION

### 8.1 Caching Strategy

```json
{
  "caching_strategy": {
    "levels": [
      {
        "level": "application",
        "cache_type": "redis",
        "ttl": "3600",
        "cache_keys": "array[string]"
      },
      {
        "level": "database",
        "cache_type": "query_cache",
        "optimization": "array[string]"
      },
      {
        "level": "cdn",
        "cache_type": "static_content",
        "ttl": "86400"
      }
    ],
    "invalidation_rules": "array[object]",
    "warming_strategies": "array[string]"
  }
}
```

### 8.2 Search Optimization

```json
{
  "search_optimization": {
    "indexing_strategy": {
      "full_text_search": "array[string]",
      "faceted_search": "array[string]",
      "vector_search": "object"
    },
    "query_optimization": {
      "query_rewriting": "array[string]",
      "result_ranking": "object",
      "personalization": "object"
    },
    "performance_targets": {
      "response_time": "integer (ms)",
      "throughput": "integer (requests/sec)",
      "accuracy": "float (percentage)"
    }
  }
}
```

---

## 9. SECURITY AND ACCESS CONTROL

### 9.1 Security Schema

```json
{
  "security": {
    "access_control": {
      "authentication": "string (oauth2 | jwt)",
      "authorization": "array[string] (roles)",
      "api_rate_limiting": "object"
    },
    "data_protection": {
      "encryption_at_rest": "boolean",
      "encryption_in_transit": "boolean",
      "pii_handling": "array[string]"
    },
    "audit_logging": {
      "access_logs": "boolean",
      "change_logs": "boolean",
      "retention_period": "integer (days)"
    }
  }
}
```

---

## 10. MIGRATION AND DEPLOYMENT

### 10.1 Migration Strategy

```json
{
  "migration": {
    "data_migration": {
      "source_formats": "array[string]",
      "transformation_rules": "array[object]",
      "validation_steps": "array[string]"
    },
    "schema_evolution": {
      "versioning_strategy": "string",
      "backward_compatibility": "boolean",
      "rollback_procedures": "array[string]"
    },
    "deployment_phases": [
      {
        "phase": "string",
        "components": "array[string]",
        "success_criteria": "array[string]",
        "rollback_triggers": "array[string]"
      }
    ]
  }
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Core Schema Implementation
1. **Database Setup**: Create PostgreSQL schema with JSONB support
2. **Basic CRUD Operations**: Implement core entity management
3. **Data Migration**: Import structured data from documentation
4. **Basic Search**: Implement text-based search functionality

### Phase 2: AI Integration Layer
1. **Vector Embeddings**: Generate embeddings for all content
2. **Semantic Search**: Implement vector-based similarity search
3. **Recommendation Engine**: Build basic recommendation algorithms
4. **Content Templates**: Create AI prompt templates

### Phase 3: Advanced Features
1. **Compliance Checking**: Implement automated validation rules
2. **Quality Assurance**: Add data quality monitoring
3. **Performance Optimization**: Implement caching and indexing
4. **API Development**: Create comprehensive REST API

### Phase 4: Production Readiness
1. **Security Implementation**: Add authentication and authorization
2. **Monitoring and Logging**: Implement comprehensive monitoring
3. **Documentation**: Create API documentation and user guides
4. **Testing and Validation**: Comprehensive testing suite

---

**Status**: Knowledge base schema design completed  
**Next Task**: 2.2.2 - Create vector embeddings for all document sections  
**Implementation**: Ready for database setup and data migration  
**AI Integration**: Schema optimized for AI-powered features and semantic search
