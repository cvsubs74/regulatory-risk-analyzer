# Regulatory Risk Analyzer - Deployment Guide

## Quick Start (Local Development)

### 1. Setup
```bash
cd regulatory_risk_analyzer
./setup.sh
```

### 2. Run Backend (Terminal 1)
```bash
cd risk_assessment_agent
adk web
```
Backend runs on: `http://localhost:8000`

### 3. Run Frontend (Terminal 2)
```bash
cd frontend
./start.sh
```
Frontend runs on: `http://localhost:3000`

## Production Deployment

### Step 1: Deploy Backend to Cloud Run

```bash
cd regulatory_risk_analyzer
./deploy_to_cloud.sh
```

**Expected Output:**
```
✅ Backend deployment completed!
Backend API URL: https://regulatory-risk-assessment-agent-xxxxx.a.run.app
```

**Copy the backend URL** - you'll need it for frontend configuration.

### Step 2: Configure Frontend for Production

Update `frontend/.env.production`:
```bash
REACT_APP_API_URL=https://regulatory-risk-assessment-agent-xxxxx.a.run.app
REACT_APP_DEFAULT_CORPUS=data_v1
```

### Step 3: Deploy Frontend to Firebase

```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Expected Output:**
```
✔  Deploy complete!
Hosting URL: https://your-project.web.app
```

## Environment Variables

### Backend (.env in risk_assessment_agent/)
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-east1
```

### Frontend (.env.local for development)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEFAULT_CORPUS=data_v1
```

### Frontend (.env.production for production)
```
REACT_APP_API_URL=https://regulatory-risk-assessment-agent-xxxxx.a.run.app
REACT_APP_DEFAULT_CORPUS=data_v1
```

## Testing the Deployment

### 1. Test Backend Health
```bash
curl https://regulatory-risk-assessment-agent-xxxxx.a.run.app/health
```

### 2. Test Backend API
```bash
curl -X POST https://regulatory-risk-assessment-agent-xxxxx.a.run.app/apps/risk_assessment_agent/users/user/sessions/test \
  -H "Content-Type: application/json" \
  -d '{"user_input": "List all available corpora"}'
```

### 3. Test Frontend
Open your browser to: `https://your-project.web.app`

## Adding Sample Documents to Corpus

### Option 1: Upload via GCS

1. **Upload documents to GCS bucket:**
```bash
gsutil cp risk_assessment_agent/data/*.txt gs://your-bucket/regulatory-docs/
```

2. **Add to corpus via UI:**
- Navigate to Documents page
- Enter GCS path: `gs://your-bucket/regulatory-docs/global_customer_analytics.txt`
- Click "Add Document to Corpus"

### Option 2: Use the Agent Directly

```bash
# Via ADK CLI
adk chat risk_assessment_agent

# Then in the chat:
> Add the document gs://your-bucket/regulatory-docs/global_customer_analytics.txt to the data_v1 corpus
```

## Sample Documents Included

The `risk_assessment_agent/data/` directory contains 6 complex business process documents:

1. **global_customer_analytics.txt** - Cross-border analytics with EU→US transfers
2. **advertising_monetization.txt** - Data sales to ad tech partners
3. **credit_risk_assessment.txt** - International credit scoring
4. **healthcare_research_collaboration.txt** - Medical research data sharing
5. **employee_monitoring_analytics.txt** - Workforce surveillance
6. **child_data_educational_platform.txt** - Children's data processing

Each demonstrates complex compliance scenarios.

## Common Issues & Solutions

### Backend Issues

**Issue: "Module not found" errors**
```bash
cd risk_assessment_agent
pip install -r requirements.txt  # If you have one
pip install google-adk vertexai
```

**Issue: "Authentication failed"**
```bash
gcloud auth login
gcloud auth application-default login
```

**Issue: "Corpus not found"**
- Create the corpus first using the agent's `create_corpus` tool
- Or use the default `data_v1` corpus

### Frontend Issues

**Issue: "Cannot connect to backend"**
- Check `REACT_APP_API_URL` in `.env.local` or `.env.production`
- Ensure backend is running
- Check CORS settings (backend should have `--allow_origins="*"`)

**Issue: "npm install fails"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue: "Build fails"**
```bash
# Clear cache
rm -rf node_modules build
npm install
npm run build
```

## Monitoring & Logs

### Backend Logs (Cloud Run)
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=regulatory-risk-assessment-agent" --limit 50
```

### Frontend Logs (Firebase)
- Check browser console for errors
- Use Firebase Console → Hosting → Usage

## Updating the Application

### Update Backend
```bash
cd regulatory_risk_analyzer
# Make your changes to risk_assessment_agent/
./deploy_to_cloud.sh
```

### Update Frontend
```bash
cd frontend
# Make your changes to src/
npm run build
firebase deploy --only hosting
```

## Security Considerations

1. **API Authentication**: Consider adding authentication to the backend
2. **CORS**: In production, restrict `--allow_origins` to your frontend domain
3. **Environment Variables**: Never commit `.env` files with sensitive data
4. **GCS Permissions**: Ensure service account has minimal required permissions
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

## Cost Optimization

1. **Cloud Run**: Uses pay-per-request pricing
   - Set min instances to 0 for development
   - Set max instances to limit costs

2. **Vertex AI RAG**: Charges for:
   - Document storage
   - Embedding generation
   - Query requests

3. **Firebase Hosting**: Free tier includes 10GB storage and 360MB/day transfer

## Support & Troubleshooting

For issues:
1. Check logs (backend and frontend)
2. Verify environment variables
3. Test backend API directly with curl
4. Check Google Cloud Console for service status
5. Review README.md for detailed documentation

## Next Steps

After deployment:
1. Add your business process documents to the corpus
2. Test regulatory analysis queries
3. Customize regulations list in `frontend/src/pages/Chat.jsx`
4. Add authentication if needed
5. Configure custom domain for frontend
6. Set up monitoring and alerts
