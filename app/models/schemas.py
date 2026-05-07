from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InquiryRequest(BaseModel):
    sender_name: str = Field(min_length=1, max_length=200)
    sender_email: EmailStr
    subject: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1, max_length=5000)
    metadata: dict = Field(default_factory=dict)


class WebhookResponse(BaseModel):
    run_id: str
    status: str
    message: str
    poll_url: str


class RunStatus(BaseModel):
    run_id: str
    status: str
    intent: str
    intent_confidence: float
    current_agent: str
    agent_steps: list[dict]
    final_response: Optional[str] = None
    lead_score: Optional[float] = None
    lead_tier: Optional[str] = None
    escalate: bool
    escalation_reason: Optional[str] = None
    created_at: str
    updated_at: str


class RunListItem(BaseModel):
    run_id: str
    status: str
    intent: str
    sender_name: str
    sender_email: str
    subject: str
    created_at: str


class AgentStepEvent(BaseModel):
    model_config = ConfigDict(extra="allow")

    run_id: str
    agent: str
    action: str
    output: str
    timestamp: str
