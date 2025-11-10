# Structured Output Architecture

## Overview

**New Architecture:** Sub-agents return structured data → Orchestrator formats for users

This clean separation ensures:
- Sub-agents focus on **data accuracy**
- Orchestrator focuses on **user presentation**
- Consistent, beautiful formatting across all responses
- Easy to maintain and extend

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                              │
│  (Routes to sub-agents, formats structured output)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┬──────────────┐
         │             │             │              │
         ▼             ▼             ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ Document   │  │ Data Graph │  │ Risk       │  │ Doc/Corpus │
│ Query      │  │ Agent      │  │ Analysis   │  │ Management │
│ Agent      │  │            │  │ Agent      │  │ Agents     │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │               │
      │ Returns       │ Returns       │ Returns       │ Returns
      │ Document      │ DataGraph     │ RiskAnalysis  │ Document/
      │ QueryOutput   │ Output        │ Output        │ CorpusOutput
      │               │               │               │
      └───────────────┴───────────────┴───────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         ORCHESTRATOR FORMATS STRUCTURED DATA                 │
│         INTO USER-FRIENDLY MARKDOWN                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BEAUTIFUL USER RESPONSE                         │
│  - Markdown tables                                           │
│  - Headings and sections                                     │
│  - Emojis for visual clarity                                 │
│  - Business-friendly language                                │
│  - No internal references                                    │
└─────────────────────────────────────────────────────────────┘
```

## Structured Output Schemas

All schemas defined in `/agents/schemas/structured_output.py`:

### 1. DataGraphOutput
```python
class Entity(BaseModel):
    entity_type: str
    name: str
    attributes: Dict[str, Any]
    relationships: List[Dict[str, str]]

class DataGraphOutput(BaseModel):
    entities: List[Entity]
    entity_types_found: List[str]
    entity_types_missing: List[str]
    total_documents_analyzed: int
    summary: str
    gaps: List[str]
```

**Used by:** `data_graph_agent`

**Example user query:** "Show me all the assets"

**Orchestrator formats as:**
```markdown
Here are all the assets identified from your business process documents:

| Asset Name | Type | Purpose | Hosting Location |
|------------|------|---------|------------------|
| CRM System | Database | Customer Management | AWS |
| ...        | ...  | ...     | ...              |

**Summary:** 12 assets found across 3 documents

**Note:** data_retention_days not specified for any assets
```

### 2. RiskAnalysisOutput
```python
class RiskItem(BaseModel):
    risk_level: str  # "High", "Medium", "Low"
    title: str
    regulation_section: Optional[str]
    current_state: str
    requirement: str
    recommended_action: str
    processing_activity: Optional[str]

class RiskAnalysisOutput(BaseModel):
    regulation_name: str
    regulation_available: bool
    overall_risk_level: str
    compliance_score: Optional[int]
    critical_risks: List[RiskItem]
    medium_risks: List[RiskItem]
    low_risks: List[RiskItem]
    executive_summary: str
    recommendations_roadmap: Dict[str, List[str]]
    information_gaps: List[str]
    regulation_sections_analyzed: List[str]
```

**Used by:** `risk_analysis_agent`

**Example user query:** "Analyze CCPA compliance for our customer analytics process"

**Orchestrator formats as:**
```markdown
# CCPA Compliance Risk Analysis

## Executive Summary
[2-3 sentence summary]

**Overall Risk Level:** 🔴 High
**Compliance Score:** 65/100

## Critical Risks (Immediate Action Required)

### 🔴 Missing Consent Mechanism
- **Regulation Section:** CCPA Section 1798.100
- **Current State:** Customer data collected without explicit consent
- **Requirement:** CCPA requires explicit opt-in consent
- **Recommended Action:** Implement consent banner and tracking

## Recommendations Roadmap

**Immediate (0-30 days):**
- Implement consent mechanism
- Update privacy policy

**Short-term (1-3 months):**
- Train staff on CCPA requirements
...
```

### 3. DocumentQueryOutput
```python
class DocumentQueryOutput(BaseModel):
    query: str
    sources_queried: List[str]
    results_found: bool
    summary: str
    key_findings: List[str]
    relevant_documents: List[str]
    suggested_questions: List[str]
```

**Used by:** `document_query_agent`

**Example user query:** "What are our data retention policies?"

**Orchestrator formats as:**
```markdown
Based on your business process documents, here's what I found about data retention policies:

