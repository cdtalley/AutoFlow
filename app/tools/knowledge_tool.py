from app.utils.ollama_client import OllamaClient


class KnowledgeTool:
    FAQ_KNOWLEDGE_BASE = {
        "pricing": "Our plans start at $29/month for Starter, $79/month for Pro, and $199/month for Enterprise. Annual billing saves 20%.",
        "refund": "We offer a 30-day money-back guarantee on all plans. Contact billing@company.com to request a refund.",
        "integrations": "We integrate with Slack, Salesforce, HubSpot, Zapier, and 50+ other tools via our API.",
        "uptime": "We maintain 99.9% uptime SLA. Check status.company.com for live status.",
        "support": "Pro and Enterprise customers get 24/7 priority support. Starter customers get email support within 24 hours.",
        "security": "We are SOC 2 Type II certified. All data is encrypted at rest and in transit.",
        "trial": "Yes, we offer a 14-day free trial. No credit card required.",
        "cancellation": "You can cancel anytime from your account settings. No cancellation fees.",
        "api": "Full REST API access is included in Pro and Enterprise plans. API documentation at docs.company.com.",
        "data_export": "You can export all your data at any time from Settings > Data Export.",
    }

    def answer_faq(self, question: str, ollama_client: OllamaClient) -> str:
        context = "\n".join(f"- {k}: {v}" for k, v in self.FAQ_KNOWLEDGE_BASE.items())
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful customer support agent. Answer the user's question using ONLY the "
                    "provided FAQ knowledge base. If the answer is not in the FAQ, say 'I don't have that "
                    "information - let me connect you with a specialist.'"
                ),
            },
            {
                "role": "user",
                "content": f"FAQ Knowledge Base:\n{context}\n\nCustomer question: {question}",
            },
        ]
        return ollama_client.chat(messages)
