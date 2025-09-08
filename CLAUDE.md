# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Erasmus+ KA220-ADU grant application auto-completion system that uses AI to generate comprehensive answers for all 27 application questions based on a user's project idea.

## Architecture

### Backend (FastAPI + Python)
- **Location**: `/backend/`
- **Main entry**: `app/main.py`
- **API Structure**:
  - `/api/form/generate-answers` - Main endpoint that triggers AI auto-fill for all 27 questions
  - `/api/form/questions` - Returns form structure
  - `/api/form/priorities` - Returns available EU priorities
  - `/api/health/ready` - Health check endpoint

### Frontend (React)
- **Location**: `/frontend/`
- **Main components**:
  - `App.js` - Main application flow (input → generating → review)
  - `ProjectInputForm.js` - Initial project data collection
  - `AnswerReview.js` - Display and edit all generated answers

### AI Services
- **AIAutoFillService** (`backend/app/services/ai_autofill_service.py`) - Comprehensive service that fills ALL 27 questions with context-aware answers
- **PromptsConfig** (`backend/app/services/prompts_config.py`) - Specialized prompts for each question type
- **Form Questions** (`backend/data/form_questions.json`) - Complete structure of all 27 questions across 6 sections

## Commands

### Backend
```bash
cd backend
# Start server
uvicorn app.main:app --reload --port 8000

# Install dependencies
pip install -r requirements.txt

# Validate auto-fill setup
python validate_autofill.py

# Test auto-fill functionality
python test_autofill.py
```

### Frontend  
```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Environment Configuration

### Backend (.env)
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

### Frontend
API calls default to `http://localhost:8000/api`

## Key Implementation Details

### Auto-Fill Flow
1. User enters project idea on first page
2. `form_generator.py` receives request with project context
3. `AIAutoFillService.auto_fill_complete_application()` is called
4. System processes all 27 questions across 6 sections sequentially
5. Each answer is context-aware, using previous answers to maintain consistency
6. All answers respect character limits and evaluation criteria

### Question Sections (27 total)
- **Project Summary**: 3 questions
- **Relevance**: 6 questions  
- **Needs Analysis**: 4 questions
- **Partnership**: 3 questions
- **Impact**: 4 questions
- **Project Management**: 7 questions

### AI Context Management
The system maintains context memory across sections to ensure:
- Consistency in budget, timeline, and objectives
- Progressive building of narrative
- Cross-reference between related questions
- Quality scoring for each answer

## Critical Files

- `backend/app/services/ai_autofill_service.py` - Core AI logic for auto-filling
- `backend/app/services/prompts_config.py` - Prompt templates and strategies
- `backend/data/form_questions.json` - Complete form structure
- `backend/app/api/form_generator.py` - API endpoint handling
- `frontend/src/services/api.js` - Frontend API client

## Testing Approach

To verify all questions are filled:
```bash
cd backend
python validate_autofill.py  # Checks setup
python test_autofill.py      # Runs actual auto-fill test
```

## Common Issues

1. **OpenAI timeout**: The auto-fill process generates 27 detailed answers and may take 30-60 seconds
2. **Character limits**: Each answer is optimized to fit within specified limits (2000-3000 chars typically)
3. **CORS**: Frontend runs on port 3000/3001, backend on 8000 - CORS is configured in main.py