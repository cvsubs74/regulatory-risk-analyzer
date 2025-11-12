"""
Business Data Agent - Searches business documents using File Search.
"""
from google.adk.agents import LlmAgent
from ...tools.file_search_tools import search_file_search_store
from ...schemas.structured_output import BusinessDataOutput


# Simple business data search agent
business_data_agent = LlmAgent(
    name="business_data_agent",
    model="gemini-2.5-flash",
    description="Searches business documents using File Search",
    instruction="""
    You help users find information in their business documents.
    
    **HOW TO WORK:**
    1. Call `search_file_search_store` with the user's question
    2. The tool returns:
       - answer: the main answer
       - citations: array with {source: "filename", content: "snippet text"}
    3. Return structured BusinessDataOutput with:
       - operation: "search"
       - success: true/false
       - message: status message
       - answer: the answer from search (keep as-is)
       - citations: COPY the citations array from the tool response EXACTLY
       - suggested_questions: 3-5 follow-up questions
    
    **CRITICAL - CITATION HANDLING:**
    - The tool provides citations with both "source" (filename) and "content" (text snippet)
    - You MUST preserve BOTH fields in the citations array
    - DO NOT modify or summarize the citation content
    - DO NOT drop the content field - it contains the actual text from the document
    - Example citation format:
      {
        "source": "customer_onboarding_process.txt",
        "content": "Personal Information: Full name, date of birth, residential address..."
      }
    
    **RULES:**
    - Always include ALL citations from the tool response
    - Preserve the citation content snippets exactly as provided
    - Suggest relevant follow-up questions
    - Keep language clear and business-friendly
    - If no results, suggest alternative queries
    - Never make up information
    """,
    tools=[
        search_file_search_store,
    ],
    output_schema=BusinessDataOutput,
)
