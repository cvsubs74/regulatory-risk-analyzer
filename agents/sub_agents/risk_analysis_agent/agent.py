"""
Risk Analysis Agent - Analyzes compliance risks using File Search.
Uses sequential pattern: retriever -> formatter
"""
from google.adk.agents import LlmAgent, SequentialAgent
from ...tools.file_search_tools import search_file_search_store
from ...schemas.structured_output import RiskAnalysisOutput

# Retriever agent - searches for regulation and business data
risk_analysis_retriever = LlmAgent(
    name="risk_analysis_retriever",
    model="gemini-2.5-flash",
    description="Retrieves regulation and business data for risk analysis",
    instruction="""
    You retrieve information needed for compliance risk analysis.

    **YOUR JOB:**
    1. Search for regulation requirements using `search_file_search_store`
    2. Search for business processes using `search_file_search_store`
    3. Store the raw search results in the state

    **IMPORTANT:**
    - Call the tool multiple times if needed (regulations, then business processes)
    - Just gather the data, don't analyze yet
    - The next agent will perform the risk analysis
    """,
    tools=[search_file_search_store],
    output_key="raw_risk_data"
)

# Formatter agent - analyzes and formats into RiskAnalysisOutput
risk_analysis_formatter = LlmAgent(
    name="risk_analysis_formatter",
    model="gemini-2.5-flash",
    description="Analyzes compliance risks and formats structured output",
    instruction="""
    You analyze compliance risks and format the results.

    **INPUT:**
    You receive raw_risk_data from the previous agent with search results.
    Each search result contains:
    - answer: the main answer text
    - citations: array of {source: "filename", content: "snippet text"}

    **YOUR JOB:**
    Analyze the data and format into RiskAnalysisOutput with:
    - regulation_name: Name of the regulation analyzed
    - regulation_available: true/false if regulation text was found
    - overall_risk_level: "High", "Medium", or "Low"
    - critical_risks: Array of high-priority compliance gaps
    - medium_risks: Array of moderate-priority issues
    - low_risks: Array of low-priority concerns
    - executive_summary: Brief overview of findings
    - recommendations_roadmap: Prioritized action items
    - information_gaps: Missing information needed for complete analysis
    - regulation_sections_analyzed: List of regulation sections reviewed
    - citations: COPY all citations from search results EXACTLY (preserve both source and content)
    - suggested_questions: 3-5 follow-up questions

    **CRITICAL - CITATION HANDLING:**
    - Collect ALL citations from the search results
    - Preserve BOTH "source" and "content" fields from each citation
    - DO NOT modify or summarize the citation content
    - Combine citations from multiple searches if applicable
    - Remove duplicates based on source+content

    **RULES:**
    - Return valid JSON matching RiskAnalysisOutput schema
    - Base analysis ONLY on search results
    - If regulation not found, set regulation_available: false
    - Identify specific compliance gaps
    - Provide actionable recommendations
    - Include all citations from the search results
    - Never make up requirements
    """,
    output_schema=RiskAnalysisOutput, 
    output_key="risk_analysis_output"
)

# Sequential agent combining retriever and formatter
risk_analysis_agent = SequentialAgent(
    name="risk_analysis_agent",
    sub_agents=[
        risk_analysis_retriever,
        risk_analysis_formatter
    ]
)
