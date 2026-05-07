from datetime import datetime

from app.models.state import AgentState
from app.utils.ollama_client import OllamaClient


class HandoffAgent:
    def run(self, state: AgentState, ollama_client: OllamaClient) -> dict:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are preparing a case summary for a human agent taking over this conversation. "
                    "Write a structured summary: 1) Customer info, 2) Issue description, "
                    "3) What was attempted, 4) Why escalation is needed, 5) Recommended next action."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Run ID: {state['run_id']}\n"
                    f"Sender: {state['sender_name']} ({state['sender_email']})\n"
                    f"Intent: {state['intent']}\n"
                    f"Original inquiry: {state['raw_input']}\n"
                    f"Escalation reason: {state['escalation_reason']}"
                ),
            },
        ]
        handoff_summary = ollama_client.chat(messages)
        step = {
            "agent": "handoff_agent",
            "action": "prepared_handoff_summary",
            "output": handoff_summary[:300],
            "timestamp": datetime.utcnow().isoformat(),
        }
        return {
            "final_response": (
                "Your inquiry has been escalated to our specialist team. "
                f"Reference ID: {state['run_id']}. We will contact you within 2 business hours."
            ),
            "resolution_draft": handoff_summary,
            "current_agent": "handoff_agent",
            "agent_steps": state["agent_steps"] + [step],
            "status": "escalated",
        }
