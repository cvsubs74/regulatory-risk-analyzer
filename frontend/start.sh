#!/bin/bash
# Quick start script for frontend development

echo "🚀 Starting Regulatory Risk Analyzer Frontend..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found!"
    echo "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local"
        echo "⚠️  Please update REACT_APP_API_URL in .env.local if needed"
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

echo ""
echo "Starting development server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""

npm start
