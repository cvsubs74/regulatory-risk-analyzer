# Deployment Guide - Regulatory Risk Analyzer

## Overview

This guide covers deploying both the frontend (Firebase Hosting) and backend (Google Cloud Run) components.

---

## 🌐 Frontend Deployment (Firebase Hosting)

### Quick Deploy

```bash
cd frontend
./deploy.sh
```

### Manual Steps

1. **Install Firebase CLI** (if not installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Set Firebase Project**:
```bash
cd frontend
firebase use regulatory-risk-analyzer
```

4. **Build and Deploy**:
```bash
npm run build
firebase deploy --only hosting
```

### Live URLs
- **Primary**: https://regulatory-risk-analyzer.web.app
- **Alternative**: https://regulatory-risk-analyzer.firebaseapp.com

### Configuration

The Firebase configuration is already set up in:
- `frontend/firebase.json` - Hosting configuration
- `frontend/src/firebase.js` - Firebase SDK initialization

---

## ☁️ Backend Deployment (Google Cloud Run)

### Prerequisites

1. **Google Cloud Project**: `graph-rag-app-20250811` (or your project ID)
2. **APIs Enabled**:
   - Cloud Run API
   - Vertex AI API
   - Cloud Build API

### Deploy Backend Agent

```bash
cd regulatory_risk_analyzer
./deploy_to_cloud.sh
```

Or manually:

```bash
cd risk_assessment_agent

adk deploy cloud_run \
  --project=graph-rag-app-20250811 \
  --region=us-east1 \
  --service_name=regulatory-risk-assessment-agent \
  --allow_origins="*"
```

### Backend URL
After deployment, you'll get a URL like:
```
https://regulatory-risk-assessment-agent-XXXXX.us-east1.run.app
```

---

## 🔗 Connecting Frontend to Backend

### Option 1: Environment Variable (Recommended for Production)

1. Create `frontend/.env.production`:
```bash
REACT_APP_API_URL=https://regulatory-risk-assessment-agent-XXXXX.us-east1.run.app
```

2. Update `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

3. Rebuild and redeploy:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Option 2: Direct Configuration

Update `frontend/src/services/api.js` directly:
```javascript
const API_BASE_URL = 'https://regulatory-risk-assessment-agent-XXXXX.us-east1.run.app';
```

---

## 📋 Complete Deployment Checklist

### First Time Setup

- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Install Google Cloud SDK (for backend)
- [ ] Authenticate with Google Cloud: `gcloud auth login`
- [ ] Set Google Cloud project: `gcloud config set project graph-rag-app-20250811`

### Backend Deployment

- [ ] Navigate to `risk_assessment_agent` directory
- [ ] Run `./deploy_to_cloud.sh` or use `adk deploy cloud_run`
- [ ] Note the deployed backend URL
- [ ] Test backend endpoint: `curl https://YOUR-BACKEND-URL/health`

### Frontend Deployment

- [ ] Update API URL in frontend (if needed)
- [ ] Navigate to `frontend` directory
- [ ] Run `./deploy.sh` or `npm run deploy`
- [ ] Verify deployment at https://regulatory-risk-analyzer.web.app
- [ ] Test frontend can connect to backend

### Post-Deployment Verification

- [ ] Open https://regulatory-risk-analyzer.web.app
- [ ] Test chat functionality
- [ ] Test corpus-specific tabs
- [ ] Verify suggested questions work
- [ ] Check that responses don't mention "corpus"
- [ ] Verify auto-scroll works
- [ ] Test on mobile devices

---

## 🔧 Troubleshooting

### Frontend Issues

**Build Fails**:
```bash
cd frontend
rm -rf node_modules build
npm install
npm run build
```

**Firebase Deploy Fails**:
```bash
firebase login --reauth
firebase use regulatory-risk-analyzer
firebase deploy --only hosting --debug
```

### Backend Issues

**CORS Errors**:
Ensure backend was deployed with `--allow_origins="*"`:
```bash
adk deploy cloud_run --allow_origins="*"
```

**Backend Not Responding**:
Check Cloud Run logs:
```bash
gcloud run services logs read regulatory-risk-assessment-agent \
  --project=graph-rag-app-20250811 \
  --region=us-east1
```

### Connection Issues

**Frontend Can't Reach Backend**:
1. Check backend URL in browser
2. Verify CORS headers
3. Check browser console for errors
4. Ensure backend service is running in Cloud Run console

---

## 📊 Monitoring

### Frontend (Firebase)
- **Console**: https://console.firebase.google.com/project/regulatory-risk-analyzer
- **Analytics**: View in Firebase Console > Analytics
- **Hosting**: View deployment history and rollback options

### Backend (Cloud Run)
- **Console**: https://console.cloud.google.com/run
- **Logs**: Cloud Logging in Google Cloud Console
- **Metrics**: CPU, memory, request count in Cloud Run dashboard

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Build
        run: cd frontend && npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: regulatory-risk-analyzer
```

---

## 📝 Environment-Specific Configurations

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

### Production
- Frontend: `https://regulatory-risk-analyzer.web.app`
- Backend: `https://regulatory-risk-assessment-agent-XXXXX.us-east1.run.app`

---

## 🚀 Quick Commands Reference

```bash
# Frontend
cd frontend
npm run build              # Build for production
npm run deploy            # Build and deploy to Firebase
./deploy.sh               # Automated deployment script

# Backend
cd risk_assessment_agent
./deploy_to_cloud.sh      # Deploy backend to Cloud Run

# Firebase
firebase login            # Authenticate
firebase use PROJECT_ID   # Set project
firebase deploy          # Deploy everything
firebase hosting:channel:list  # List deployment channels

# Google Cloud
gcloud auth login        # Authenticate
gcloud config set project PROJECT_ID  # Set project
gcloud run services list  # List deployed services
```

---

## 📞 Support

For issues:
1. Check logs (Firebase Console / Cloud Run Console)
2. Review error messages in browser console
3. Verify all APIs are enabled in Google Cloud
4. Ensure proper authentication and permissions
