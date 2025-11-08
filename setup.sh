#!/bin/bash
# Setup script for Regulatory Risk Analyzer

set -e

echo "========================================="
echo "Regulatory Risk Analyzer - Setup"
echo "========================================="

# Check if we're in the right directory
if [ ! -d "risk_assessment_agent" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the regulatory_risk_analyzer directory"
    exit 1
fi

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd risk_assessment_agent

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found in risk_assessment_agent/"
    echo "Please create one with your Google Cloud configuration:"
    echo ""
    echo "GOOGLE_CLOUD_PROJECT=your-project-id"
    echo "GOOGLE_CLOUD_LOCATION=us-east1"
    echo ""
    read -p "Press Enter to continue after creating .env file..."
fi

echo "✅ Backend setup complete"

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend

# Copy .env.example to .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
        echo "⚠️  Please update .env.local with your backend URL"
    else
        echo "⚠️  No .env.example found"
    fi
fi

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Installing npm dependencies..."
    npm install
    echo "✅ npm dependencies installed"
else
    echo "✅ npm dependencies already installed"
fi

cd ..

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Backend (Terminal 1):"
echo "   cd risk_assessment_agent"
echo "   adk web"
echo ""
echo "2. Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. To deploy to cloud:"
echo "   ./deploy_to_cloud.sh"
echo ""
echo "========================================="
