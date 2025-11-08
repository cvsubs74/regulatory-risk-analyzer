# Firebase Deployment Guide

## Quick Deploy

Simply run the deployment script:

```bash
cd frontend
./deploy.sh
```

The script will:
1. ✅ Check if Firebase CLI is installed (installs if needed)
2. ✅ Authenticate with Firebase (prompts login if needed)
3. ✅ Set the correct Firebase project
4. ✅ Install dependencies
5. ✅ Build the React app
6. ✅ Deploy to Firebase Hosting

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase (first time only)
```bash
cd frontend
firebase init hosting
```

When prompted:
- Select: **Use an existing project**
- Choose: **regulatory-risk-analyzer**
- Public directory: **build**
- Configure as single-page app: **Yes**
- Set up automatic builds with GitHub: **No**
- Overwrite index.html: **No**

### 4. Build the React App
```bash
npm install
npm run build
```

### 5. Deploy to Firebase
```bash
firebase deploy --only hosting
```

## Your Live URLs

After deployment, your app will be available at:
- **Primary URL**: https://regulatory-risk-analyzer.web.app
- **Alternative URL**: https://regulatory-risk-analyzer.firebaseapp.com

## Environment Variables

If you need to configure the backend API URL for production:

1. Create `.env.production` in the frontend directory:
```bash
REACT_APP_API_URL=https://your-backend-url.run.app
```

2. Update `src/services/api.js` to use the environment variable:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

### Firebase CLI Issues
```bash
# Reinstall Firebase CLI
npm uninstall -g firebase-tools
npm install -g firebase-tools
firebase login --reauth
```

### Deployment Fails
```bash
# Check Firebase project
firebase projects:list

# Use specific project
firebase use regulatory-risk-analyzer

# Try deploying again
firebase deploy --only hosting
```

## Continuous Deployment

For automatic deployments on git push, you can set up GitHub Actions:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key
3. Add the key as a GitHub secret: `FIREBASE_SERVICE_ACCOUNT`
4. Create `.github/workflows/deploy.yml` (see GitHub Actions documentation)

## Monitoring

View your deployment status and analytics:
- **Firebase Console**: https://console.firebase.google.com/project/regulatory-risk-analyzer
- **Hosting Dashboard**: https://console.firebase.google.com/project/regulatory-risk-analyzer/hosting

## Rollback

To rollback to a previous version:
```bash
firebase hosting:channel:list
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_CHANNEL_ID
```
