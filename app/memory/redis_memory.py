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
