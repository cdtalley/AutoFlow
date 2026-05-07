import logging
from datetime import datetime

from app.utils.ollama_client import OllamaClient

logger = logging.getLogger(__name__)


class EmailTool:
    def draft_response(self, inquiry: str, resolution: str, sender_name: str, ollama_client: OllamaClient) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a professional customer success manager writing an email response. "
                    f"Write a clear, friendly, concise email. Use the provided resolution information. "
                    f"Start with 'Hi {sender_name},' and end with a professional sign-off from "
                    "'The AutoFlow Team'."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Customer inquiry:\n{inquiry}\n\nResolution information:\n{resolution}\n\n"
                    "Write the full email response."
                ),
            },
        ]
        return ollama_client.chat(messages)

    def send(self, to_email: str, subject: str, body: str) -> dict:
        logger.info("[EMAIL SENT] To: %s | Subject: %s", to_email, subject)
        return {
            "sent": True,
            "to": to_email,
            "subject": subject,
            "simulated": True,
            "timestamp": datetime.utcnow().isoformat(),
        }
