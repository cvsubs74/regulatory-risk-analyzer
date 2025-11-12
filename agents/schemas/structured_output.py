"""
Simple output schemas for agents.
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    """A single compliance risk."""
    risk_level: str = Field(description="High, Medium, or Low")
    title: str = Field(description="Short title")
    regulation_section: Optional[str] = Field(default=None, description="Regulation section")
    current_state: str = Field(description="Current state")
    requirement: str = Field(description="Regulation requirement")
    recommended_action: str = Field(description="Recommended action")
    processing_activity: Optional[str] = Field(default=None, description="Related activity")


class RiskAnalysisOutput(BaseModel):
    """Risk analysis output."""
    regulation_name: str = Field(description="Regulation name")
    regulation_available: bool = Field(description="Was regulation found")
    overall_risk_level: str = Field(description="High, Medium, or Low")
    compliance_score: Optional[int] = Field(default=None, description="Score 0-100")
    critical_risks: List[RiskItem] = Field(default_factory=list, description="High risks")
    medium_risks: List[RiskItem] = Field(default_factory=list, description="Medium risks")
    low_risks: List[RiskItem] = Field(default_factory=list, description="Low risks")
    executive_summary: str = Field(description="Summary")
    recommendations_roadmap: Dict[str, List[str]] = Field(default_factory=dict, description="Roadmap")
    information_gaps: List[str] = Field(default_factory=list, description="Gaps")
    regulation_sections_analyzed: List[str] = Field(default_factory=list, description="Sections")
    suggested_questions: List[str] = Field(default_factory=list, description="Follow-up questions")


class Citation(BaseModel):
    """Citation from File Search."""
    source: str = Field(description="Source document name")
    content: str = Field(description="Content snippet")


class BusinessDataOutput(BaseModel):
    """Business data search output."""
    operation: str = Field(description="Operation: search")
    success: bool = Field(description="Was search successful")
    message: str = Field(description="Status message")
    answer: str = Field(description="Answer from search")
    citations: List[Citation] = Field(default_factory=list, description="Citations")
    suggested_questions: List[str] = Field(default_factory=list, description="Follow-up questions")


class OrchestratorOutput(BaseModel):
    """Output from the document search agent."""
    result: str = Field(description="Markdown-formatted answer with citations")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")
