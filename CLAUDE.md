# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Erasmus+ KA220-ADU grant application auto-completion system that reduces form completion time from 40-60 hours to 30 minutes using OpenAI GPT-4 to generate comprehensive answers for all 27 application questions.

## Quick Start

```bash
# Start both frontend and backend
./start.sh

# Backend only (port 8000)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend only (port 3000)
cd frontend
npm install
npm start
```

## Project Structure

```
/mnt/c/Dev/gyg4/
├── README.md                    # Project documentation
├── CLAUDE.md                    # AI assistant guide (this file)
├── build.sh, start.sh          # Build and startup scripts
├── render.yaml                 # Render deployment configuration
│
├── /docs/                      # Organized documentation
│   ├── /erasmus/              # Erasmus+ program documentation
│   │   ├── ERASMUS_PRIORITIES_2024.md
│   │   ├── ERASMUS_PROGRAMME_STRUCTURE.md
│   │   ├── EVALUATION_CRITERIA_SCORING.md
│   │   ├── FUNDING_RULES_BUDGET_GUIDELINES.md
│   │   └── PARTNERSHIP_TYPES_ANALYSIS.md
│   ├── /developer/            # Developer guides and API docs
│   │   ├── DEVELOPER_GUIDE.md
│   │   ├── SETUP.md
│   │   ├── API.md
│   │   ├── DATABASE_SCHEMA_ANALYSIS.md
│   │   ├── AI_INTEGRATION_ANALYSIS.md
│   │   ├── AI_REASONING_PIPELINE.md
│   │   ├── VECTOR_EMBEDDINGS_SYSTEM.md
│   │   ├── VECTOR_STORE_INTEGRATION.md
│   │   ├── KNOWLEDGE_BASE_SCHEMA.md
│   │   ├── COMPLIANCE_PROMPTS.md
│   │   ├── IMPROVEMENTS.md
│   │   ├── PROMPT_TEMPLATES.md
│   │   └── quality-score-predictor-plan.md
│   ├── /deployment/           # Deployment documentation
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   └── PAYPAL_SANDBOX_SETUP.md
│   └── /user/                 # User documentation
│       ├── USER_GUIDE.md
│       └── USER_JOURNEY_ANALYSIS.md
│
├── /reports/                   # Test and audit reports
│   ├── /agent-tests/          # Agent testing reports
│   │   ├── AGENT_2_AI_GENERATION_TEST_REPORT.md
│   │   ├── AGENT_2_QUICK_REFERENCE.md
│   │   ├── AGENT_2_SUMMARY.txt
│   │   ├── AGENT_6_END_TO_END_USER_FLOW_REPORT.md
│   │   ├── AGENT_6_QUICK_REFERENCE.md
│   │   └── COMPREHENSIVE_TESTING_REPORT.md
│   ├── /audits/               # Audit reports
│   │   └── AUDIT_REPORT.md
│   ├── /fixes/                # Fix documentation
│   │   ├── CRITICAL_FIXES_APPLIED.md
│   │   ├── FIXES_APPLIED.md
│   │   ├── FIXES_APPLIED_2025-10-10.md
│   │   └── IMMEDIATE_ACTION_PLAN.md
│   └── /backend/              # Backend-specific reports
│       └── AGENT3_BACKEND_TEST_REPORT.md
│
├── /tests/                     # Integration tests (root level)
│   ├── test_api_endpoints.py
│   ├── test_proposal.py
│   └── /results/              # Test result files
│
├── /scripts/                   # Utility scripts (root level)
│   └── save_proposal_direct.py
│
├── /backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── .env, .env.example
│   │
│   ├── /app/                  # Main application code
│   │   ├── main.py
│   │   ├── /api/              # API endpoints
│   │   ├── /core/             # Core configuration
│   │   ├── /db/               # Database config
│   │   ├── /models/           # Data models
│   │   ├── /schemas/          # Pydantic schemas
│   │   └── /services/         # Business logic
│   │
│   ├── /alembic/              # Database migrations
│   │
│   ├── /tests/                # Backend tests
│   │   ├── test_autofill.py
│   │   ├── test_basic.py
│   │   ├── test_api_integrity.py
│   │   ├── test_dashboard_metrics.py
│   │   ├── test_error_handling.py
│   │   ├── test_parallel_generation.py
│   │   ├── test_partner_linking.py
│   │   ├── test_progressive_generation.py
│   │   ├── test_proposal_save.py
│   │   ├── test_quality_scoring.py
│   │   ├── /agent-tests/      # Agent-specific tests
│   │   │   ├── test_agent3_api.py
│   │   │   ├── test_render_ai_generation.py
│   │   │   └── test_render_ai_simple.py
│   │   ├── /integration/      # Service integration tests
│   │   │   ├── test_ai_assistant.py
│   │   │   ├── test_crawler_improved.py
│   │   │   ├── test_direct_firecrawl.py
│   │   │   ├── test_firecrawl_v2.py
│   │   │   ├── test_openai_config.py
│   │   │   └── test_real_partner_search.py
│   │   └── /results/          # Test result JSON files
│   │
│   ├── /scripts/              # Backend utility scripts
│   │   ├── check_openai_env.py
│   │   ├── check_render_config.py
│   │   ├── validate_autofill.py
│   │   ├── migrate_partners.py
│   │   ├── /migrations/       # Migration runner scripts
│   │   │   ├── run_migration.py
│   │   │   ├── run_migrations.py
│   │   │   └── run_all_migrations.py
│   │   └── start.sh
│   │
│   └── /data/                 # Data files
│       └── erasmus_forms.db   # Local development database
│
└── /frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── .env, .env.production
    └── /src/                  # Application code
```