## Key Findings
- Customer data retained for 7 years
- Payment records retained for 10 years per regulatory requirements
- Marketing data deleted after 2 years of inactivity

**Sources:** Data Retention Policy v2.1, Payment Processing Agreement

**You might also want to ask:**
- What are the retention requirements under GDPR?
- How do we handle data deletion requests?
```

### 4. DocumentManagementOutput & CorpusManagementOutput
```python
class DocumentManagementOutput(BaseModel):
    operation: str  # "upload", "delete", "list"
    success: bool
    message: str
    documents: List[str]
    knowledge_base: Optional[str]

class CorpusManagementOutput(BaseModel):
    operation: str  # "create", "delete", "list", "info"
    success: bool
    message: str
    corpora: List[Dict[str, Any]]
```

**Used by:** `document_management_agent`, `corpus_management_agent`

## Benefits of This Architecture

### 1. **Separation of Concerns**
- **Sub-agents:** Focus on querying data and extracting accurate information
- **Orchestrator:** Focus on formatting and user experience

### 2. **Consistency**
- All responses follow the same formatting patterns
- Tables, headings, emojis used consistently
- Business-friendly language throughout

### 3. **Maintainability**
- Change formatting in ONE place (orchestrator)
- Sub-agents don't need to know about Markdown or user preferences
- Easy to add new sub-agents with new schemas

### 4. **Testability**
- Sub-agents return structured data that's easy to validate
- Orchestrator formatting can be tested independently
- Clear contracts between components

### 5. **Extensibility**
- Add new fields to schemas without breaking formatting
- Create new schemas for new sub-agents
- Orchestrator can adapt formatting based on query type

## Example Flow: "Show me all the assets"

```
1. User asks: "Show me all the assets"
   ↓
2. Orchestrator routes to: data_graph_agent
   ↓
3. data_graph_agent:
   - Queries ontology for Asset definition
   - Queries business documents for assets
   - Extracts entities matching Asset type
   - Returns DataGraphOutput:
     {
       "entities": [
         {
           "entity_type": "Asset",
           "name": "CRM System",
           "attributes": {"type": "Database", "purpose": "Customer Management"},
           "relationships": [{"type": "processes", "target": "Customer PII"}]
         },
         ...
       ],
       "entity_types_found": ["Asset"],
       "total_documents_analyzed": 3,
       "summary": "12 assets found across business documents",
       "gaps": ["data_retention_days not specified"]
     }
   ↓
4. Orchestrator receives DataGraphOutput
   ↓
5. Orchestrator formats as Markdown:
   - Creates table from entities
   - Adds summary
   - Notes gaps
   - Uses business-friendly language
   ↓
6. User sees beautiful formatted response
```

## Migration Notes

### What Changed

**Before:**
- Sub-agents returned Markdown strings
- Each sub-agent had its own formatting logic
- Inconsistent presentation
- Hard to maintain formatting

**After:**
- Sub-agents return structured Pydantic schemas
- Orchestrator handles ALL formatting
- Consistent presentation
- Easy to maintain and extend

### Files Modified

1. **Created:**
   - `/agents/schemas/__init__.py`
   - `/agents/schemas/structured_output.py`

2. **Updated:**
   - `/agents/sub_agents/data_graph_builder_agent/agent.py`
   - `/agents/sub_agents/risk_analysis_agent/agent.py`
   - `/agents/sub_agents/document_query_agent/agent.py`
   - `/agents/agent.py` (orchestrator)

3. **Frontend:**
   - No changes needed! Frontend already handles Markdown from orchestrator

### Deployment

```bash
# Deploy backend with new structured output architecture
cd /Users/cvsubramanian/CascadeProjects/graphrag/agents/regulatory_risk_analyzer
./deploy_to_cloud.sh

# Frontend already deployed, no changes needed
```

## Testing

After deployment, test with:

1. **Data Graph Query:**
   - "Show me all the assets"
   - "Show me all processing activities"
   - Expected: Clean table with assets/activities

2. **Risk Analysis Query:**
   - "Analyze CCPA compliance for our customer analytics process"
   - Expected: Formatted risk analysis with sections, emojis, roadmap

3. **Document Query:**
   - "What are our data retention policies?"
   - Expected: Summary with key findings and sources

All responses should:
- ✅ Be formatted in Markdown
- ✅ Use tables for structured data
- ✅ Include emojis for visual clarity
- ✅ Use business-friendly language
- ✅ NOT mention internal agents, tools, or corpora
