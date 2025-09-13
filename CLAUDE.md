# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

## Project Overview

Erasmus+ KA220-ADU grant application auto-completion system that reduces form completion time from 40-60 hours to 30 minutes using OpenAI GPT to generate comprehensive answers for all 27 application questions.

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
2. Frontend sends to `/api/form/generate-answers`
3. Backend orchestrates AI generation via `ai_autofill_service.py`
4. OpenAI generates ALL 27 answers with context awareness
5. User reviews/edits in `AnswerReview.jsx`
6. Proposal saved to database with authentication

### Backend Structure (`/backend/app/`)

**API Layer** (`api/`)
- `form_generator.py` - Main orchestrator for form generation, handles PDF export
- `proposals.py` - CRUD operations for saved proposals
- `auth.py` - JWT authentication endpoints
- `dashboard.py` - Real-time statistics and metrics
- `user_profile.py` - User profile management
- `analytics.py` - Analytics data aggregation
- `settings.py` - User settings management

**Service Layer** (`services/`)
- `ai_autofill_service.py` - Core AI logic using OpenAI GPT
- `prompts_config.py` - Question-specific prompt templates
- `openai_service.py` - OpenAI API integration

**Data Layer** (`db/`)
- `models.py` - SQLAlchemy models (User, Proposal)
- `database.py` - Database connection and session management

### Frontend Structure (`/frontend/src/`)

**Components**
- `App.js` - Main app controller with state management
- `ProjectInputForm.jsx` - Multi-step form for project input
- `AnswerReview.jsx` - Review and edit generated answers
- `Dashboard.jsx` - Real-time metrics and proposal management
- `ProposalDetail.js` - View/edit individual proposals with PDF export
- `Profile.jsx` - User profile management
- `Settings.jsx` - Application settings
- `Analytics.jsx` - Data visualization and insights

**Services**
- `api.js` - Centralized API client with auth interceptors

**Context**
- `AuthContext.js` - Authentication state management

## Key API Endpoints

### Form Generation
- `POST /api/form/generate-answers` - Generate all 27 answers (30-60s)
- `GET /api/form/questions` - Get form structure
- `GET /api/form/priorities` - Get EU priorities list
- `GET /api/form/pdf/{id}` - Download generated PDF
- `POST /api/form/validate` - Validate answers

### Proposals
- `GET/POST /api/proposals/` - List/create proposals
- `GET/PUT/DELETE /api/proposals/{id}` - Manage specific proposal
- `POST /api/proposals/{id}/submit` - Submit proposal

### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `GET/PUT /api/profile/` - Profile management
- `POST /api/profile/change-password` - Password update

### Analytics & Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/analytics/stats` - Analytics overview
- `GET /api/analytics/trends` - Trend data

## Environment Configuration

### Backend (`backend/.env`)
```env
# Required
OPENAI_API_KEY=sk-...  # OpenAI API key
DATABASE_URL=postgresql://...  # Set by Render automatically
SECRET_KEY=your-secret-key-change-in-production

# Application Settings
DEBUG=False  # Set to False in production
```

### Frontend Configuration
- API endpoint: `http://localhost:8000/api` (in `src/services/api.js`)
- Tailwind CSS with custom configuration
- React Router v6 for navigation
- Framer Motion for animations
- Recharts for data visualization

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

## Database Schema

### SQLAlchemy Models
- **User**: id, username, email, hashed_password, full_name, organization, created_at, is_active
- **Proposal**: id, user_id, title, project_idea, priorities, target_groups, partners, duration_months, budget, answers (JSON), status, created_at, updated_at, submitted_at

### Alembic Migrations
- Located in `backend/alembic/versions/`
- Run with `alembic upgrade head`

## Testing & Validation

```bash
# Backend validation
cd backend
python validate_autofill.py     # Verify all 27 questions are mapped
python test_autofill.py         # Test actual generation
python test_proposal_save.py    # Test database persistence
python test_error_handling.py   # Test error scenarios
python test_basic.py           # Basic API tests

# Frontend testing
cd frontend
npm test                        # Run React tests
```

## Common Issues & Solutions

1. **API Timeout**: Generation takes 30-60s - ensure frontend timeout > 60s
2. **CORS Errors**: Backend on :8000, frontend on :3000 - check CORS middleware in `main.py`
3. **Missing Answers**: Run `validate_autofill.py` to verify question mapping
4. **Database Issues**: Check `DATABASE_URL` in `.env`, run migrations
5. **Port Conflicts**: Use `lsof -i :PORT` to check, defaults are 3000/8000
6. **PDF Export 404**: Ensure ReportLab is installed, check temp directory permissions
7. **Authentication Errors**: Check JWT secret key, token expiration settings

## Production Deployment (Render)

### Backend
- Python 3.11+ runtime
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables set in Render dashboard
- Health checks on `/api/health/ready`

### Frontend
- Build command: `npm run build`
- Publish directory: `build/`
- Update API endpoint in `src/services/api.js` to production URL
- Set environment variable `REACT_APP_API_URL`

### Database
- PostgreSQL on Render (automatically configured)
- DATABASE_URL is automatically injected by Render
- Run migrations: `alembic upgrade head`
- Enable SSL for database connections

## Important Notes

- Using OpenAI GPT-4 (not Anthropic Claude)
- Deployed on Render.com with PostgreSQL database
- All configuration is in `render.yaml`