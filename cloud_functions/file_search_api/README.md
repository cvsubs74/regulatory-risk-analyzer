# Gemini File Search API - Cloud Function

This Cloud Function provides direct access to Gemini File Search API for document management.

## Deployment

1. **Set your Gemini API key in `.env.yaml`**

2. **Deploy the function:**
```bash
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
```

3. **Get the function URL:**
```bash
gcloud functions describe file-search-api --gen2 --region=us-central1 --format="value(serviceConfig.uri)"
```

## API Endpoints

### Upload File
```bash
POST {FUNCTION_URL}?operation=upload
Content-Type: application/json

{
  "file_data": "base64_encoded_content",
  "filename": "document.pdf",
  "mime_type": "application/pdf",
  "display_name": "My Document"
}
```

### Search Documents
```bash
POST {FUNCTION_URL}?operation=search
Content-Type: application/json

{
  "query": "What are the payment terms?"
}
```

### List Files
```bash
GET {FUNCTION_URL}?operation=list
```

### Delete File
```bash
POST {FUNCTION_URL}?operation=delete
Content-Type: application/json

{
  "file_name": "files/abc123"
}
```

## Environment Variables

- `GEMINI_API_KEY`: Your Gemini API key
- `DATA_STORE`: Name of the File Search store (default: "data_v1")

## Testing Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY="your-key"
export DATA_STORE="data_v1"

# Run locally
functions-framework --target=file_search_api --debug
```
