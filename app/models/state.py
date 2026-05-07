from typing import Annotated, Optional, TypedDict

from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    run_id: str
    messages: Annotated[list, add_messages]
    raw_input: str
    sender_name: str
    sender_email: str
    intent: str
    intent_confidence: float
    lead_score: Optional[float]
    lead_tier: Optional[str]
    resolution_draft: Optional[str]
    escalate: bool
    escalation_reason: Optional[str]
    current_agent: str
    agent_steps: list[dict]
    final_response: Optional[str]
    status: str
    error: Optional[str]
