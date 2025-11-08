# Multi-Agent Regulatory Risk Assessment Architecture

## Overview

The Regulatory Risk Assessment Agent is a multi-agent system that analyzes compliance and risks using **three corpora**:

1. **data_v1** - Business processes, data sharing agreements, operational documents
2. **regulations** - Regulatory requirements (CCPA, GDPR, etc.)
3. **ontology** - Entity type definitions, relationship schemas, data models

**Core Principle:** ALL analysis is based on these three corpora. NO general knowledge. NO assumptions. NO hallucinations.

## Architecture

### Main Orchestrator Agent
**File:** `agents/agent.py`

The main agent acts as a router and orchestrator. It:
- Receives user queries
- Determines which sub-agents to call
- Coordinates multi-step workflows
- Synthesizes results from multiple agents
- **Does NOT use Python function tools directly** - only delegates to sub-agents

### Sub-Agents

#### 1. Document Query Agent
**File:** `sub_agents/document_query_agent/agent.py`

**Purpose:** Retrieve information from any or all corpora

**Tools:**
- `rag_query` - Query specific corpus
- `list_corpora` - List available corpora
- `get_corpus_info` - Get corpus details

**Key Capability:** Can query multiple corpora in one call for comprehensive synthesis

**Example Use:**
```
Query data_v1 for: processing activities
Query regulations for: CCPA requirements
Query ontology for: entity definitions
```

#### 2. Data Graph Builder Agent
**File:** `sub_agents/data_graph_builder_agent/agent.py`

**Purpose:** Build comprehensive data graphs using ontology definitions

**How It Works:**
1. Receives entity type definitions from ontology corpus
2. Receives ALL documents from data_v1 corpus
3. Extracts entities matching ONLY ontology-defined types
4. Maps relationships per ontology schema
5. Creates comprehensive graph showing all entities and connections

**Critical Feature:** Ontology-driven extraction
- ONLY extracts entity types defined in ontology
- Uses ontology to guide what attributes to extract
- Reports coverage (what was found vs. what ontology defines)
- Identifies gaps where ontology defines types but documents don't mention them

**No Tools:** This agent synthesizes information provided to it

**Example Output:**
- Assets extracted (matching Asset entity type from ontology)
- Processing Activities (matching ProcessingActivity type)
- Data Elements (matching DataElement type)
- Relationships mapped per ontology schema
- Coverage analysis showing ontology vs. actual findings

#### 3. Risk Analysis Agent
**File:** `sub_agents/risk_analysis_agent/agent.py`

**Purpose:** Analyze compliance risks against regulations IN THE CORPUS

**Critical Constraint:** Can ONLY analyze regulations that exist in regulations corpus

**Behavior:**
- If regulation IS in corpus → Performs detailed risk analysis
- If regulation is NOT in corpus → Explicitly rejects with message:
  ```
  ❌ I cannot perform a [REGULATION] compliance risk analysis because 
  the [REGULATION] regulatory requirements are not available in my 
  regulations corpus.
  
  Currently available regulations: [list what IS available]
  ```

**Analysis Process:**
1. Verifies regulation exists in regulations corpus
2. Extracts specific requirements from regulation text
3. Compares business processes against requirements
4. Identifies gaps with specific citations
5. Assigns risk levels (High/Medium/Low)
6. Provides recommendations

**No Tools:** This agent analyzes information provided to it

**No Hallucinations:**
- Only cites requirements actually in the corpus
- Only analyzes regulations that exist in corpus
- Explicitly states limitations

#### 4. Document Management Agent
**File:** `sub_agents/document_management_agent/agent.py`

**Purpose:** Handle document uploads and deletions

**Tools:**
- `save_file_to_gcs` - Save uploaded files to Cloud Storage
- `add_data` - Add documents to corpus
- `delete_document` - Delete documents from corpus
- `list_documents` - List documents in corpus

**Operations:**
- **Upload:** Extract file from inlineData → Save to GCS → Add to corpus → Confirm
- **Delete:** List documents → Confirm with user → Delete → Confirm

**Corpus Selection:**
- data_v1: Business documents (default)
- regulations: Regulatory texts
- ontology: Data models and schemas

#### 5. Corpus Management Agent
**File:** `sub_agents/corpus_management_agent/agent.py`

**Purpose:** Manage corpus structure

**Tools:**
- `list_corpora` - List all corpora
- `create_corpus` - Create new corpus
- `delete_corpus` - Delete corpus
- `get_corpus_info` - View corpus details

**Operations:**
- List available corpora
- Create new corpora
- Delete corpora (with confirmation)
- View corpus statistics and documents

## Routing Logic

### Scenario 1: Simple Query
**User:** "What is our data retention policy?"

**Route:** document_query_agent

