# Structured Output Architecture - Final Implementation

## Key Decision: JSON with `output_key` (Not `output_schema`)

### Why Not `output_schema`?

According to ADK documentation:

> **Constraint:** Using `output_schema` enables controlled generation within the LLM but **disables the agent's ability to use tools or transfer control to other agents**.

**Our sub-agents NEED tools:**
- `data_graph_agent` needs `rag_query` to query business documents and ontology
- `risk_analysis_agent` needs `rag_query` to query regulations and business data
- `document_query_agent` needs `rag_query` to query all corpora

**Therefore:**
- ❌ Cannot use `output_schema` (disables tools)
- ✅ Use `output_key` with JSON formatting instructions
- ✅ Agents return JSON strings that match Pydantic schemas
- ✅ Orchestrator parses JSON and formats for users

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│              "Show me all the assets"                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                              │
│  Routes to: data_graph_agent                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA GRAPH AGENT                                │
│  1. Uses rag_query("ontology", "Asset definitions")         │
│  2. Uses rag_query("data_v1", "all assets")                 │
│  3. Extracts entities matching Asset type                   │
│  4. Returns JSON string (via output_key="data_graph"):      │
│     {                                                        │
│       "entities": [{...}],                                   │
│       "entity_types_found": ["Asset"],                       │
│       "total_documents_analyzed": 3,                         │
│       "summary": "12 assets found",                          │
│       "gaps": ["data_retention_days not specified"]         │
│     }                                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         ORCHESTRATOR RECEIVES JSON STRING                    │
│  1. Parses JSON from state['data_graph']                    │
│  2. Extracts: entities, summary, gaps, etc.                 │
│  3. Formats as Markdown table:                              │
│                                                              │
│     Here are all the assets:                                │
│                                                              │
│     | Asset Name | Type | Purpose | Location |              │
│     |------------|------|---------|----------|              │
│     | CRM System | DB   | Cust Mgmt | AWS    |              │
│                                                              │
│     **Summary:** 12 assets found across 3 documents         │
│     **Note:** data_retention_days not specified             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BEAUTIFUL USER RESPONSE                         │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Sub-Agent Configuration

All sub-agents use:
```python
LlmAgent(
    name="...",
    model="gemini-2.5-flash",
    instruction="""
    ...
    **CRITICAL OUTPUT RULES:**
    1. Return ONLY valid JSON (matching [Schema]Output schema)
       - Must be parseable JSON
       - No Markdown code blocks around the JSON
       - No additional text before or after the JSON
       - Just the raw JSON object
    
    **[Schema]Output JSON Schema:**
    ```json
    {
      "field1": "value",
      "field2": ["array"],
      ...
    }
    ```
    """,
    tools=[rag_query, ...],  # Tools work because we're NOT using output_schema
    output_key="agent_result"  # JSON string stored here
)
```

### Orchestrator Configuration

```python
root_agent = LlmAgent(
    name="RiskAssessmentAgent",
    model="gemini-2.5-flash",
    instruction="""
    **CRITICAL ARCHITECTURE:**
    
    **Sub-agents return JSON** → **You parse and format it into user-friendly Markdown**
    
    - Sub-agents return valid JSON matching their schemas
    - You receive JSON strings, parse them, and convert into Markdown
    - You are the ONLY agent that produces user-facing formatted output
    
    **PARSING SUB-AGENT RESPONSES:**
    - Sub-agents return raw JSON strings (no Markdown code blocks)
    - Parse the JSON to extract structured data
    - Then format according to the templates below
    - Handle JSON parsing errors gracefully
    
    ### Formatting DataGraphOutput:
    
    Parse JSON from state['data_graph'], then format as:
    ```markdown
    Here are all the assets:
    
    | Asset Name | Type | Purpose | Location |
    |------------|------|---------|----------|
    [Loop through entities array and create table rows]
    
    **Summary:** [summary field]
    **Total:** [count] assets found
    [If gaps exist:] **Note:** [list gaps]
    ```
    
    ### Formatting RiskAnalysisOutput:
    
    Parse JSON from state['risk_analysis'], then format as:
    ```markdown
    # [regulation_name] Compliance Risk Analysis
    
    ## Executive Summary
    [executive_summary]
    
    **Overall Risk Level:** [🔴/🟡/🟢 based on overall_risk_level]
    
    ## Critical Risks
    [Loop through critical_risks array:]
    ### 🔴 [title]
    - **Current State:** [current_state]
    - **Requirement:** [requirement]
    - **Action:** [recommended_action]
    ...
    ```
    """,
    tools=[
        AgentTool(document_query_agent),
        AgentTool(data_graph_agent),
        AgentTool(risk_analysis_agent),
        ...
    ]
)
```

