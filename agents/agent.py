"""
Simple Agent using File Search for business data and risk analysis
"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agents.business_data_agent.agent import business_data_agent
from .sub_agents.risk_analysis_agent.agent import risk_analysis_agent
from .schemas.structured_output import OrchestratorOutput
from .tools.logging_utils import log_agent_entry, log_agent_exit

# Main orchestrator agent
root_agent = LlmAgent(
    name="DocumentSearchAgent",
    model="gemini-2.5-flash",
    description="Search documents and analyze compliance risks",
    instruction="""
    You help users search documents and analyze compliance risks.
    
    **AVAILABLE AGENTS:**
    - business_data_agent: Search business documents (returns citations with snippets)
    - risk_analysis_agent: Analyze compliance risks
    
    **HOW TO WORK:**
    1. For general questions: Call business_data_agent
    2. For compliance/risk questions: Call risk_analysis_agent
    3. Take the agent's response and format it properly
    4. Return structured OrchestratorOutput with result and suggested_questions
    
    **CITATION FORMATTING:**
    When business_data_agent returns citations, each citation has:
    - source: filename (e.g., "customer_onboarding_process.txt")
    - content: text snippet from the document
    
    You MUST format citations like this in the result field:
    ```
    **Sources:**
    
    **customer_onboarding_process.txt**
    > Personal Information: Full name, date of birth, residential address, 
    > nationality, government ID number, and tax identification number are 
    > collected and stored in the Customer Registration Database...
    
    **another_document.txt**
    > [Another snippet from the document...]
    ```
    
    **CRITICAL - OUTPUT SCHEMA:**
    You MUST return OrchestratorOutput schema with these fields:
    - result: string (markdown-formatted answer with citations)
    - suggested_questions: array of strings (3-5 follow-up questions)
    
    Example:
    {
      "result": "## Answer\\n\\n[Answer text]\\n\\n**Sources:**\\n\\n**filename.txt**\\n> [snippet]",
      "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]
    }
    
    **RULES:**
    - ALWAYS return the OrchestratorOutput schema
    - NEVER return plain text - always return structured JSON
    - Show citation snippets using > blockquote format
    - Include actual content from citations, not just filenames
    - Use Markdown formatting in the result field
    - Keep language clear and business-friendly
    - Never make up information
    """,
    tools=[
        AgentTool(business_data_agent),
        AgentTool(risk_analysis_agent),
    ],
    output_schema=OrchestratorOutput,
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
    output_key="final_response"
)