**Workflow:**
1. Call document_query_agent("data retention policy", corpus="data_v1")
2. Present results

### Scenario 2: Data Graph Building
**User:** "What are all our processing activities and how are they related?"

**Route:** document_query_agent → data_graph_builder_agent

**Workflow:**
1. Call document_query_agent to get:
   - ALL entity definitions from ontology corpus
   - ALL documents from data_v1 corpus
2. Call data_graph_builder_agent with:
   - Ontology definitions
   - Business documents
3. Present comprehensive data graph

### Scenario 3: Risk Analysis (Regulation Available)
**User:** "Analyze our CCPA compliance risks"

**Route:** document_query_agent → risk_analysis_agent

**Workflow:**
1. Call document_query_agent to get:
   - CCPA regulation from regulations corpus
   - Business processes from data_v1 corpus
2. Call risk_analysis_agent with:
   - Regulation text
   - Business processes
3. Present risk analysis with citations

### Scenario 4: Risk Analysis (Regulation Missing)
**User:** "Analyze our GDPR compliance risks" (GDPR not in corpus)

**Route:** document_query_agent → risk_analysis_agent

**Workflow:**
1. Call document_query_agent to check regulations corpus
2. Risk analysis agent responds:
   "❌ Cannot analyze GDPR - not in corpus. Available: CCPA"
3. Present this to user
4. Offer to analyze available regulations

### Scenario 5: Comprehensive Analysis
**User:** "Build a data graph and analyze CCPA compliance risks"

**Route:** document_query_agent → data_graph_builder_agent → risk_analysis_agent

**Workflow:**
1. Call document_query_agent to get:
   - Ontology definitions
   - All data_v1 documents
   - CCPA regulation
2. Call data_graph_builder_agent to create graph
3. Call risk_analysis_agent with graph and CCPA
4. Present comprehensive report

### Scenario 6: Document Upload
**User:** Uploads file

**Route:** document_management_agent

**Workflow:**
1. Call document_management_agent
2. Agent handles upload
3. Confirm to user

### Scenario 7: Corpus Management
**User:** "What corpora do I have?"

**Route:** corpus_management_agent

**Workflow:**
1. Call corpus_management_agent
2. Present corpus list

## Key Principles

### 1. Three-Corpus Architecture
- **ALL** analysis based on data_v1, regulations, and ontology
- NO general knowledge
- NO assumptions
- If information not in corpus, explicitly state it

### 2. Ontology-Driven Data Graphs
- Data graph builder uses ontology definitions
- Extracts ONLY entity types defined in ontology
- Maps relationships per ontology schema
- Reports coverage and gaps

### 3. Corpus-Only Risk Analysis
- Risk analysis ONLY for regulations in corpus
- If regulation missing, explicitly reject
- Cite specific sections from corpus
- No hallucinated requirements

### 4. Clear Routing
- Main agent routes to appropriate sub-agents
- Multi-step workflows for complex queries
- Results passed between agents
- Final synthesis by main agent

### 5. No Hallucinations
- Only use information from corpora
- Explicitly state limitations
- Reject requests for unavailable regulations
- Report gaps in data or ontology coverage

## Tool Usage

**Main Agent:** Uses ONLY sub-agents as tools (via AgentTool)

**Sub-Agents:** Use Python function tools as needed:
- Document Query Agent: rag_query, list_corpora, get_corpus_info
- Data Graph Builder: No tools (synthesizes provided information)
- Risk Analysis Agent: No tools (analyzes provided information)
- Document Management: save_file_to_gcs, add_data, delete_document, list_documents
- Corpus Management: list_corpora, create_corpus, delete_corpus, get_corpus_info

## Deployment

Deploy with:
```bash
./deploy_to_cloud.sh
```

This deploys the main agent which automatically includes all sub-agents.

## Testing

Test comprehensive analysis:
```
User: "What are the processing activities and assets and data elements. Synthesize all my 
business processes and documents and come up with an analysis of all my assets, processing 
activities etc and show me how they are all related. I want to build this data graph and do 
a risk analysis from a CCPA standpoint"

Expected: Multi-step workflow querying all three corpora, building data graph using ontology, 
and analyzing CCPA risks with specific citations.
```

Test missing regulation:
```
User: "Analyze GDPR compliance risks"

Expected (if GDPR not in corpus): Explicit rejection stating GDPR not available, 
listing what regulations ARE available.
```

## Benefits

1. **Modular:** Each sub-agent has a focused responsibility
2. **Scalable:** Easy to add new sub-agents for new capabilities
3. **Transparent:** Clear routing logic and multi-step workflows
4. **Accurate:** No hallucinations - only corpus-based analysis
5. **Comprehensive:** Synthesizes across all three corpora
6. **Honest:** Explicitly states limitations and missing information
