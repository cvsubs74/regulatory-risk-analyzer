"""
Simple Agent using File Search for business data and risk analysis
Uses sequential pattern: router -> formatter
"""

from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agents.business_data_agent.agent import business_data_agent
from .sub_agents.risk_analysis_agent.agent import risk_analysis_agent
from .schemas.structured_output import OrchestratorOutput
from .tools.logging_utils import log_agent_entry, log_agent_exit

# Router agent - calls the appropriate sub-agent
orchestrator_router = LlmAgent(
    name="orchestrator_router",
    model="gemini-2.5-flash",
    description="Routes queries to the appropriate sub-agent",
    instruction="""
    Route the user's query to the appropriate agent.
    
    **AGENT SELECTION:**
    - business_data_agent: For general document search, business process questions
    - risk_analysis_agent: For compliance analysis, risk assessment
    
    **YOUR JOB:**
    1. Analyze the user's question
    2. Call the appropriate agent
    3. Store the agent's response for the next agent to format
    """,
    tools=[
        AgentTool(business_data_agent),
        AgentTool(risk_analysis_agent),
    ],
    output_key="agent_response",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit
)

# Formatter agent - formats sub-agent output into OrchestratorOutput
orchestrator_formatter = LlmAgent(
    name="orchestrator_formatter",
    model="gemini-2.5-flash",
    description="Formats agent responses into final output",
    instruction="""
    Format the agent response into OrchestratorOutput JSON with two fields: result and suggested_questions.
    
    **INPUT:**
    You receive agent_response which is EITHER:
    1. BusinessDataOutput: {answer, citations, suggested_questions, ...}
    2. RiskAnalysisOutput: {executive_summary, critical_risks, medium_risks, low_risks, recommendations_roadmap, citations, suggested_questions, ...}
    
    **YOUR JOB:**
    
    1. **suggested_questions field:**
       - Extract the suggested_questions array from agent_response AS-IS
       - Do NOT modify, just copy the array directly
       - This field must be an array of strings
    
    2. **result field:**
       - Summarize and format ALL other content (except suggested_questions) as markdown
       - For BusinessDataOutput:
         * Use the answer field as the main content
         * Format citations at the end:
           **Sources:**
           **filename.txt**
           > citation content
       
       - For RiskAnalysisOutput:
         * Create a comprehensive markdown summary including:
           - Executive summary
           - Overall risk level and compliance score
           - Critical/Medium/Low risks (formatted as lists or tables)
           - Recommendations roadmap
           - Information gaps
         * Format citations at the end (same format as BusinessDataOutput):
           **Sources:**
           **filename.txt**
           > citation content
         * Make it readable and well-structured
    
    **CRITICAL:**
    - suggested_questions must be an ARRAY of strings, not a string
    - result must be a SINGLE markdown string
    - Return valid JSON only
    """,
    output_schema=OrchestratorOutput,
    output_key="formatted_output"
)

# Main orchestrator using sequential pattern
root_agent = SequentialAgent(
    name="DocumentSearchAgent",
    sub_agents=[
        orchestrator_router,
        orchestrator_formatter
    ]
)
