import random
from datetime import datetime

from app.models.state import AgentState
from app.tools.email_tool import EmailTool
from app.utils.ollama_client import OllamaClient


class SupportAgent:
    intents = ["support", "bug_report", "complaint", "billing_issue"]

    def run(self, state: AgentState, ollama_client: OllamaClient, email_tool: EmailTool) -> dict:
        severity_result = ollama_client.classify(state["raw_input"], ["low", "medium", "high", "critical"])
        severity = severity_result.get("category", "medium")
        ticket = f"TKT-{random.randint(10000, 99999)}"
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a senior customer support specialist. Draft a resolution response. "
                    "Acknowledge the issue, provide clear next steps, give a realistic timeline. "
                    "For billing issues: direct to billing@company.com and offer account credit. "
                    f"For bugs: acknowledge, give ticket number ({ticket}), promise follow-up. "
                    "For complaints: empathize first, then provide concrete resolution path."
                ),
            },
            {"role": "user", "content": state["raw_input"]},
        ]
        draft = ollama_client.chat(messages)
        needs_handoff = severity in ["critical", "high"]
        step = {
            "agent": "support_agent",
            "action": f"resolved_with_severity_{severity}",
            "output": draft[:300],
            "timestamp": datetime.utcnow().isoformat(),
        }
        return {
            "resolution_draft": draft,
            "escalate": needs_handoff,
            "escalation_reason": (
                f"High severity {severity} issue requires human review" if needs_handoff else None
            ),
            "current_agent": "support_agent",
            "agent_steps": state["agent_steps"] + [step],
            "status": "escalated" if needs_handoff else "completed",
        }
