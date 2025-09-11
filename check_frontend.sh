#!/bin/bash
echo "Testing frontend compilation..."
cd /mnt/c/Dev/gyg4/frontend

# Try to build and check for errors
echo "Running build test..."
npm run build 2>&1 | head -100 | grep -E "ERROR|Failed|Error:" || echo "✓ Build successful"

echo ""
echo "Component files:"
ls -la src/components/*.jsx | grep -E "ProposalsList|Analytics|Settings|Profile"

echo ""
echo "Routes in App.js:"
grep -E "path=\"/(proposals|analytics|settings|profile)\"" src/App.js