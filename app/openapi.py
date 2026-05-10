"""OpenAPI metadata for client generators and catalog screenshots."""

from fastapi.openapi.utils import get_openapi


def build_openapi_schema(app) -> dict:
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["WebhookApiKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key",
        "description": "Required when `WEBHOOK_API_KEY` is set on the server.",
    }
    schema["components"]["securitySchemes"]["AdminApiKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Admin-Key",
        "description": "Required for `DELETE /runs/{run_id}` when `AUTOFLOW_ADMIN_API_KEY` is set.",
    }
    schema["components"]["securitySchemes"]["IdempotencyKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "Idempotency-Key",
        "description": "Optional. Same key + same URL within TTL returns the original `run_id` without duplicating work.",
    }
    return schema
