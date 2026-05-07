from app.agents.orchestrator import classify_intent_node, route_after_agent, route_by_intent


class DummyOllama:
    def classify(self, text: str, categories: list[str]):
        return {"category": "sales", "confidence": 0.88, "reasoning": "sales language"}


def test_intent_classification():
    state = {
        "run_id": "r1",
        "messages": [],
        "raw_input": "Need a product demo for our team",
        "sender_name": "A",
        "sender_email": "a@example.com",
        "intent": "",
        "intent_confidence": 0.0,
        "lead_score": None,
        "lead_tier": None,
        "resolution_draft": None,
        "escalate": False,
        "escalation_reason": None,
        "current_agent": "orchestrator",
        "agent_steps": [],
        "final_response": None,
        "status": "running",
        "error": None,
    }
    result = classify_intent_node(state, DummyOllama())
    assert result["intent"] in ["sales", "pricing", "demo_request", "upgrade"]


def test_routing_faq():
    assert route_by_intent({"intent": "general_inquiry"}) == "faq_node"


def test_routing_sales():
    assert route_by_intent({"intent": "sales"}) == "lead_node"


def test_routing_support():
    assert route_by_intent({"intent": "complaint"}) == "support_node"


def test_escalation_routing():
    assert route_after_agent({"escalate": True}) == "handoff_node"
