from __future__ import annotations

from importlib import import_module
from typing import Any

from fastapi import HTTPException, Request
from fastapi import FastAPI

from core.config import Settings


async def initialize_database(app: FastAPI, settings: Settings) -> None:
    app.state.mongo_client = None
    app.state.db = None
    app.state.db_error = None

    if not settings.mongodb_uri:
        app.state.db_error = "MONGODB_URI not configured"
        return

    try:
        motor_asyncio = import_module("motor.motor_asyncio")
        mongo_client_cls = getattr(motor_asyncio, "AsyncIOMotorClient")
    except ModuleNotFoundError as exc:
        app.state.db_error = f"motor dependency missing: {exc}"
        return

    client = mongo_client_cls(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
    )
    app.state.mongo_client = client
    app.state.db = client[settings.mongodb_db_name]

    try:
        await client.admin.command("ping")
    except Exception as exc:
        app.state.db_error = str(exc)


async def close_database(app: FastAPI) -> None:
    client: Any | None = getattr(app.state, "mongo_client", None)
    if client is not None:
        client.close()


def get_database(request: Request) -> Any:
    db: Any | None = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database is not configured")
    return db


def get_optional_database(request: Request) -> Any | None:
    return getattr(request.app.state, "db", None)


def get_database_error(request: Request) -> str | None:
    return getattr(request.app.state, "db_error", None)