## Architecture

### Technology Stack
- **Backend**: FastAPI + OpenAI GPT-4
- **Frontend**: React + Tailwind CSS
- **Database**: PostgreSQL (Render)
- **Deployment**: Render.com

### Core Application Flow
1. User inputs project details → `ProjectInputForm.jsx`
2. Frontend sends to `/api/form/generate-answers` or progressive generation endpoints
3. Backend orchestrates AI generation via `ai_autofill_service.py`
4. OpenAI generates ALL 27 answers with context awareness
5. User reviews/edits in `AnswerReview.jsx` or `ProposalDetailNew.js`
6. Proposal saved to database with authentication

### Backend Structure (`/backend/app/`)

**API Layer** (`api/`)
- `form_generator.py` - Main orchestrator for form generation, handles PDF export
- `single_question_generator.py` - Generate individual answers with context
- `progressive_generator.py` - Progressive generation with SSE streaming
- `proposals.py` - CRUD operations for saved proposals with partner library linking
- `partners.py` - Partner library management with web crawling and affinity scoring
- `auth.py` - JWT authentication endpoints
- `dashboard.py` - Real-time statistics and metrics

**Service Layer** (`services/`)
- `ai_autofill_service.py` - Core AI logic using OpenAI GPT
- `prompts_config.py` - Question-specific prompt templates
- `openai_service.py` - OpenAI API integration with `generate_completion()` method
- `partner_affinity_service.py` - Calculate partner-project compatibility scores
- `web_crawler_service.py` - Extract partner info from websites

**Data Layer** (`db/`)
- `models.py` - SQLAlchemy models (User, Proposal, Partner, GenerationSession, Subscription, Payment)
- `database.py` - Database connection and session management

### Frontend Structure (`/frontend/src/`)

**Components**
- `App.js` - Main app controller with state management
- `ProjectInputForm.jsx` - Multi-step form with partner library search integration
- `AnswerReview.jsx` - Review and edit generated answers
- `ProposalDetailNew.js` - View/edit proposals with library partner display
- `Partners.jsx` - Partner library management interface
- `Dashboard.jsx` - Real-time metrics and proposal management
- `ProgressiveGenerationModal.jsx` - Real-time generation progress display

**Services**
- `api.js` - Centralized API client with auth interceptors (60s timeout for single answers, 120s for full generation)

**Context**
- `AuthContext.js` - Authentication state management

