"""WebSocket fan-out per run_id (set on app lifespan)."""

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, run_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(run_id, []).append(websocket)

    def disconnect(self, run_id: str, websocket: WebSocket) -> None:
        if run_id not in self.active_connections:
            return
        if websocket in self.active_connections[run_id]:
            self.active_connections[run_id].remove(websocket)
        if not self.active_connections[run_id]:
            del self.active_connections[run_id]

    async def broadcast_to_run(self, run_id: str, message: dict) -> None:
        clients = self.active_connections.get(run_id, [])
        for ws in list(clients):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(run_id, ws)
