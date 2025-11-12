#!/bin/bash

# Deploy Gemini File Search API Cloud Function

echo "======================================"
echo "Deploying File Search API Cloud Function"
echo "======================================"

# Check if .env.yaml exists
if [ ! -f ".env.yaml" ]; then
    echo "Error: .env.yaml file not found!"
    echo "Please create .env.yaml with your GEMINI_API_KEY and DATA_STORE"
    exit 1
fi

# Deploy the function
echo "Deploying to Google Cloud Functions..."
gcloud functions deploy file-search-api \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=file_search_api \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml \
  --timeout=540s \
  --memory=512MB

# Get the function URL
echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Getting function URL..."
FUNCTION_URL=$(gcloud functions describe file-search-api --gen2 --region=us-central1 --format="value(serviceConfig.uri)")

echo ""
echo "✅ Function deployed successfully!"
echo ""
echo "Function URL: $FUNCTION_URL"
echo ""
echo "Next steps:"
echo "1. Update your frontend .env file with:"
echo "   REACT_APP_FILE_SEARCH_URL=$FUNCTION_URL"
echo ""
echo "2. Test the function:"
echo "   curl \"$FUNCTION_URL?operation=list\""
echo ""
