from datetime import datetime

from app.models.state import AgentState
from app.tools.crm_tool import CRMTool
from app.tools.email_tool import EmailTool
from app.utils.ollama_client import OllamaClient


class LeadAgent:
    intents = ["sales", "pricing", "demo_request", "upgrade"]

    def run(
        self,
        state: AgentState,
        ollama_client: OllamaClient,
        crm_tool: CRMTool,
        email_tool: EmailTool,
    ) -> dict:
        lead_result = crm_tool.score_lead(state["raw_input"], state["sender_email"], ollama_client)
        tier = lead_result.get("tier", "warm")
        crm_tool.log_contact(state["sender_email"], state["sender_name"], state["intent"], tier)

        if tier == "hot":
            style = "Emphasize urgency, business impact, and offer a demo call this week."
        elif tier == "warm":
            style = "Emphasize value proposition, customer outcomes, and free trial onboarding."
        else:
            style = "Emphasize educational resources and no-pressure next steps."

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a sales specialist crafting outreach. "
                    f"{style} Keep it concise and specific to the inquiry."
                ),
            },
            {
                "role": "user",
                "content": f"Inquiry:\n{state['raw_input']}\n\nLead tier: {tier}",
            },
        ]
        draft = ollama_client.chat(messages)
        step = {
            "agent": "lead_agent",
            "action": "scored_and_drafted",
            "output": draft[:300],
            "timestamp": datetime.utcnow().isoformat(),
        }
        return {
            "lead_score": float(lead_result.get("score", 0.3)),
            "lead_tier": tier,
            "resolution_draft": draft,
            "current_agent": "lead_agent",
            "agent_steps": state["agent_steps"] + [step],
            "status": "completed",
        }
