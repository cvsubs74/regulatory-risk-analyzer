#!/bin/bash
# Start the Risk Assessment Agent backend with CORS enabled

echo "🚀 Starting Risk Assessment Agent Backend..."
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "CORS enabled for: http://localhost:3000"
echo ""

# Start ADK with CORS enabled for local development
adk api_server  --allow_origins="*" 
