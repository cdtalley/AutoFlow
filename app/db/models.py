from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class RunRecord(Base):
    __tablename__ = "runs"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    run_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="running")
    intent: Mapped[str] = mapped_column(String(50), default="")
    intent_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    sender_name: Mapped[str] = mapped_column(String(200), default="")
    sender_email: Mapped[str] = mapped_column(String(200), default="")
    subject: Mapped[str] = mapped_column(String(500), default="")
    raw_input: Mapped[str] = mapped_column(Text, default="")
    final_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    lead_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    lead_tier: Mapped[str | None] = mapped_column(String(20), nullable=True)
    escalate: Mapped[bool] = mapped_column(Boolean, default=False)
    escalation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_steps: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
