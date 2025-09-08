# Startup Performance Guide

## 🚨 Current Issue
The frontend takes long to start because you're running it on WSL with files stored on Windows filesystem (`/mnt/c/`). This causes 10-20x slower performance.

## ✅ Quick Solution
**The app IS running!** Just open http://localhost:3000 in your browser - it's already working even if the terminal seems frozen.

## 🚀 Startup Options

### Option 1: Use Improved Start Script (Recommended)
```bash
./start-improved.sh
```
- Shows progress indicators
- Better error handling
- Performance tips

### Option 2: Fast Start (Minimal output)
```bash
./fast-start.sh
```
- Skips all checks
- Minimal console output
- Fastest startup

### Option 3: Manual Start (Most control)
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🎯 Performance Fixes

### Immediate Fix (2 min)
Already done! The `.env` file now includes:
- `GENERATE_SOURCEMAP=false` - Skips sourcemap generation
- `BROWSER=none` - Doesn't auto-open browser
- `FAST_REFRESH=true` - Faster hot reload

### Best Fix: Move to WSL Filesystem (5 min)
```bash
# Copy project to WSL native filesystem
cp -r /mnt/c/Dev/gyg4 ~/gyg4
cd ~/gyg4

# Start from WSL filesystem (10x faster!)
./start-improved.sh
```

### Why It's Slow on /mnt/c/
- WSL has to translate filesystem calls between Linux and Windows
- Each file read/write crosses the WSL boundary
- Node.js file watching is extremely slow across filesystems
- Webpack needs to read thousands of files

## 📊 Expected Startup Times

| Location | Initial Start | Hot Reload |
|----------|--------------|------------|
| /mnt/c/ (Windows) | 60-120 seconds | 10-20 seconds |
| ~/gyg4 (WSL native) | 10-15 seconds | 1-2 seconds |

## 🔍 Checking Status

To verify services are running:
```bash
# Check if frontend is responding
curl http://localhost:3000

# Check if backend is responding  
curl http://localhost:8000

# Check running processes
ps aux | grep -E "react|uvicorn"

# Check ports
netstat -tuln | grep -E "3000|8000"
```

## 💡 Tips
1. **Always check the browser first** - The app often works before the terminal shows "Compiled successfully"
2. **Use WSL native filesystem** for development when possible
3. **Kill zombie processes** if needed: `pkill -f "react-scripts"`
4. **Disable Windows Defender scanning** for node_modules folder

## 🛠️ Troubleshooting

### Terminal shows nothing after "react-scripts start"
**Solution**: This is normal on WSL. The app is compiling. Check http://localhost:3000

### Port already in use
**Solution**: Run `pkill -f "react-scripts" && pkill -f "uvicorn"`

### Very slow compilation
**Solution**: Move project to `~/gyg4` instead of `/mnt/c/Dev/gyg4`

### Can't access localhost:3000
**Solution**: 
1. Wait 60 seconds for initial compilation
2. Try http://127.0.0.1:3000 instead
3. Check Windows Firewall settings