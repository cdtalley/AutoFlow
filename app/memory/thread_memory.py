from langgraph.checkpoint.memory import MemorySaver

CHECKPOINTER = MemorySaver()


def get_checkpointer() -> MemorySaver:
    return CHECKPOINTER
