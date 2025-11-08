#!/bin/bash
# Script to deploy the Regulatory Risk Assessment Agent to Google Cloud Run

# Exit on error
set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"graph-rag-app-20250811"}
REGION=${GOOGLE_CLOUD_LOCATION:-"us-east1"}
SERVICE_NAME="regulatory-risk-assessment-agent"
AGENT_PATH="risk_assessment_agent"

# Display configuration
echo "========================================="
echo "Regulatory Risk Assessment Agent Deployment"
echo "========================================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Agent Path: $AGENT_PATH"
echo "========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if adk is installed
if ! command -v adk &> /dev/null; then
    echo "❌ Error: ADK CLI is not installed. Please install it first."
    exit 1
fi

# Authenticate with Google Cloud if needed
echo "🔐 Checking authentication..."
if ! gcloud auth print-identity-token &> /dev/null; then
    echo "Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Set the project
echo "📦 Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Deploy using ADK CLI
echo "🚀 Deploying Regulatory Risk Assessment Agent to Cloud Run..."
adk deploy cloud_run \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --service_name="$SERVICE_NAME" \
    --allow_origins="*" \
    "$AGENT_PATH"

echo ""
echo "========================================="
echo "✅ Backend deployment completed!"
echo "========================================="
echo "Backend API URL will be displayed above."
echo "Environment variables loaded from $AGENT_PATH/.env"
echo ""
echo "To test the backend:"
echo "  curl https://$SERVICE_NAME-[hash].a.run.app/health"
echo ""
echo "Next steps:"
echo "  1. Note the backend URL from the deployment output"
echo "  2. Update frontend/.env with REACT_APP_API_URL"
echo "  3. Deploy frontend with: cd frontend && npm run deploy"
echo "========================================="
