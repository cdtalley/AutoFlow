"""Serialize agent state for JSON (Redis, WebSockets)."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import BaseMessage, messages_to_dict


def state_json_safe(state: dict[str, Any]) -> dict[str, Any]:
    """Copy state so LangChain messages become plain dicts (JSON-serializable)."""
    out = dict(state)
    msgs = out.get("messages")
    if msgs and isinstance(msgs, list) and msgs and isinstance(msgs[0], BaseMessage):
        out["messages"] = messages_to_dict(msgs)
    return out