## Schemas (For Documentation & Type Hints)

Located in `/agents/schemas/structured_output.py`:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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

class RiskItem(BaseModel):
    risk_level: str
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

class DocumentQueryOutput(BaseModel):
    query: str
    sources_queried: List[str]
    results_found: bool
    summary: str
    key_findings: List[str]
    relevant_documents: List[str]
    suggested_questions: List[str]
```

**Note:** These schemas are used for:
- Documentation (showing sub-agents what JSON structure to return)
- Type hints in code
- Validation (orchestrator can validate parsed JSON against these)

But they are **NOT** used as `output_schema` parameter (which would disable tools).

## Benefits of This Approach

### 1. **Tools Work** ✅
- Sub-agents can use `rag_query` to access knowledge bases
- No limitations from `output_schema`

### 2. **Structured Data** ✅
- Sub-agents return well-defined JSON
- Easy to parse and validate
- Type-safe with Pydantic schemas

### 3. **Clean Separation** ✅
- Sub-agents: Data accuracy (JSON)
- Orchestrator: User presentation (Markdown)

### 4. **Maintainable** ✅
- Change formatting in ONE place (orchestrator)
- Update schemas without touching formatting logic
- Clear contracts between components

### 5. **Flexible** ✅
- Can add new fields to schemas
- Can create new sub-agents with new schemas
- Orchestrator adapts formatting based on query type

## Example: "Show me all the assets"

### 1. User Request
```
"Show me all the assets"
```

### 2. Orchestrator Routes to data_graph_agent

### 3. data_graph_agent Executes
```python
# Uses tools (because output_schema is NOT set)
rag_query("ontology", "Asset entity type definition")
rag_query("data_v1", "all assets systems databases")

# Returns JSON string (via output_key="data_graph")
{
  "entities": [
    {
      "entity_type": "Asset",
      "name": "CRM System",
      "attributes": {
        "type": "Database",
        "purpose": "Customer Management",
        "hosting_location": "AWS"
      },
      "relationships": [
        {"type": "processes", "target": "Customer PII"}
      ]
    },
    {
      "entity_type": "Asset",
      "name": "LogStash",
      "attributes": {
        "type": "Logging Service",
        "purpose": "Log IP addresses"
      },
      "relationships": []
    }
  ],
  "entity_types_found": ["Asset"],
  "entity_types_missing": ["DataSubject"],
  "total_documents_analyzed": 3,
  "summary": "12 assets found across business documents",
  "gaps": ["data_retention_days not specified for any assets"]
}
```

### 4. Orchestrator Receives JSON
```python
# Stored in state['data_graph'] as JSON string
json_string = state['data_graph']

# Orchestrator parses it
data = json.loads(json_string)

# Extracts fields
entities = data['entities']
summary = data['summary']
gaps = data['gaps']
total_docs = data['total_documents_analyzed']
```

### 5. Orchestrator Formats as Markdown
```markdown
Here are all the assets identified from your business process documents:

| Asset Name | Type | Purpose | Hosting Location |
|------------|------|---------|------------------|
| CRM System | Database | Customer Management | AWS |
| LogStash | Logging Service | Log IP addresses | Not specified |
| ... | ... | ... | ... |

**Summary:** 12 assets found across business documents

**Total:** 12 assets found across 3 documents

**Note:** data_retention_days not specified for any assets
```

### 6. User Sees Beautiful Response
Clean Markdown table with business-friendly language!

## Deployment

```bash
# Deploy backend with JSON-based structured output
cd /Users/cvsubramanian/CascadeProjects/graphrag/agents/regulatory_risk_analyzer
./deploy_to_cloud.sh
```

## Testing After Deployment

1. **Data Graph Query:**
   ```
   "Show me all the assets"
   ```
   Expected: Clean table with assets

2. **Risk Analysis Query:**
   ```
   "Analyze CCPA compliance for our customer analytics process"
   ```
   Expected: Formatted risk analysis with emojis and sections

3. **Document Query:**
   ```
   "What are our data retention policies?"
   ```
   Expected: Summary with key findings

All responses should:
- ✅ Be formatted in Markdown
- ✅ Use tables for structured data
- ✅ Include emojis for visual clarity
- ✅ Use business-friendly language
- ✅ NOT mention internal agents or tools
