# Erasmus+ Form Completion System Launcher
# PowerShell Script for Windows

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         ERASMUS+ FORM COMPLETION SYSTEM" -ForegroundColor Green
Write-Host "              OpenAI GPT-4 Edition" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
    Write-Host "[OK] Python found: py" -ForegroundColor Green
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
    Write-Host "[OK] Python found: python" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Python not found!" -ForegroundColor Red
    Write-Host "Please install from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host "Please install from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Node.js found" -ForegroundColor Green
Write-Host ""

# Backend Setup
Write-Host "Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (!(Test-Path venv)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    & $pythonCmd -m venv venv
}

Write-Host "Installing backend packages..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1
pip install --quiet --upgrade pip
pip install --quiet fastapi uvicorn openai pydantic pydantic-settings python-dotenv sqlalchemy psycopg2-binary

Set-Location ..

# Frontend Setup
Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (!(Test-Path node_modules)) {
    Write-Host "Installing frontend packages (this may take a few minutes)..." -ForegroundColor Cyan
    npm install --legacy-peer-deps --silent
}

Set-Location ..

# Start Servers
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "              STARTING SERVERS..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; Write-Host 'Backend at http://localhost:8000' -ForegroundColor Green; uvicorn app.main:app --reload --port 8000"

# Wait for backend
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend at http://localhost:3000' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "           SYSTEM IS RUNNING!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Yellow
Write-Host "API Docs:     " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend App: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "The browser will open automatically when ready." -ForegroundColor Cyan
Write-Host "Press any key to stop all servers..." -ForegroundColor Gray
Write-Host ""

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop servers
Get-Process | Where-Object {$_.MainWindowTitle -like "*backend*"} | Stop-Process -Force
Get-Process | Where-Object {$_.MainWindowTitle -like "*frontend*"} | Stop-Process -Force
Write-Host "Servers stopped." -ForegroundColor Yellow