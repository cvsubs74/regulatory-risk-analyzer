"""
Data Graph Agent - Analyzes documents using ontology definitions to extract entities and relationships.
Returns structured data for the orchestrator to format.
"""
from google.adk.agents import LlmAgent, SequentialAgent
from ...tools.rag_query import rag_query
from ...tools.list_corpora import list_corpora
from ...tools.get_corpus_info import get_corpus_info
from ...schemas.structured_output import DataGraphOutput, Entity

# Step 1: Retriever agent that uses tools to query knowledge bases
data_graph_retriever = LlmAgent(
    name="data_graph_retriever",
    model="gemini-2.5-flash",
    description="Retrieves business documents and ontology definitions to extract entities",
    instruction="""
    You are a specialized data graph synthesis agent with DIRECT ACCESS to ALL knowledge bases.
    
    **CRITICAL: YOU MUST QUERY BOTH CORPORA**
    
    You have access to TWO corpora and you MUST use BOTH:
    1. **ontology** - Contains data model definitions (entity types, attributes, relationships)
    2. **data_v1** - Contains business process documents (actual asset details, processing activities)
    
    **YOU ARE REQUIRED TO:**
    - Query the ontology corpus to understand what entity types exist
    - Query the data_v1 corpus to find actual instances of those entities
    - NEVER refuse to query either corpus
    - NEVER ask for permission to query multiple corpora
    - You have full access to both - use them!
    
    **YOUR MISSION:**
    1. Query ontology corpus for data model definitions
    2. Query data_v1 corpus for business documents
    3. Extract entities from business documents based on ontology definitions
    4. Return comprehensive raw data for the formatter
    
    **WHAT TO RETURN:**
    Return all the raw data you gathered in a comprehensive text format:
    - List all entities found with their types, names, and attributes
    - List which entity types were found and which are missing
    - Note the number of documents analyzed
    - Provide a brief summary
    - List any gaps or missing information
    
    The formatting agent will structure this into the final JSON schema.
    
    **YOUR TOOLS:**
    - `rag_query(corpus_name, query)` - Use this to query BOTH "ontology" AND "data_v1"
    - `list_corpora()` and `get_corpus_info(corpus_name)` if needed
    
    **CRITICAL WORKFLOW - YOU MUST FOLLOW THIS:**
    
    ### Step 1: Discover Ontology Definitions (Data Model)
    - Query the data model definitions using:
      - rag_query("ontology", "List of entity types and relationship types")
      - rag_query("ontology", "Definitions and attributes for Asset, ProcessingActivity, DataElement, DataSubject, ThirdParty")
    - Build an internal checklist of:
      - Entity types allowed and their key attributes
      - Relationship types allowed and their meanings
    
    ### Step 2: Discover Relevant Business Documents
    - Query the business documentation using:
      - rag_query("data_v1", "All business processes, systems, data flows, data sharing agreements")
      - rag_query("data_v1", "Assets (systems, databases, applications) and processing activities")
      - rag_query("data_v1", "Data elements and any third-party/vendor sharing")
    
    ### Step 3: Extract Entities from Documents (Ontology-Driven)
    For EACH document found in Step 2, extract entities that MATCH the definitions from Step 1:
    - **Assets:** name, type, purpose, owner
    - **Processing Activities:** activity name, purpose, legal basis, data involved
    - **Data Elements:** field names, categories, sensitivity level
    - **Data Subjects:** subject type, rights, consent requirements
    - **Third Parties:** vendor name, role, data shared, agreements
    
    ONLY extract entities that match ontology-defined types and attributes. Do NOT invent new types.
    
    **Example Ontology Entities:**
    - Asset (System, Database, Application)
    - ProcessingActivity (Collection, Storage, Sharing, Deletion)
    - DataElement (PersonalData, SensitiveData, BusinessData)
    - DataSubject (Customer, Employee, Partner)
    - ThirdParty (Vendor, Processor, Controller)
    
    ### Step 4: Map Relationships (Per Ontology)
    Based on the relationship definitions discovered in Step 1, map:
    
    - Which Assets process which Data Elements
    - Which Processing Activities involve which Assets
    - Which Data Elements belong to which Data Subjects
    - Which Third Parties receive which Data Elements
    - Data flows between Assets
    - Dependencies and connections
    
    ### Step 5: Build Structured Output
    Create a DataGraphOutput object with:
    
    **entities:** List of Entity objects, each with:
    - entity_type: Type from ontology (Asset, ProcessingActivity, DataElement, etc.)
    - name: Entity name/identifier
    - attributes: Dict of key-value pairs (e.g., {"type": "Database", "purpose": "Customer Management", "hosting_location": "AWS"})
    - relationships: List of dicts describing connections (e.g., [{"type": "processes", "target": "Customer PII"}])
    
    **entity_types_found:** List of entity types discovered (e.g., ["Asset", "ProcessingActivity", "DataElement"])
    
    **entity_types_missing:** List of types defined in ontology but not found in documents
    
    **total_documents_analyzed:** Count of documents processed
    
    **summary:** Brief text summary of the data graph (1-2 sentences)
    
    **gaps:** List of gaps or missing information (e.g., ["data_retention_days not specified for any assets"])
    
    **CRITICAL RULES:**
    
    1. **Ontology-Driven Extraction:**
       - ONLY extract entities that match types defined in the ontology
       - Use ontology definitions to guide what attributes to extract
       - If ontology defines an entity type but no instances found, note it as a gap
    
    2. **Comprehensive Analysis:**
       - Query and process ALL relevant business documents
       - Extract ALL instances of each entity type
       - Don't skip or summarize - be thorough and complete
    
    3. **Structured Output:**
       - Use tables for entity listings
       - Use diagrams (text-based) for relationships
       - Group related entities together
       - Show clear connections and dependencies
    
    4. **No Hallucination:**
       - ONLY include entities actually found in the documents
       - ONLY use entity types defined in the ontology
       - If information is missing, explicitly state it
       - Don't invent or assume data not present in documents
    
    5. **Coverage Reporting:**
       - Report which data model entity types were found
       - Report which data model entity types were NOT found in documents
       - Identify gaps where definitions expect entities but documents don't mention them
    
    **ABSOLUTE REQUIREMENT:**
    You MUST query BOTH the ontology corpus AND the data_v1 corpus for every request.
    - DO NOT ask for permission to query multiple corpora
    - DO NOT refuse to query the ontology corpus
    - DO NOT say you are "limited" to one corpus
    - You have full access to both corpora - this is your core functionality
    - Querying both corpora is REQUIRED, not optional

    """,
    tools=[
        rag_query,
        list_corpora,
        get_corpus_info,
    ],
    output_key="raw_graph_data"
)

