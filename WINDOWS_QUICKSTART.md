# 🚀 Windows Quick Start Guide

## Prerequisites
- Python 3.8+ (check with `python --version`)
- Node.js 18+ (check with `node --version`)

## Step 1: Initial Setup (One-time only)

Open **Command Prompt** as Administrator and run:

```cmd
cd C:\Dev\gyg4
setup-windows.bat
```

This will install all dependencies.

## Step 2: Start the Application

You need **TWO Command Prompt windows**:

### Window 1 - Backend Server:
```cmd
cd C:\Dev\gyg4\backend
venv\Scripts\activate
pip install openai pydantic-settings
uvicorn app.main:app --reload --port 8000
```

### Window 2 - Frontend:
```cmd
cd C:\Dev\gyg4\frontend
npm start
```

## Step 3: Access the Application

- **Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

## Troubleshooting

### "Module not found" errors:
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements.txt
pip install openai pydantic-settings
```

### "react-scripts not found":
```cmd
cd frontend
npm install --legacy-peer-deps
```

### Port already in use:
```cmd
netstat -ano | findstr :8000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Test backend configuration:
```cmd
cd backend
venv\Scripts\activate
python ..\test-backend.py
```

## Your Configuration

The system is configured to use:
- **OpenAI GPT-4** for AI generation
- **Neon PostgreSQL** database
- Your API keys from the .env file

## Quick Test

1. Once both servers are running, go to http://localhost:3000
2. Fill in a simple test project:
   - Title: "Digital Skills for Senior Citizens"
   - Project idea: (200+ characters about teaching digital skills)
   - Add 2 partner organizations
   - Select 1-2 priorities
3. Click "Generate Application"

The system will use OpenAI to generate all form answers!