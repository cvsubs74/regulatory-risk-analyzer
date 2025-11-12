"""
Risk Analysis Agent - Analyzes compliance risks using File Search.
"""
from google.adk.agents import LlmAgent
from ...tools.file_search_tools import search_file_search_store
from ...schemas.structured_output import RiskAnalysisOutput

# Simple risk analysis agent using File Search
risk_analysis_agent = LlmAgent(
    name="risk_analysis_agent",
    model="gemini-2.5-flash",
    description="Analyzes compliance risks using File Search",
    instruction="""
    You analyze compliance risks by searching documents.

    **HOW TO WORK:**
    1. Search for regulation requirements using `search_file_search_store`
    2. Search for business processes using `search_file_search_store`
    3. Compare and identify compliance gaps
    4. Return structured risk analysis

    **OUTPUT:** Return RiskAnalysisOutput with:
    - regulation_name, regulation_available, overall_risk_level
    - critical_risks, medium_risks, low_risks (arrays)
    - executive_summary, recommendations_roadmap
    - information_gaps, regulation_sections_analyzed
    - suggested_questions
    **RULES:**
    - Search for regulation text first
    - If not found, say so clearly
    - Search for business processes
    - Compare and identify gaps
    - Base analysis ONLY on search results
    - Never make up requirements
    """,
    tools=[
        search_file_search_store,
    ],
    output_schema=RiskAnalysisOutput,
)
