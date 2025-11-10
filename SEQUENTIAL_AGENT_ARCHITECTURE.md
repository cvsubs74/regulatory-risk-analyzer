# Sequential Agent Architecture - Final Implementation

## Solution: Retriever + Formatter Pattern

### The Problem
- **Sub-agents need tools** (`rag_query`) to access knowledge bases
- **`output_schema` disables tools** according to ADK documentation
- Cannot use both tools and structured output in the same agent

### The Solution
Split each sub-agent into a **SequentialAgent** with two stages:

1. **Retriever Agent**: Uses tools, returns raw text (via `output_key`)
2. **Formatter Agent**: Uses `output_schema`, returns structured data

This pattern is used in the banking_app reference implementation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│              "Show me all the assets"                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                              │
│  Routes to: data_graph_agent (SequentialAgent)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         DATA_GRAPH_AGENT (SequentialAgent)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  STEP 1: data_graph_retriever                       │    │
│  │  - Uses rag_query("ontology", "Asset definitions")  │    │
│  │  - Uses rag_query("data_v1", "all assets")         │    │
│  │  - Returns raw text via output_key="raw_graph_data" │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  STEP 2: data_graph_formatter                       │    │
│  │  - Reads state['raw_graph_data']                   │    │
│  │  - Uses output_schema=DataGraphOutput              │    │
│  │  - Returns structured Pydantic object              │    │
│  │  - Stores in output_key="data_graph"               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         ORCHESTRATOR RECEIVES STRUCTURED DATA                │
│  - Accesses state['data_graph'] (DataGraphOutput object)   │
│  - Formats as Markdown table with headings and emojis      │
│  - Returns beautiful user-friendly response                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BEAUTIFUL USER RESPONSE                         │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Pattern for Each Sub-Agent

#### 1. Data Graph Agent

```python
# Step 1: Retriever (uses tools)
data_graph_retriever = LlmAgent(
    name="data_graph_retriever",
    model="gemini-2.5-flash",
    description="Retrieves business documents and ontology definitions",
    instruction="""
    Query knowledge bases and extract raw entity data.
    Return comprehensive text with all entities, types, gaps, etc.
    """,
    tools=[rag_query, list_corpora, get_corpus_info],
    output_key="raw_graph_data"  # Stores raw text
)

# Step 2: Formatter (uses output_schema)
data_graph_formatter = LlmAgent(
    name="data_graph_formatter",
    model="gemini-2.5-flash",
    description="Formats raw graph data into structured schema",
    instruction="""
    Read 'raw_graph_data' from state.
    Structure it into DataGraphOutput schema.
    """,
    output_schema=DataGraphOutput,  # Enforces structure
    output_key="data_graph"  # Stores structured object
)

# Combine into sequential workflow
data_graph_agent = SequentialAgent(
    name="data_graph_pipeline",
    description="Retrieves and formats entity data",
    sub_agents=[
        data_graph_retriever,
        data_graph_formatter,
    ]
)
```

#### 2. Risk Analysis Agent

```python
# Step 1: Retriever (uses tools)
risk_analysis_retriever = LlmAgent(
    name="risk_analysis_retriever",
    model="gemini-2.5-flash",
    description="Retrieves regulation text and business data",
    instruction="""
    Query regulations and business processes.
    Perform risk analysis.
    Return comprehensive text with all risks, recommendations, etc.
    """,
    tools=[rag_query, list_corpora, get_corpus_info],
    output_key="raw_risk_data"
)

# Step 2: Formatter (uses output_schema)
risk_analysis_formatter = LlmAgent(
    name="risk_analysis_formatter",
    model="gemini-2.5-flash",
    description="Formats raw risk data into structured schema",
    instruction="""
    Read 'raw_risk_data' from state.
    Structure it into RiskAnalysisOutput schema.
    """,
    output_schema=RiskAnalysisOutput,
    output_key="risk_analysis"
)

# Combine
risk_analysis_agent = SequentialAgent(
    name="risk_analysis_pipeline",
    description="Retrieves and formats risk analysis",
    sub_agents=[
        risk_analysis_retriever,
        risk_analysis_formatter,
    ]
)
```

#### 3. Document Query Agent

```python
# Step 1: Retriever (uses tools)
document_query_retriever = LlmAgent(
    name="document_query_retriever",
    model="gemini-2.5-flash",
    description="Retrieves information from all corpora",
    instruction="""
    Query all relevant knowledge bases.
    Return comprehensive text with findings, sources, etc.
    """,
    tools=[rag_query, list_corpora, get_corpus_info],
    output_key="raw_query_data"
)

# Step 2: Formatter (uses output_schema)
document_query_formatter = LlmAgent(
    name="document_query_formatter",
    model="gemini-2.5-flash",
    description="Formats raw query results into structured schema",
    instruction="""
    Read 'raw_query_data' from state.
    Structure it into DocumentQueryOutput schema.
    """,
    output_schema=DocumentQueryOutput,
    output_key="query_results"
)

# Combine
document_query_agent = SequentialAgent(
    name="document_query_pipeline",
    description="Retrieves and formats query results",
    sub_agents=[
        document_query_retriever,
        document_query_formatter,
    ]
)
```

## Benefits of This Architecture

### 1. **Tools Work** ✅
- Retriever agents can use `rag_query` to access knowledge bases
- No limitations from `output_schema`

### 2. **Structured Output** ✅
- Formatter agents use `output_schema` for guaranteed structure
- Pydantic validation ensures correct schema
- Type-safe structured data

### 3. **Clean Separation** ✅
- **Retriever**: Data gathering (uses tools)
- **Formatter**: Data structuring (uses output_schema)
- **Orchestrator**: User presentation (Markdown formatting)

