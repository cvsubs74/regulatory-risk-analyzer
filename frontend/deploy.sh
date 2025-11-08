#!/bin/bash

# Deploy Regulatory Risk Analyzer Frontend to Firebase Hosting
# This script builds the React app and deploys it to Firebase

set -e  # Exit on error

echo "🚀 Starting deployment to Firebase Hosting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo -e "${BLUE}📋 Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Firebase...${NC}"
    firebase login
fi

# Set the Firebase project
echo -e "${BLUE}🎯 Setting Firebase project to regulatory-risk-analyzer...${NC}"
firebase use regulatory-risk-analyzer || firebase use --add

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Build the React app
echo -e "${BLUE}🔨 Building React application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo -e "${YELLOW}❌ Build failed! build directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""

# Deploy to Firebase Hosting
echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Your app is now live at:${NC}"
echo -e "${GREEN}   https://regulatory-risk-analyzer.web.app${NC}"
echo -e "${GREEN}   https://regulatory-risk-analyzer.firebaseapp.com${NC}"
echo ""
