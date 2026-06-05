from app.agents.orchestrator import route_after_agent, route_by_intent


def test_route_by_intent_eval_set() -> None:
    """Regression gate: intent categories must map to the expected specialist node."""
    eval_set = [
        ("general_inquiry", "faq_node"),
        ("faq", "faq_node"),
        ("sales", "lead_node"),
        ("pricing", "lead_node"),
        ("demo_request", "lead_node"),
        ("upgrade", "lead_node"),
        ("support", "support_node"),
        ("bug_report", "support_node"),
        ("complaint", "support_node"),
        ("billing_issue", "support_node"),
        ("unknown_intent", "faq_node"),
    ]
    for intent, expected_node in eval_set:
        assert route_by_intent({"intent": intent}) == expected_node


def test_route_after_agent_eval_set() -> None:
    """Regression gate: escalation flag must deterministically control handoff."""
    assert route_after_agent({"escalate": True}) == "handoff_node"
    assert route_after_agent({"escalate": False}) == "synthesize_response_node"