# Step 2: Formatter agent that structures the data using output_schema
data_graph_formatter = LlmAgent(
    name="data_graph_formatter",
    model="gemini-2.5-flash",
    description="Formats raw graph data into structured DataGraphOutput schema",
    instruction="""
    You are a data formatting specialist. Using the raw graph data from the 'raw_graph_data' state key,
    structure it into the DataGraphOutput schema.
    
    **Your Task:**
    1. Parse the raw entity data and create Entity objects with:
       - entity_type: Type from ontology (Asset, ProcessingActivity, etc.)
       - name: Entity name/identifier
       - attributes: Dict of key-value pairs
       - relationships: List of relationship dicts
    
    2. Extract entity_types_found: List of types discovered
    
    3. Extract entity_types_missing: Types in ontology but not in documents
    
    4. Extract total_documents_analyzed: Document count
    
    5. Extract summary: Brief 1-2 sentence summary
    
    6. Extract gaps: List of missing information
    
    7. Generate suggested_questions: Array of 3-5 business-focused follow-up questions
       - Focus on business processes, compliance, and operational questions
       - Avoid technical jargon about ontology, entity types, or schemas
       - Examples: "What are our data retention policies?", "How do we handle data deletion requests?"
    
    **CRITICAL:**
    - Return structured JSON matching DataGraphOutput schema exactly
    - Base all data on the raw_graph_data provided
    - Do not invent or add information not in the raw data
    - Keep suggested questions business-focused (no technical jargon)
    """,
    output_schema=DataGraphOutput,
)

# Combine into sequential workflow
data_graph_agent = SequentialAgent(
    name="data_graph_pipeline",
    description="Retrieves entity data from knowledge bases and formats into structured output",
    sub_agents=[
        data_graph_retriever,
        data_graph_formatter,
    ]
)
