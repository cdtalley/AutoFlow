"""Consistent API errors and safe 500 responses."""

import logging
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import get_settings

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    rid = _request_id(request)
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Request body or parameters failed validation",
            "details": jsonable_encoder(exc.errors()),
            "request_id": rid,
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = _request_id(request)
    logger.exception("Unhandled error request_id=%s", rid)
    settings = get_settings()
    if settings.APP_ENV == "development":
        message = str(exc)
    else:
        message = "An unexpected error occurred. Use request_id when contacting support."
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": message, "request_id": rid},
    )