**CSS Architecture**
- `index.css` - Global Tailwind CSS configuration
- `App.css` - App-level styles (Toaster, global components)
- Component CSS Modules:
  - `HomePage.module.css` - Static styles for HomePage component
  - `ProjectInputForm.module.css` - Static styles for ProjectInputForm component

**Important: Dynamic Inline Styles**
Most inline styles in this codebase are **intentionally dynamic** and cannot be extracted to CSS files. These include:
- Parallax scroll effects using `scrollY` state (HomePage.jsx)
- Dynamic progress bars using `progress` state (Dashboard.jsx, ProposalDetailNew.js)
- Dynamic width/height based on completion percentages
- Dynamic colors from data objects
- Transform animations based on component state

These styles MUST remain inline as they use JavaScript-computed values. Only static inline styles have been extracted to CSS modules.

## Key API Endpoints

### Form Generation
- `POST /api/form/generate-answers` - Generate all 27 answers (30-60s)
- `POST /api/form/single/generate-single-answer` - Generate single answer with context
- `POST /api/form/progressive-generation/start` - Start progressive generation
- `GET /api/form/progressive-generation/stream/{session_id}` - SSE stream for progress
- `GET /api/form/progressive-generation/answers/{session_id}` - Get completed answers
- `GET /api/form/questions` - Get form structure
- `GET /api/form/priorities` - Get EU priorities list
- `GET /api/form/pdf/{id}` - Download generated PDF

### Proposals
- `GET/POST /api/proposals/` - List/create proposals (auto-links partners)
- `GET/PUT/DELETE /api/proposals/{id}` - Manage specific proposal
- `POST /api/proposals/{id}/submit` - Submit proposal

### Partners
- `GET/POST /api/partners/` - List/create partners in library
- `GET /api/partners/search` - Search partners for autocomplete
- `POST /api/partners/{id}/crawl` - Crawl partner website for info
- `POST /api/partners/{id}/calculate-affinity` - Calculate project compatibility

### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `GET/PUT /api/profile/` - Profile management

## Environment Configuration

### Backend (`backend/.env`)
```env
# Required
OPENAI_API_KEY=sk-...  # OpenAI API key - MUST be set in Render environment
DATABASE_URL=postgresql://...  # Set by Render automatically
SECRET_KEY=your-secret-key-change-in-production

# Application Settings
DEBUG=False  # Set to False in production
```

### Frontend Configuration
- API endpoint: Set via `REACT_APP_API_URL` environment variable
- In `src/services/api.js`: Default points to `http://localhost:8000/api`
- Tailwind CSS with custom configuration
- React Router v6 for navigation

## AI Generation Process

The system generates answers for 27 questions across 6 sections:

1. **Project Summary** (3 questions)
2. **Relevance** (6 questions, 30 points)
3. **Needs Analysis** (4 questions)
4. **Partnership** (3 questions, 20 points)
5. **Impact** (4 questions, 25 points)
6. **Project Management** (7 questions, 25 points)

### Key Features
- Context awareness: Later answers reference earlier ones
- Character limit compliance (2000-3000 chars per answer)
- Priority alignment with selected EU priorities
- Evaluation criteria optimization
- Consistent terminology and tone

### Critical Implementation Files
- `backend/app/services/ai_autofill_service.py:auto_fill_complete_application()` - Main generation orchestration
- `backend/app/services/prompts_config.py:get_prompt_for_question()` - Question-specific prompts
- `backend/data/form_questions.json` - Complete form structure with metadata
- `backend/app/api/form_generator.py:generate_pdf()` - PDF generation with ReportLab
- `backend/app/services/openai_service.py:generate_completion()` - OpenAI API wrapper

## Database Schema

### SQLAlchemy Models
- **User**: id, username, email, hashed_password, full_name, organization, subscription info
- **Proposal**: id, user_id, title, project_idea, priorities, target_groups, partners (JSON), library_partners (relation), answers, status
- **Partner**: id, user_id, name, type, country, website, description, expertise_areas, affinity_score
- **GenerationSession**: id, user_id, status, project_context, answers, progress tracking
- **Subscription/Payment**: Subscription and payment tracking

### Partner-Proposal Relationship
- `partner_proposal` association table for many-to-many relationship
- Partners auto-created in library when proposals are saved
- Partners can be reused across multiple proposals

