"""Vercel Python entrypoint for FastAPI app.

Exposes a FastAPI `app` that Vercel's Python runtime can serve.
"""

from typing import Any
from pathlib import Path
import sys

from fastapi import FastAPI

# Ensure the parent directory (server/) is on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    # Import FastAPI instance from main.py at server/main.py
    from main import app as app  # type: ignore
except Exception:
    # Fallback app to surface import errors in deployment logs
    app = FastAPI(title="Blog Backend API - Import Error")

    @app.get("/")
    def _fallback() -> Any:
        return {"error": "Failed to import app from main.py"}
