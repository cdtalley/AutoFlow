import hashlib
import json

import redis


class RedisMemory:
    def __init__(self, redis_url: str):
        self.client = redis.Redis.from_url(redis_url, decode_responses=True)

    def set_run_state(self, run_id: str, state: dict, ttl_seconds: int = 3600):
        key = f"autoflow:run:{run_id}"
        self.client.set(key, json.dumps(state), ex=ttl_seconds)

    def get_run_state(self, run_id: str) -> dict | None:
        key = f"autoflow:run:{run_id}"
        data = self.client.get(key)
        if not data:
            return None
        return json.loads(data)

    def append_step(self, run_id: str, step: dict):
        key = f"autoflow:steps:{run_id}"
        self.client.rpush(key, json.dumps(step))

    def get_steps(self, run_id: str) -> list[dict]:
        key = f"autoflow:steps:{run_id}"
        values = self.client.lrange(key, 0, -1)
        return [json.loads(v) for v in values]

    def health_check(self) -> bool:
        try:
            return bool(self.client.ping())
        except Exception:
            return False

    @staticmethod
    def _idempotency_redis_key(client_key: str) -> str:
        digest = hashlib.sha256(client_key.encode("utf-8")).hexdigest()
        return f"autoflow:idempotency:{digest}"

    def get_idempotent_run_id(self, client_key: str) -> str | None:
        return self.client.get(self._idempotency_redis_key(client_key))

    def claim_idempotent_run_id(self, client_key: str, run_id: str, ttl_seconds: int) -> bool:
        """Return True if this server won the key and should enqueue work for run_id."""
        key = self._idempotency_redis_key(client_key)
        return bool(self.client.set(key, run_id, nx=True, ex=ttl_seconds))

    def delete_run_keys(self, run_id: str) -> None:
        self.client.delete(f"autoflow:run:{run_id}")
        self.client.delete(f"autoflow:steps:{run_id}")
