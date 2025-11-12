"""
Business Data Agent - Searches business documents using File Search.
Uses sequential pattern: retriever -> formatter
"""
from google.adk.agents import LlmAgent, SequentialAgent
from ...tools.file_search_tools import search_file_search_store
from ...schemas.structured_output import BusinessDataOutput


# Retriever agent - calls the tool and stores raw data
business_data_retriever = LlmAgent(
    name="business_data_retriever",
    model="gemini-2.5-flash",
    description="Retrieves business data from File Search",
    instruction="""
    You retrieve information from business documents.

    **YOUR JOB:**
    1. Call `search_file_search_store` with the user's question
    2. Store the raw response in the state using output_key

    **IMPORTANT:**
    - Just call the tool and pass the results forward
    - Do NOT format or modify the response
    - The next agent will handle formatting
    """,
    tools=[search_file_search_store],
    output_key="raw_search_results"
)

# Formatter agent - formats the data into BusinessDataOutput schema
business_data_formatter = LlmAgent(
    name="business_data_formatter",
    model="gemini-2.5-flash",
    description="Formats business data into structured output",
    instruction="""
    You format search results into the BusinessDataOutput schema.

    **INPUT:**
    You receive raw_search_results from the previous agent with:
    - answer: the main answer text
    - citations: array of {source: "filename", content: "snippet text"}

    **YOUR JOB:**
    Format into BusinessDataOutput with:
    - operation: "search"
    - success: true
    - message: "Search completed successfully"
    - answer: the answer from raw_search_results
    - citations: COPY the citations array EXACTLY (preserve both source and content)
    - suggested_questions: Generate 3-5 relevant follow-up questions

    **CRITICAL - CITATION HANDLING:**
    - Preserve BOTH "source" and "content" fields from each citation
    - DO NOT modify or summarize the citation content
    - DO NOT drop any fields
    - Copy the citations array exactly as provided

    **RULES:**
    - Return valid JSON matching BusinessDataOutput schema
    - Include all citations with full content
    - Generate helpful follow-up questions
    - Keep language clear and professional
    """,
    output_schema=BusinessDataOutput,
    output_key="business_data_output"
)

# Sequential agent combining retriever and formatter
business_data_agent = SequentialAgent(
    name="business_data_agent",
    sub_agents=[
        business_data_retriever,
        business_data_formatter
    ]
)
