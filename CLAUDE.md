# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Erasmus+ KA220-ADU grant application auto-completion system that reduces form completion time from 40-60 hours to 30 minutes using AI to generate comprehensive answers for all 27 application questions.

## Commands

### Quick Start
```bash
# Start both frontend and backend (WSL/Linux)
./start.sh

# Alternative start scripts
./fast-start.sh         # Optimized startup
./start-improved.sh     # Enhanced with better error handling
./start-neo4j.sh        # Start with Neo4j database support
```

### Backend Development
```bash
cd backend

# Create/activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies  
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000

# Run tests
python test_autofill.py        # Test complete auto-fill flow
python test_proposal_save.py   # Test proposal persistence
python test_error_handling.py  # Test error scenarios
python validate_autofill.py    # Validate setup
python test_basic.py           # Basic API tests
python test-neo4j-integration.py  # Neo4j integration tests
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Check frontend imports
node test_frontend_imports.js
bash check_frontend.sh
```

## Architecture

### Core Application Flow
1. User inputs project details → `ProjectInputForm.jsx`
2. Frontend sends to `/api/form/generate-answers` 
3. Backend orchestrates AI generation via `ai_autofill_service.py`
4. AI generates ALL 27 answers with context awareness
5. User reviews/edits in `AnswerReview.jsx`
6. Proposal saved to database with full authentication

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
- `ai_autofill_service.py` - Core AI logic, manages context between questions
- `prompts_config.py` - Question-specific prompt templates
- `claude_service.py` - Anthropic Claude API integration
- `openai_service.py` - OpenAI fallback service

**Data Layer** (`db/`)
- `models.py` - SQLAlchemy models (User, Proposal)
- `database.py` - Database connection and session management
- `neo4j_db.py` - Neo4j graph database support (optional)

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
ANTHROPIC_API_KEY=sk-ant-...  # Claude API key
DATABASE_URL=sqlite:///./erasmus_forms.db
SECRET_KEY=your-secret-key-change-in-production

# Optional
OPENAI_API_KEY=sk-...  # OpenAI fallback
STRIPE_SECRET_KEY=...  # Payment processing
NEO4J_URI=bolt://localhost:7687  # Graph database
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
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

# Frontend testing
cd frontend
npm test                        # Run React tests
node test_frontend_imports.js   # Verify imports
```

## Common Issues & Solutions

1. **API Timeout**: Generation takes 30-60s - ensure frontend timeout > 60s
2. **CORS Errors**: Backend on :8000, frontend on :3000 - check CORS middleware in `main.py`
3. **Missing Answers**: Run `validate_autofill.py` to verify question mapping
4. **Database Issues**: Check `DATABASE_URL` in `.env`, run migrations
5. **Port Conflicts**: Use `lsof -i :PORT` to check, defaults are 3000/8000
6. **PDF Export 404**: Ensure ReportLab is installed, check temp directory permissions
7. **Authentication Errors**: Check JWT secret key, token expiration settings

## Production Deployment

### Backend (Render/Railway)
- Python 3.11+ runtime
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set all environment variables in platform dashboard
- Enable health checks on `/api/health/ready`

### Frontend (Vercel/Netlify)
- Build command: `npm run build`
- Publish directory: `build/`
- Update API endpoint in `src/services/api.js` to production URL
- Set environment variable `REACT_APP_API_URL`

### Database Production
- Use PostgreSQL for production (update `DATABASE_URL`)
- Run migrations: `alembic upgrade head`
- Enable SSL for database connections
- Regular backups recommended