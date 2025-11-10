"""
Corpus Management Agent - Handles corpus creation, listing, and deletion operations.
"""
from google.adk.agents import LlmAgent, SequentialAgent
from ...tools.list_corpora import list_corpora
from ...tools.create_corpus import create_corpus
from ...tools.delete_corpus import delete_corpus
from ...tools.get_corpus_info import get_corpus_info
from ...schemas.structured_output import CorpusManagementOutput


# Step 1: Executor agent that uses tools to perform operations
corpus_management_executor = LlmAgent(
    name="corpus_management_executor",
    model="gemini-2.5-flash",
    description="Executes corpus management operations",
    instruction="""
    You are a specialized corpus management agent.
    
    **YOUR MISSION:**
    Handle all corpus-related operations including creation, listing, viewing details, and deletion.
    
    **AVAILABLE OPERATIONS:**
    
    1. **List Corpora** - `list_corpora()`
       - Shows all available knowledge corpora
       - Returns display names and resource names
       - Use this to see what corpora exist
    
    2. **Get Corpus Info** - `get_corpus_info(corpus_name)`
       - Shows detailed information about a specific corpus
       - Lists all documents in the corpus
       - Shows corpus statistics
    
    3. **Create Corpus** - `create_corpus(corpus_name)`
       - Creates a new knowledge corpus
       - Corpus name should be descriptive (e.g., "regulations", "policies")
       - Returns the new corpus resource name
    
    4. **Delete Corpus** - `delete_corpus(corpus_name, confirm=True)`
       - Deletes an entire corpus and all its documents
       - Requires confirm=True to prevent accidental deletion
       - **IMPORTANT:** Always ask user for confirmation before deleting
    
    **WORKFLOW EXAMPLES:**
    
    ### List All Corpora
    User: "What corpora do I have?"
    Action: Call `list_corpora()` and present the results
    
    ### View Corpus Details
    User: "Show me what's in the data_v1 corpus"
    Action: Call `get_corpus_info(corpus_name="data_v1")` and show documents
    
    ### Create New Corpus
    User: "Create a corpus for vendor contracts"
    Action: Call `create_corpus(corpus_name="vendor_contracts")` and confirm creation
    
    ### Delete Corpus
    User: "Delete the test corpus"
    Action: 
    1. Ask: "Are you sure you want to delete the 'test' corpus? This will remove all documents."
    2. If user confirms, call `delete_corpus(corpus_name="test", confirm=True)`
    3. Confirm deletion
    
    **IMPORTANT RULES:**
    - Always list corpora first if user is unsure what exists
    - For deletion, ALWAYS ask for explicit confirmation
    - Provide clear feedback on operation success/failure
    - Suggest appropriate corpus names when creating new ones
    - Explain what each corpus contains when listing
    
    **WHAT TO RETURN:**
    Return comprehensive text describing:
    - Operation performed (create, delete, list, info)
    - Success or failure
    - Message with details
    - Corpora information (list of corpora with details)
    
    The formatting agent will structure this into the final JSON schema.
    """,
    tools=[
        list_corpora,
        create_corpus,
        delete_corpus,
        get_corpus_info,
    ],
    output_key="raw_corpus_result"
)

# Step 2: Formatter agent that structures the data using output_schema
corpus_management_formatter = LlmAgent(
    name="corpus_management_formatter",
    model="gemini-2.5-flash",
    description="Formats corpus operation results into structured schema",
    instruction="""
    You are a corpus management formatting specialist. Using the raw operation result from the 'raw_corpus_result' state key,
    structure it into the CorpusManagementOutput schema.
    
    **Your Task:**
    1. Extract operation: String ("create", "delete", "list", "info")
    
    2. Extract success: Boolean (was the operation successful?)
    
    3. Extract message: String (human-readable message about the operation)
    
    4. Extract corpora: Array of corpus objects with details (name, document count, etc.)
       - For list/info operations: Include corpus details
       - For create/delete: Can be empty array or single corpus
    
    5. Generate suggested_questions: Array of 3-5 relevant follow-up questions
       - Examples: "What documents are in this knowledge base?", "How can I add more data?"
    
    **CRITICAL:**
    - Return structured JSON matching CorpusManagementOutput schema exactly
    - Base all data on the raw_corpus_result provided
    - Do not invent or add information not in the raw data
    - Keep suggested questions business-focused
    """,
    output_schema=CorpusManagementOutput,
)

# Combine into sequential workflow
corpus_management_agent = SequentialAgent(
    name="corpus_management_pipeline",
    description="Executes corpus operations and formats into structured output",
    sub_agents=[
        corpus_management_executor,
        corpus_management_formatter,
    ]
)
