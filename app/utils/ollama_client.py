import json
import time
from typing import Any

import requests


class OllamaConnectionError(Exception):
    pass


class OllamaClient:
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def chat(self, messages: list[dict], temperature: float = 0.1, json_mode: bool = False) -> str:
        url = f"{self.base_url}/api/chat"
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if json_mode:
            payload["format"] = "json"

        last_error: Exception | None = None
        for _ in range(3):
            try:
                response = requests.post(url, json=payload, timeout=60)
                response.raise_for_status()
                return response.json()["message"]["content"]
            except Exception as exc:
                last_error = exc
                time.sleep(2)

        raise OllamaConnectionError(
            f"Ollama not reachable at {self.base_url}. Run: ollama serve"
        ) from last_error

    def health_check(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def classify(self, text: str, categories: list[str]) -> dict:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a text classifier. Return JSON only: "
                    '{"category": "<one of the provided categories>", '
                    '"confidence": <float 0.0-1.0>, '
                    '"reasoning": "<one sentence>"}'
                ),
            },
            {
                "role": "user",
                "content": f"Categories: {categories}\n\nText to classify:\n{text}",
            },
        ]
        try:
            raw = self.chat(messages, json_mode=True)
            parsed = json.loads(raw)
            return {
                "category": str(parsed.get("category", categories[0])),
                "confidence": float(parsed.get("confidence", 0.1)),
                "reasoning": str(parsed.get("reasoning", "classification failed")),
            }
        except Exception:
            return {
                "category": categories[0],
                "confidence": 0.1,
                "reasoning": "classification failed",
            }