### 4. **Maintainable** ✅
- Each agent has a single responsibility
- Easy to debug (check raw data vs structured data)
- Clear data flow through state keys

### 5. **Follows Best Practices** ✅
- Based on banking_app reference implementation
- Uses ADK's SequentialAgent pattern
- Proper use of `output_schema` without disabling tools

## Data Flow Example

### User Query: "Show me all the assets"

#### Step 1: Orchestrator Routes
```python
# Orchestrator calls data_graph_agent
```

#### Step 2: Retriever Executes
```python
# data_graph_retriever runs
rag_query("ontology", "Asset entity definition")
rag_query("data_v1", "all assets systems databases")

# Returns raw text stored in state['raw_graph_data']:
"""
Found 12 assets in 3 documents:
1. CRM System - Type: Database, Purpose: Customer Management, Location: AWS
2. LogStash - Type: Logging Service, Purpose: Log IP addresses
...

Entity types found: Asset
Entity types missing: DataSubject
Total documents: 3
Summary: 12 assets found across business documents
Gaps: data_retention_days not specified for any assets
"""
```

#### Step 3: Formatter Executes
```python
# data_graph_formatter runs
# Reads state['raw_graph_data']
# Structures into DataGraphOutput via output_schema

# Returns Pydantic object stored in state['data_graph']:
DataGraphOutput(
    entities=[
        Entity(
            entity_type="Asset",
            name="CRM System",
            attributes={"type": "Database", "purpose": "Customer Management", "hosting_location": "AWS"},
            relationships=[{"type": "processes", "target": "Customer PII"}]
        ),
        Entity(
            entity_type="Asset",
            name="LogStash",
            attributes={"type": "Logging Service", "purpose": "Log IP addresses"},
            relationships=[]
        ),
        ...
    ],
    entity_types_found=["Asset"],
    entity_types_missing=["DataSubject"],
    total_documents_analyzed=3,
    summary="12 assets found across business documents",
    gaps=["data_retention_days not specified for any assets"]
)
```

#### Step 4: Orchestrator Formats
```python
# Orchestrator accesses state['data_graph']
data = state['data_graph']  # DataGraphOutput object

# Formats as Markdown:
"""
Here are all the assets identified from your business process documents:

| Asset Name | Type | Purpose | Hosting Location |
|------------|------|---------|------------------|
| CRM System | Database | Customer Management | AWS |
| LogStash | Logging Service | Log IP addresses | Not specified |
...

**Summary:** 12 assets found across business documents

**Total:** 12 assets found across 3 documents

**Note:** data_retention_days not specified for any assets
"""
```

## State Keys Reference

| Sub-Agent | Retriever Output Key | Formatter Output Key |
|-----------|---------------------|---------------------|
| data_graph_agent | `raw_graph_data` | `data_graph` |
| risk_analysis_agent | `raw_risk_data` | `risk_analysis` |
| document_query_agent | `raw_query_data` | `query_results` |

## Orchestrator Access

The orchestrator accesses structured data via:
- `state['data_graph']` → `DataGraphOutput` object
- `state['risk_analysis']` → `RiskAnalysisOutput` object
- `state['query_results']` → `DocumentQueryOutput` object

## Files Modified

1. **Sub-Agents (all converted to SequentialAgent pattern):**
   - `/agents/sub_agents/data_graph_builder_agent/agent.py`
   - `/agents/sub_agents/risk_analysis_agent/agent.py`
   - `/agents/sub_agents/document_query_agent/agent.py`

2. **Orchestrator (updated to work with structured data):**
   - `/agents/agent.py`

3. **Schemas (unchanged, used by formatters):**
   - `/agents/schemas/structured_output.py`

## Deployment

```bash
cd /Users/cvsubramanian/CascadeProjects/graphrag/agents/regulatory_risk_analyzer
./deploy_to_cloud.sh
```

## Testing After Deployment

1. **Data Graph Query:**
   ```
   "Show me all the assets"
   ```
   Expected: Clean table with assets (from DataGraphOutput)

2. **Risk Analysis Query:**
   ```
   "Analyze CCPA compliance for our customer analytics process"
   ```
   Expected: Formatted risk analysis (from RiskAnalysisOutput)

3. **Document Query:**
   ```
   "What are our data retention policies?"
   ```
   Expected: Summary with findings (from DocumentQueryOutput)

All responses should:
- ✅ Use structured data from Pydantic schemas
- ✅ Be formatted in Markdown by orchestrator
- ✅ Include tables, emojis, and proper formatting
- ✅ Use business-friendly language
- ✅ NOT mention internal agents or tools

## Key Advantages Over Previous Approach

| Aspect | Previous (JSON strings) | Current (Sequential Agents) |
|--------|------------------------|----------------------------|
| **Tools** | ❌ Couldn't use with output_schema | ✅ Retriever uses tools |
| **Structure** | Manual JSON formatting | ✅ Pydantic validation |
| **Parsing** | Orchestrator parses JSON | ✅ Already structured |
| **Errors** | JSON parsing errors | ✅ Schema validation |
| **Type Safety** | String manipulation | ✅ Pydantic objects |
| **Best Practice** | Custom approach | ✅ Follows banking_app pattern |

## Summary

This architecture perfectly solves the constraint that `output_schema` disables tools:

1. **Retriever agents** use tools to gather data
2. **Formatter agents** use output_schema to structure data
3. **SequentialAgent** chains them together
4. **Orchestrator** formats structured data for users

Clean, maintainable, and follows ADK best practices! 🎯
