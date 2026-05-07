import json
from uuid import uuid4

from app.utils.ollama_client import OllamaClient


class CRMTool:
    def score_lead(self, inquiry: str, sender_email: str, ollama_client: OllamaClient) -> dict:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a sales qualification specialist. Score this lead. Return JSON: "
                    '{"score": <float 0.0-1.0>, "tier": "hot|warm|cold", '
                    '"budget_signal": "high|medium|low|unknown", '
                    '"timeline_signal": "immediate|3months|6months|unknown", '
                    '"reasoning": "<2 sentences>"}'
                ),
            },
            {
                "role": "user",
                "content": f"Lead inquiry:\nEmail: {sender_email}\n\n{inquiry}",
            },
        ]
        try:
            raw = ollama_client.chat(messages, json_mode=True)
            return json.loads(raw)
        except Exception:
            return {
                "score": 0.3,
                "tier": "warm",
                "budget_signal": "unknown",
                "timeline_signal": "unknown",
                "reasoning": "Could not analyze",
            }

    def log_contact(self, sender_email: str, sender_name: str, intent: str, lead_tier: str) -> dict:
        return {
            "contact_id": f"CRM-{uuid4().hex[:8].upper()}",
            "logged": True,
            "email": sender_email,
            "intent": intent,
            "tier": lead_tier,
        }
