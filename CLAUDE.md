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
5. User reviews/edits in `AnswerReview.jsx` or `ProposalDetail.jsx`
6. Proposal saved to database with authentication

### Backend Structure (`/backend/app/`)

**API Layer** (`api/`)
- `form_generator.py` - Main orchestrator for form generation, handles PDF export
- `single_question_generator.py` - Generate individual answers with context
- `progressive_generator.py` - Progressive generation with SSE streaming
- `proposals.py` - CRUD operations for saved proposals
- `auth.py` - JWT authentication endpoints
- `dashboard.py` - Real-time statistics and metrics

**Service Layer** (`services/`)
- `ai_autofill_service.py` - Core AI logic using OpenAI GPT
- `prompts_config.py` - Question-specific prompt templates
- `openai_service.py` - OpenAI API integration with `generate_completion()` method

**Data Layer** (`db/`)
- `models.py` - SQLAlchemy models (User, Proposal)
- `database.py` - Database connection and session management

### Frontend Structure (`/frontend/src/`)

**Components**
- `App.js` - Main app controller with state management
- `ProjectInputForm.jsx` - Multi-step form for project input
- `AnswerReview.jsx` - Review and edit generated answers
- `ProposalDetail.jsx` / `ProposalDetailNew.jsx` - View/edit individual proposals with PDF export
- `Dashboard.jsx` - Real-time metrics and proposal management
- `ProgressiveGenerationModal.jsx` - Real-time generation progress display

**Services**
- `api.js` - Centralized API client with auth interceptors (60s timeout for single answers, 120s for full generation)

**Context**
- `AuthContext.js` - Authentication state management

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
- `GET/POST /api/proposals/` - List/create proposals
- `GET/PUT/DELETE /api/proposals/{id}` - Manage specific proposal
- `POST /api/proposals/{id}/submit` - Submit proposal

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
- **User**: id, username, email, hashed_password, full_name, organization, created_at, is_active
- **Proposal**: id, user_id, title, project_idea, priorities, target_groups, partners, duration_months, budget, answers (JSON), status, created_at, updated_at, submitted_at

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
python test_basic.py             # Basic API tests
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

## Important Notes

- Using OpenAI GPT-4 (not Anthropic Claude)
- Deployed on Render.com with PostgreSQL database
- All configuration is in `render.yaml`
- Progressive generation uses SSE for real-time updates
- Sessions stored in Redis (production) or memory (development)
- Always work on Render front and backend when building - deploy and use Render MCP to check deployment logs
- Do not use or test on localhost unless explicitly for development
- you have to always deploy to render and check the logs if successeful , we do not do anything localy