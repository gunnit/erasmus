# 🚀 Quick Start Guide

Get the Erasmus+ Form Completion System running in 5 minutes!

## Prerequisites

- Python 3.11+ installed
- Node.js 18+ installed
- Anthropic API key (get one at https://console.anthropic.com)

## Step 1: Clone or Download

```bash
git clone <repository-url>
cd gyg4
```

## Step 2: Set Up Your API Key

Create a file `backend/.env` with your Claude API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

## Step 3: Start the System

### On Mac/Linux/WSL:
```bash
./start.sh
```

### On Windows:
```batch
start.bat
```

## Step 4: Access the Application

Open your browser and go to:
- **Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

## 🎯 How to Use

1. **Enter Project Details**
   - Fill in your project title and idea (minimum 200 characters)
   - Add your organization details
   - Add at least 2 partner organizations
   - Select 1-3 EU priorities
   - Describe your target groups

2. **Generate Application**
   - Click "Generate Application"
   - Wait 30-60 seconds for AI processing

3. **Review & Edit**
   - Review each section's answers
   - Click on any answer to edit it
   - Check character counts stay within limits

4. **Export**
   - Export as JSON for backup
   - Export as PDF for submission

## 💡 Tips for Best Results

1. **Project Idea**: Be specific and detailed (500+ words recommended)
2. **Priorities**: Choose priorities that align with your project
3. **Partners**: Include diverse, complementary organizations
4. **Target Groups**: Be specific about demographics and needs

## 🔧 Troubleshooting

### "Port already in use"
Stop any running servers:
```bash
# Mac/Linux
killall node
killall python

# Windows
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

### "ANTHROPIC_API_KEY not found"
Make sure you created `backend/.env` with your API key

### "Module not found"
Install dependencies:
```bash
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

## 📊 What You Get

- ✅ Complete answers for all form sections
- ✅ Character limit compliance
- ✅ EU priority alignment
- ✅ Estimated score prediction
- ✅ Professional language and structure
- ✅ 95% time savings

## 🆘 Need Help?

- Check the full README.md for detailed documentation
- Review the API docs at http://localhost:8000/docs
- Check console logs for error messages

## 🎉 Ready to Generate!

Your system is now ready. Start with a clear project idea and let the AI handle the complex form completion!