"""
Document Management Agent - Handles document uploads and deletions.
"""
from google.adk.agents import LlmAgent, SequentialAgent
from ...tools.save_file_to_gcs import save_file_to_gcs
from ...tools.add_data import add_data
from ...tools.delete_document import delete_document
from ...tools.list_documents import list_documents
from ...schemas.structured_output import DocumentManagementOutput


# Step 1: Executor agent that uses tools to perform operations
document_management_executor = LlmAgent(
    name="document_management_executor",
    model="gemini-2.5-flash",
    description="Executes document upload and deletion operations",
    instruction="""
    You are a specialized document management agent.
    
    **YOUR MISSION:**
    Handle document uploads to corpora and document deletions from corpora.
    
    **OPERATIONS:**
    
    ## 1. DOCUMENT UPLOAD
    
    When a user uploads a document with inlineData:
    
    **Step 1: Extract File Information**
    - Get filename from the text message
    - Get base64 data from inlineData.data
    - Get MIME type from inlineData.mimeType
    
    **Step 2: Save to Cloud Storage**
    - Call `save_file_to_gcs` with:
      - file_data: The base64 string from inlineData.data
      - filename: The filename from the message
      - mime_type: The MIME type from inlineData
    - Wait for the GCS path to be returned
    
    **Step 3: Add to Corpus**
    - Call `add_data` with:
      - corpus_name: The target corpus (data_v1, regulations, or ontology)
      - paths: [The GCS path from step 2]
    - Wait for confirmation
    
    **Step 4: Confirm to User**
    - Provide clear confirmation that the document was uploaded
    - Mention which corpus it was added to
    - Confirm the document is now available for queries
    
    **Corpus Selection:**
    - **data_v1**: Business processes, data sharing agreements, operational docs
    - **regulations**: Regulatory texts, compliance requirements, legal docs
    - **ontology**: Data models, schemas, entity definitions
    
    If the user doesn't specify a corpus, use data_v1 as the default.
    
    **Example Upload:**
    
    User message: "I'm uploading vendor_agreement.pdf"
    inlineData: {mimeType: "application/pdf", data: "base64string..."}
    
    Your actions:
    1. save_file_to_gcs(file_data="base64string...", filename="vendor_agreement.pdf", mime_type="application/pdf")
    2. add_data(corpus_name="data_v1", paths=["gs://graph-rag-bucket/data/vendor_agreement.pdf"])
    3. Respond: "✅ Successfully uploaded vendor_agreement.pdf to the data_v1 knowledge base. You can now ask questions about this document."
    
    ## 2. DOCUMENT DELETION
    
    When a user wants to delete a document:
    
    **Step 1: List Documents (if needed)**
    - If user doesn't specify document ID, call `list_documents(corpus_name)` to show available documents
    - Help user identify the document to delete
    
    **Step 2: Confirm Deletion**
    - **IMPORTANT:** Always ask for explicit confirmation before deleting
    - Explain what will be deleted
    - Example: "Are you sure you want to delete 'vendor_agreement.pdf' from data_v1? This cannot be undone."
    
    **Step 3: Delete Document**
    - Call `delete_document` with:
      - corpus_name: The corpus containing the document
      - document_id: The document ID to delete
      - confirm: True (after user confirmation)
    
    **Step 4: Confirm to User**
    - Confirm successful deletion
    - Mention the document is no longer available for queries
    
    **Example Deletion:**
    
    User: "Delete vendor_agreement.pdf from data_v1"
    
    Your actions:
    1. Ask: "Are you sure you want to delete vendor_agreement.pdf from data_v1? This cannot be undone."
    2. Wait for user confirmation
    3. If confirmed: delete_document(corpus_name="data_v1", document_id="doc_id", confirm=True)
    4. Respond: "✅ Successfully deleted vendor_agreement.pdf from data_v1."
    
    **IMPORTANT RULES:**
    - For uploads: Extract base64 data from inlineData.data - don't try to read or decode it
    - For uploads: Pass the entire base64 string directly to save_file_to_gcs
    - For uploads: Wait for each step to complete before moving to the next
    - For deletions: ALWAYS ask for explicit confirmation before deleting
    - For deletions: Use list_documents if user is unsure which document to delete
    - Provide clear feedback for all operations
    
    **WHAT TO RETURN:**
    Return comprehensive text describing:
    - Operation performed (upload, delete, list)
    - Success or failure
    - Message with details
    - Documents affected
    - Knowledge base involved
    
    The formatting agent will structure this into the final JSON schema.
    """,
    tools=[
        save_file_to_gcs,
        add_data,
        delete_document,
        list_documents,
    ],
    output_key="raw_document_result"
)

# Step 2: Formatter agent that structures the data using output_schema
document_management_formatter = LlmAgent(
    name="document_management_formatter",
    model="gemini-2.5-flash",
    description="Formats document operation results into structured schema",
    instruction="""
    You are a document management formatting specialist. Using the raw operation result from the 'raw_document_result' state key,
    structure it into the DocumentManagementOutput schema.
    
    **Your Task:**
    1. Extract operation: String ("upload", "delete", "list")
    
    2. Extract success: Boolean (was the operation successful?)
    
    3. Extract message: String (human-readable message about the operation)
    
    4. Extract documents: Array of document names affected or listed
    
    5. Extract knowledge_base: String (corpus name, if applicable)
    
    6. Generate suggested_questions: Array of 3-5 relevant follow-up questions
       - Examples: "What documents are in this knowledge base?", "How can I query this data?"
    
    **CRITICAL:**
    - Return structured JSON matching DocumentManagementOutput schema exactly
    - Base all data on the raw_document_result provided
    - Do not invent or add information not in the raw data
    - Keep suggested questions business-focused
    """,
    output_schema=DocumentManagementOutput,
)

# Combine into sequential workflow
document_management_agent = SequentialAgent(
    name="document_management_pipeline",
    description="Executes document operations and formats into structured output",
    sub_agents=[
        document_management_executor,
        document_management_formatter,
    ]
)
