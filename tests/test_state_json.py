"""Unit tests for JSON-safe agent state serialization."""

from langchain_core.messages import AIMessage, HumanMessage

from app.utils.state_json import state_json_safe


def test_state_json_safe_converts_human_message():
    state = {
        "run_id": "x",
        "messages": [HumanMessage(content="hello")],
        "status": "running",
    }
    safe = state_json_safe(state)
    assert safe["messages"][0]["type"] == "human"
    assert safe["messages"][0]["data"]["content"] == "hello"
    # Original state unchanged
    assert isinstance(state["messages"][0], HumanMessage)


def test_state_json_safe_preserves_plain_dict_messages():
    state = {"messages": [{"type": "human", "data": {"content": "x"}}], "run_id": "y"}
    safe = state_json_safe(state)
    assert safe["messages"] == state["messages"]


def test_state_json_safe_empty_messages():
    assert state_json_safe({"messages": []})["messages"] == []


def test_state_json_safe_first_message_not_base_message():
    state = {"messages": [AIMessage(content="hi")]}
    safe = state_json_safe(state)
    assert safe["messages"][0]["type"] == "ai"