### Alembic Migrations
- Located in `backend/alembic/versions/`
- Run with `alembic upgrade head`

## Testing & Validation

### Backend Testing
```bash
cd backend

# Configuration checks
python3 check_openai_env.py      # Check OpenAI API key configuration
python3 check_render_config.py   # Check Render environment setup
python3 test_openai_config.py    # Test OpenAI API connection

# Functional testing
python validate_autofill.py      # Verify all 27 questions are mapped
python test_autofill.py          # Test actual generation
python test_proposal_save.py     # Test database persistence
python test_progressive_generation.py  # Test progressive generation
python test_parallel_generation.py     # Test parallel generation
python test_error_handling.py    # Test error scenarios
python test_partner_linking.py   # Test partner library integration
python test_basic.py             # Basic API tests

# Migration scripts
python migrate_partners.py       # Migrate existing proposals to partner library
```

### Frontend Testing
```bash
cd frontend
npm test                         # Run React tests
```

## Common Issues & Solutions

1. **API Timeout**: Generation takes 30-60s - frontend timeout set to 60s for single answers, 120s for full generation
2. **CORS Errors**: Backend on :8000, frontend on :3000 - check CORS middleware in `main.py`
3. **Missing Answers**: Run `validate_autofill.py` to verify question mapping
4. **Database Issues**: Check `DATABASE_URL` in `.env`, run migrations
5. **Port Conflicts**: Use `lsof -i :PORT` to check, defaults are 3000/8000
6. **PDF Export 404**: Ensure ReportLab is installed, check temp directory permissions
7. **Authentication Errors**: Check JWT secret key, token expiration settings

### Generation Failures & Proposal Save Issues

**Symptoms:**
- "Generation failed: No sections were generated successfully"
- Proposals not saved after generation completes
- "Failed to generate answer" errors

**Root Causes:**
1. Missing OPENAI_API_KEY in Render environment
2. Missing `generate_completion()` method in OpenAI service
3. Frontend timeout too short (was 15s, now 60s)

**Fix:**
1. Add OPENAI_API_KEY to Render environment variables
2. Ensure `generate_completion()` method exists in `openai_service.py`
3. Frontend timeout increased to 60s in `api.js`

## Production Deployment (Render)

### Backend
- Python 3.11+ runtime
- Build command: `cd backend && pip install -r requirements.txt`
- Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables set in Render dashboard
- Health checks on `/api/health/ready`

### Required Environment Variables (Render Dashboard)
```env
OPENAI_API_KEY=sk-...          # CRITICAL: Must be set for generation to work
DATABASE_URL=postgresql://...   # Auto-configured by Render
SECRET_KEY=your-secret-key      # Change from default for security
DEBUG=False                     # Must be False in production
```

### Frontend
- Build command: `cd frontend && npm install && REACT_APP_API_URL=https://erasmus-backend.onrender.com/api npm run build`
- Publish directory: `./frontend/build`
- Static site with client-side routing (404.html fallback)

### Database
- PostgreSQL on Render (automatically configured)
- DATABASE_URL is automatically injected by Render
- Run migrations: `alembic upgrade head`
- Enable SSL for database connections

### Deployment Checklist
- [ ] OPENAI_API_KEY configured in Render environment
- [ ] DATABASE_URL configured (auto by Render)
- [ ] SECRET_KEY changed from default
- [ ] DEBUG set to False
- [ ] Frontend API URL points to backend service
- [ ] Database migrations run
- [ ] Health checks passing

## Progressive Generation Flow

The system uses Server-Sent Events (SSE) for real-time generation progress:

1. **Frontend initiates generation** (`ProjectInputForm.jsx`)
   - Calls `/api/form/progressive-generation/start`
   - Opens SSE connection to `/api/form/progressive-generation/stream/{session_id}`

2. **Backend processes sections** (`progressive_generator.py`)
   - Background task generates sections sequentially
   - Updates Redis/in-memory cache with progress
   - Streams updates via SSE

