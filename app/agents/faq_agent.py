from datetime import datetime

from app.models.state import AgentState
from app.tools.knowledge_tool import KnowledgeTool
from app.utils.ollama_client import OllamaClient


class FAQAgent:
    intents = ["general_inquiry", "faq"]

    def run(self, state: AgentState, ollama_client: OllamaClient, knowledge_tool: KnowledgeTool) -> dict:
        inquiry = f"{state['raw_input']}"
        answer = knowledge_tool.answer_faq(inquiry, ollama_client)
        step = {
            "agent": "faq_agent",
            "action": "answered_faq",
            "output": answer[:300],
            "timestamp": datetime.utcnow().isoformat(),
        }
        return {
            "resolution_draft": answer,
            "current_agent": "faq_agent",
            "agent_steps": state["agent_steps"] + [step],
            "status": "completed",
        }
