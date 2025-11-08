#!/bin/bash
# Script to deploy the Regulatory Risk Assessment Agent to Google Cloud Run

# Exit on error
set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"graph-rag-app-20250811"}
REGION=${GOOGLE_CLOUD_LOCATION:-"us-east1"}
SERVICE_NAME="regulatory-risk-assessment-agent"
AGENT_PATH="agents"

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
    --with_ui \
    --log_level debug \
    "$AGENT_PATH"

# Capture the URL of the deployed service
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)' 2>&1)
echo ""
echo "✅ Successfully deployed to: $SERVICE_URL"

# Set IAM policy to allow public access (to fix CORS)
echo ""
echo "🔐 Setting IAM policy for $SERVICE_NAME to allow public access..."
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --region="$REGION" \
    --platform=managed
echo "✅ IAM policy updated for $SERVICE_NAME"

echo ""
echo "========================================="
echo "✅ Backend deployment completed!"
echo "========================================="
echo "Backend API URL: https://${SERVICE_NAME}-pt7snlxyuq-ue.a.run.app"
echo "Environment variables loaded from agents/.env"
echo ""
echo "To test the backend:"
echo "  curl $SERVICE_URL/health"
echo ""
echo "Next steps:"
echo "  1. Update frontend/.env.production with REACT_APP_API_URL=$SERVICE_URL"
echo "  2. Deploy frontend with: cd frontend && npm run build && firebase deploy --only hosting"
echo "========================================="