3. **Frontend handles completion** (`ProgressiveGenerationModal.jsx`)
   - Fetches complete answers: `/api/form/progressive-generation/answers/{session_id}`
   - Calls `onComplete` callback → `handleProgressiveGenerationComplete` in `App.js`

4. **Proposal saved** (`App.js:handleProgressiveGenerationComplete`)
   - Validates response structure
   - Creates proposal via `/api/proposals/`
   - Navigates to review page

### Failure Points
- AI service initialization (missing OPENAI_API_KEY)
- SSE connection timeout (>120s)
- Callback chain break (onComplete not called)
- Save API failure (auth/validation errors)

## Partner Library Integration

The system maintains a reusable partner library with advanced features:

### Partner Management Flow
1. **Auto-creation**: Partners entered in proposal forms are automatically added to library
2. **Deduplication**: System checks for existing partners by name and country
3. **Search Integration**: Real-time search suggestions when entering partner names
4. **Web Crawling**: Extract partner info from websites (`WebCrawlerService`)
5. **Affinity Scoring**: Calculate compatibility between partners and projects

### Data Structure
- Partners stored in `partners` table with rich metadata
- Linked to proposals via `partner_proposal` association table
- Both library partners and legacy JSON partners supported for backward compatibility

### Key Files
- `backend/app/api/partners.py` - Partner management endpoints
- `backend/app/services/partner_affinity_service.py` - Compatibility scoring
- `frontend/src/components/Partners.jsx` - Partner library UI
- `frontend/src/components/ProjectInputForm.jsx` - Partner search integration

## OpenAI Integration

### Current Configuration
- **Model**: `gpt-4o` (set in `backend/app/core/config.py:OPENAI_MODEL`)
- **SDK**: `openai==1.12.0` (AsyncOpenAI and OpenAI clients)
- **API Method**: `client.chat.completions.create()`

**Parameters used across all services:**
- `model`: From `settings.OPENAI_MODEL` (default `gpt-4o`)
- `messages`: List of `{"role": "system"|"user", "content": "..."}`
- `temperature`: Float 0-2 (typically 0.5-0.9 depending on question type)
- `max_tokens`: Integer (typically 400-1200 depending on character limits)

**Temperature settings by question type** (in `ai_autofill_service.py`):
- Project summary / relevance / needs analysis / partnership: `0.7` (balanced)
- Impact / dissemination / sustainability: `0.9` (creative/forward-thinking)
- Project management / budget / timeline: `0.5` (precise/factual)
- Innovation-related questions: `0.9` (creative thinking)

### OpenAI Service Implementation
- `backend/app/services/openai_service.py` - Main service class with async and sync clients
- `generate_completion()` - Async method for chat completions (system_prompt, user_prompt, max_tokens, temperature)
- `generate_chat_completion()` - Sync method accepting a messages list
- `generate_answer()` - Generates answers for specific form questions
- Error handling for quota limits and API failures
- Automatic retry logic (max 2 retries) for transient failures
- Client timeout: 90 seconds with 2 max retries
- Uses `settings.OPENAI_MODEL` for model selection

### AI Auto-Fill Service
- `backend/app/services/ai_autofill_service.py` - Orchestrates full application generation
- `_call_ai()` - Core method calling `chat.completions.create()` with temperature and max_tokens
- Parallel question processing (2 concurrent) with rate limit handling
- Per-question timeout of 45 seconds
- Quality scoring and cross-section consistency validation

### Partner Affinity Service
- `backend/app/services/partner_affinity_service.py` - Uses synchronous OpenAI client
- Standard parameters: `temperature=0.7`, `max_tokens=800`
- Returns JSON-structured affinity scores (0-100)

## Important Notes

- Using OpenAI GPT-4o (configured in backend/app/core/config.py)
- Deployed on Render.com with PostgreSQL database
- All configuration is in `render.yaml`
- Progressive generation uses SSE for real-time updates
- Sessions stored in Redis (production) or memory (development)
- Partners are automatically linked between proposals and library
- Always work on Render front and backend when building - deploy and use Render MCP to check deployment logs
- Do not use or test on localhost unless explicitly for development
- You have to always deploy to render and check the logs if successful, we do not do anything locally
- never push to render without my explicit request