from __future__ import annotations

import logging
import os

from fastapi import APIRouter, Request

from ..core.database import get_database_error, get_optional_database
from ..models.health import HealthEnv, HealthMongo, HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns runtime and database connectivity diagnostics. "
        "Useful for local checks and deployment readiness probes."
    ),
)
async def health(request: Request) -> HealthResponse:
    runtime = os.getenv("PYTHON_VERSION", "python")
    db = get_optional_database(request)

    mongo_ok = False
    mongo_error = get_database_error(request)

    if db is not None:
        try:
            await db.command("ping")
            mongo_ok = True
            mongo_error = None
        except Exception as exc:
            # Driver errors embed the connection string / cluster hostnames, so
            # log the detail server-side and return only the exception type.
            logger.warning("Mongo health check failed", exc_info=True)
            mongo_error = type(exc).__name__

    return HealthResponse(
        ok=True,
        runtime=runtime,
        env=HealthEnv(MONGODB_URI=db is not None),
        mongo=HealthMongo(ok=mongo_ok, error=mongo_error),
    )
