from datetime import datetime

from langgraph.graph import END, StateGraph

from app.agents.faq_agent import FAQAgent
from app.agents.handoff_agent import HandoffAgent
from app.agents.lead_agent import LeadAgent
from app.agents.support_agent import SupportAgent
from app.memory.thread_memory import get_checkpointer
from app.models.state import AgentState
from app.tools.crm_tool import CRMTool
from app.tools.email_tool import EmailTool
from app.tools.knowledge_tool import KnowledgeTool
from app.utils.ollama_client import OllamaClient

INTENT_CATEGORIES = [
    "general_inquiry",
    "faq",
    "sales",
    "pricing",
    "demo_request",
    "upgrade",
    "support",
    "bug_report",
    "complaint",
    "billing_issue",
]


def classify_intent_node(state: AgentState, ollama_client: OllamaClient) -> dict:
    latest = ""
    if state.get("messages"):
        latest = str(state["messages"][-1].content)
    text = f"{state['raw_input']}\n\n{latest}"
    result = ollama_client.classify(text, INTENT_CATEGORIES)
    step = {
        "agent": "orchestrator",
        "action": "classified_intent",
        "output": str(result),
        "timestamp": datetime.utcnow().isoformat(),
    }
    return {
        "intent": result.get("category", "general_inquiry"),
        "intent_confidence": float(result.get("confidence", 0.1)),
        "current_agent": "orchestrator",
        "agent_steps": state["agent_steps"] + [step],
    }


def route_by_intent(state: AgentState) -> str:
    intent = state.get("intent", "general_inquiry")
    if intent in ["general_inquiry", "faq"]:
        return "faq_node"
    if intent in ["sales", "pricing", "demo_request", "upgrade"]:
        return "lead_node"
    if intent in ["support", "bug_report", "complaint", "billing_issue"]:
        return "support_node"
    return "faq_node"


def route_after_agent(state: AgentState) -> str:
    return "handoff_node" if state.get("escalate") else "synthesize_response_node"


def build_graph(
    ollama_client: OllamaClient,
    faq_agent: FAQAgent,
    lead_agent: LeadAgent,
    support_agent: SupportAgent,
    handoff_agent: HandoffAgent,
    email_tool: EmailTool,
    knowledge_tool: KnowledgeTool,
    crm_tool: CRMTool,
):
    graph = StateGraph(AgentState)

    def classify_node(state: AgentState):
        return classify_intent_node(state, ollama_client)

    def faq_node(state: AgentState):
        return faq_agent.run(state, ollama_client, knowledge_tool)

    def lead_node(state: AgentState):
        return lead_agent.run(state, ollama_client, crm_tool, email_tool)

    def support_node(state: AgentState):
        return support_agent.run(state, ollama_client, email_tool)

    def handoff_node(state: AgentState):
        return handoff_agent.run(state, ollama_client)

    def synthesize_response_node(state: AgentState):
        final_response = state.get("final_response")
        if state.get("status") != "escalated":
            final_response = email_tool.draft_response(
                state["raw_input"], state.get("resolution_draft") or "", state["sender_name"], ollama_client
            )
        email_tool.send(
            state["sender_email"],
            f"Re: {state['raw_input'][:50]}",
            final_response or "",
        )
        return {
            "final_response": final_response,
            "status": state["status"] if state["status"] == "escalated" else "completed",
        }

    def log_audit_node(state: AgentState):
        return {"status": state["status"]}

    graph.add_node("classify_intent", classify_node)
    graph.add_node("faq_node", faq_node)
    graph.add_node("lead_node", lead_node)
    graph.add_node("support_node", support_node)
    graph.add_node("handoff_node", handoff_node)
    graph.add_node("synthesize_response_node", synthesize_response_node)
    graph.add_node("log_audit", log_audit_node)

    graph.set_entry_point("classify_intent")
    graph.add_conditional_edges("classify_intent", route_by_intent)
    graph.add_conditional_edges("faq_node", route_after_agent)
    graph.add_conditional_edges("lead_node", route_after_agent)
    graph.add_conditional_edges("support_node", route_after_agent)
    graph.add_edge("handoff_node", "synthesize_response_node")
    graph.add_edge("synthesize_response_node", "log_audit")
    graph.add_edge("log_audit", END)

    return graph.compile(checkpointer=get_checkpointer())
