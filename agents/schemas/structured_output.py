"""
Structured output schemas for all sub-agents.

All sub-agents return structured data using these schemas.
The orchestrator agent formats the structured data into user-friendly Markdown.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """Represents a single entity extracted from documents."""
    entity_type: str = Field(description="Type of entity (Asset, ProcessingActivity, DataElement, etc.)")
    name: str = Field(description="Name or identifier of the entity")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs of entity attributes")
    relationships: List[Dict[str, str]] = Field(default_factory=list, description="List of relationships to other entities")


class DataGraphOutput(BaseModel):
    """Structured output for data graph agent."""
    entities: List[Entity] = Field(description="List of all entities extracted from documents")
    entity_types_found: List[str] = Field(description="List of entity types that were found")
    entity_types_missing: List[str] = Field(default_factory=list, description="Entity types defined in ontology but not found in documents")
    total_documents_analyzed: int = Field(description="Number of documents analyzed")
    summary: str = Field(description="Brief summary of the data graph")
    gaps: List[str] = Field(default_factory=list, description="List of gaps or missing information")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class RiskItem(BaseModel):
    """Represents a single compliance risk."""
    risk_level: str = Field(description="Risk level: High, Medium, or Low")
    title: str = Field(description="Short title of the risk")
    regulation_section: Optional[str] = Field(default=None, description="Specific regulation section violated")
    current_state: str = Field(description="What is currently happening")
    requirement: str = Field(description="What the regulation requires")
    recommended_action: str = Field(description="Specific action to remediate")
    processing_activity: Optional[str] = Field(default=None, description="Processing activity this risk relates to")


class RiskAnalysisOutput(BaseModel):
    """Structured output for risk analysis agent."""
    regulation_name: str = Field(description="Name of the regulation analyzed")
    regulation_available: bool = Field(description="Whether the regulation was found in the knowledge base")
    overall_risk_level: str = Field(description="Overall risk level: High, Medium, or Low")
    compliance_score: Optional[int] = Field(default=None, description="Compliance score out of 100")
    critical_risks: List[RiskItem] = Field(default_factory=list, description="High-priority risks requiring immediate action")
    medium_risks: List[RiskItem] = Field(default_factory=list, description="Medium-priority risks to address soon")
    low_risks: List[RiskItem] = Field(default_factory=list, description="Low-priority risks or compliant areas")
    executive_summary: str = Field(description="Executive summary of the risk analysis")
    recommendations_roadmap: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Roadmap with keys: immediate, short_term, long_term"
    )
    information_gaps: List[str] = Field(default_factory=list, description="Information needed but not available")
    regulation_sections_analyzed: List[str] = Field(default_factory=list, description="List of regulation sections analyzed")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class DocumentQueryOutput(BaseModel):
    """Structured output for document query agent."""
    query: str = Field(description="The original query")
    sources_queried: List[str] = Field(description="List of knowledge bases queried (e.g., business documents, regulations)")
    results_found: bool = Field(description="Whether any results were found")
    summary: str = Field(description="Summary of findings")
    key_findings: List[str] = Field(default_factory=list, description="List of key findings from the query")
    relevant_documents: List[str] = Field(default_factory=list, description="List of relevant document names or sections")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class DocumentManagementOutput(BaseModel):
    """Structured output for document management agent."""
    operation: str = Field(description="Operation performed: upload, delete, list")
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Human-readable message about the operation")
    documents: List[str] = Field(default_factory=list, description="List of documents affected or listed")
    knowledge_base: Optional[str] = Field(default=None, description="Knowledge base the operation was performed on")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class CorpusManagementOutput(BaseModel):
    """Structured output for corpus management agent."""
    operation: str = Field(description="Operation performed: create, delete, list, info")
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Human-readable message about the operation")
    corpora: List[Dict[str, Any]] = Field(default_factory=list, description="List of corpora with their details")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class OrchestratorOutput(BaseModel):
    """Final structured output from the main orchestrator agent."""
    result: str = Field(description="Markdown-formatted synthesis of all sub-agent outputs")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions from sub-agents")
