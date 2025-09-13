
# GEMINI.md

## Project Overview

This project is an AI-powered system that automates the completion of Erasmus+ KA220-ADU grant application forms. The goal is to significantly reduce the time and effort required for this process, from 40-60 hours to around 30 minutes.

The application is a full-stack web application with a React frontend and a Python (FastAPI) backend. It uses an OpenAI model (GPT-4) to generate tailored answers for the grant application questions, ensuring alignment with EU priorities and maximizing evaluation scores.

### Key Technologies

*   **Frontend:** React, React Router, Tailwind CSS, Axios
*   **Backend:** FastAPI, SQLAlchemy, Alembic, Uvicorn
*   **AI:** OpenAI GPT-4
*   **Database:** PostgreSQL
*   **Deployment:** Render

### Architecture

The project is structured as a monorepo with two main directories: `frontend` and `backend`.

*   `frontend`: Contains the React application, including components, services for API communication, and routing.
*   `backend`: Contains the FastAPI application, with API endpoints, database models, business logic, and AI integration services.

## Building and Running

### Prerequisites

*   Python 3.11+
*   Node.js 18+
*   OpenAI API key

### Quick Start (WSL/Linux)

1.  **Set up API key:**
    ```bash
    cp .env.example .env
    # Edit .env with your OpenAI API key and database URL
    ```

2.  **Run the application:**
    ```bash
    chmod +x start.sh
    ./start.sh
    ```

3.  **Access the application:**
    *   Frontend: http://localhost:3000
    *   Backend API: http://localhost:8000
    *   API Documentation: http://localhost:8000/docs

### Manual Installation

**Backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OpenAI API key and database URL
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm start
```

## Development Conventions

### Testing

*   **Backend:** Run tests using `pytest` in the `backend` directory.
    ```bash
    cd backend
    pytest
    ```

*   **Frontend:** Run tests using `npm test` in the `frontend` directory.
    ```bash
    cd frontend
    npm test
    ```

### Deployment

The application is configured for deployment on Render. The `render.yaml` file defines the services and database. The `build.sh` script handles the backend build process.
