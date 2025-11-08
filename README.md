# Regulatory Risk Analyzer

AI-powered regulatory compliance and risk assessment tool that helps organizations analyze their data processing activities against various privacy regulations (GDPR, CCPA, HIPAA, COPPA, etc.).

## Architecture

### Backend (Risk Assessment Agent)
- **Agent**: `risk_assessment_agent` - Vertex AI RAG-powered compliance analysis agent
- **Framework**: Google ADK (Agent Development Kit)
- **Model**: Gemini 2.5 Pro
- **Capabilities**:
  - Regulatory risk analysis against multiple privacy laws
  - Cross-border data transfer assessment
  - Third-party vendor risk evaluation
  - Data subject rights compliance checking
  - Document corpus management

### Frontend (React UI)
- **Framework**: React 19 with React Router
- **Styling**: Tailwind CSS
- **Components**:
  - Chat interface for risk analysis
  - Document upload management
  - Corpus viewer and manager
- **Features**:
  - Multi-regulation selection (GDPR, CCPA, HIPAA, COPPA, etc.)
  - Real-time compliance analysis
  - Document management with GCS integration
  - Responsive design

## Project Structure

```
regulatory_risk_analyzer/
├── risk_assessment_agent/          # Backend agent
│   ├── agent.py                    # Main agent configuration
│   ├── config.py                   # Agent settings
│   ├── tools/                      # RAG tools
│   │   ├── rag_query.py           # Query corpus
│   │   ├── add_data.py            # Add documents
│   │   ├── list_corpora.py        # List corpora
│   │   ├── get_corpus_info.py     # Corpus details
│   │   └── ...
│   ├── data/                       # Sample documents
│   │   ├── global_customer_analytics.txt
│   │   ├── advertising_monetization.txt
│   │   ├── credit_risk_assessment.txt
│   │   └── ...
│   └── .env                        # Environment variables
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chat.jsx           # Main chat interface
│   │   │   ├── Documents.jsx      # Document upload
│   │   │   └── Corpora.jsx        # Corpus management
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── App.js                 # Main app component
│   │   └── index.js               # Entry point
│   ├── public/
│   ├── package.json
│   └── .env                        # Frontend config
└── deploy_to_cloud.sh             # Deployment script
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Google Cloud Project with Vertex AI enabled
- ADK CLI installed (`pip install google-adk`)
- gcloud CLI configured

### Backend Setup

1. **Navigate to the agent directory**:
   ```bash
   cd regulatory_risk_analyzer/risk_assessment_agent
   ```

2. **Configure environment variables**:
   Create/update `.env` file:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-east1
   ```

3. **Run locally**:
   ```bash
   adk web
   ```
   Backend will be available at `http://localhost:8000`

4. **Deploy to Cloud Run**:
   ```bash
   cd ..
   ./deploy_to_cloud.sh
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd regulatory_risk_analyzer/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Copy `.env.example` to `.env.local` and update:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_DEFAULT_CORPUS=data_v1
   ```

4. **Run development server**:
   ```bash
   npm start
   ```
   Frontend will be available at `http://localhost:3000`

5. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

### Analyzing Regulatory Risks

1. **Open the Chat interface** (default page)
2. **Select regulations** to analyze against (GDPR, CCPA, HIPAA, etc.)
3. **Ask questions** about compliance risks:
   - "What are the GDPR compliance risks in our cross-border data transfers?"
   - "Analyze COPPA compliance for our educational platform"
   - "Review our vendor data processing agreements for HIPAA compliance"
   - "Identify data subject rights violations in our deletion process"

### Adding Documents

1. **Navigate to Documents page**
2. **Select target corpus** (data_v1, policies, agreements, etc.)
3. **Enter GCS path** to your document:
   ```
   gs://your-bucket/documents/privacy_policy.txt
   ```
4. **Click "Add Document"**

### Managing Corpora

1. **Navigate to Corpora page**
2. **View available corpora** and their descriptions
3. **Click on a corpus** to see details
4. **Use corpus names** when querying or adding documents

## Sample Documents

The `risk_assessment_agent/data/` directory contains sample business process documents:

- **global_customer_analytics.txt** - Cross-border analytics with third-party sharing
- **advertising_monetization.txt** - Data sales and targeted advertising
- **credit_risk_assessment.txt** - International credit scoring
- **healthcare_research_collaboration.txt** - Medical research data sharing
- **employee_monitoring_analytics.txt** - Workforce surveillance
- **child_data_educational_platform.txt** - Children's data processing

These documents demonstrate complex compliance scenarios involving:
- Cross-border data transfers
- Third-party data sharing
- Automated decision-making
- Special category data (health, children's data)
- Multiple jurisdictions

## Supported Regulations

- **GDPR** - EU General Data Protection Regulation
- **CCPA/CPRA** - California Consumer Privacy Act
- **HIPAA** - Health Insurance Portability and Accountability Act
- **COPPA** - Children's Online Privacy Protection Act
- **PIPEDA** - Personal Information Protection (Canada)
- **LGPD** - Lei Geral de Proteção de Dados (Brazil)

## API Endpoints

### Backend (ADK Agent)
- `POST /apps/risk_assessment_agent/users/user/sessions` - Create session
- `POST /apps/risk_assessment_agent/users/user/sessions/{session_id}` - Send message
- `GET /apps/risk_assessment_agent/users/user/sessions/{session_id}` - Get session history

### Tool Functions
- `rag_query` - Query documents for compliance information
- `list_corpora` - List available document collections
- `create_corpus` - Create new corpus
- `add_data` - Add documents to corpus
- `get_corpus_info` - Get corpus details
- `delete_document` - Remove document from corpus
- `delete_corpus` - Delete entire corpus

## Development

### Running Tests
```bash
# Backend
cd risk_assessment_agent
python -m pytest

# Frontend
cd frontend
npm test
```

### Code Style
- Backend: Black formatter, isort
- Frontend: ESLint, Prettier

## Deployment

### Backend to Cloud Run
```bash
./deploy_to_cloud.sh
```

### Frontend to Firebase Hosting
```bash
cd frontend
npm run deploy
```

## Troubleshooting

### Backend Issues
- **ModuleNotFoundError**: Ensure all dependencies are installed
- **Authentication errors**: Run `gcloud auth login`
- **Corpus not found**: Create corpus first using `create_corpus` tool

### Frontend Issues
- **API connection errors**: Check `REACT_APP_API_URL` in `.env.local`
- **CORS errors**: Ensure backend is deployed with `--allow_origins="*"`
- **Build errors**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
