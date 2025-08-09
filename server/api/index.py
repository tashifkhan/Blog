# Vercel Python entrypoint for FastAPI app
import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Import the app from server/main.py
try:
    from ..main import app as fastapi_app  # type: ignore

except Exception:
    # Fallback: create a minimal app to surface errors
    fastapi_app = FastAPI(title="Blog Backend API - Fallback")

    @fastapi_app.get("/")
    def _fallback() -> Any:
        return {"error": "Failed to import main.app"}


# Wrap for serverless
handler = Mangum(fastapi_app)

# Local dev path (optional)
app = fastapi_app
