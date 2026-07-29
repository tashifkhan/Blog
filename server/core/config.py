from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_ALLOWED_ORIGINS = [
    "https://*.tashif.codes",
    "https://blog.tashif.codes",
    "https://tashif.codes",
    "http://localhost:4321",
]


def _default_project_root() -> Path:
    current_file = Path(__file__).resolve()
    server_dir = current_file.parents[1]
    if server_dir.name == "server":
        return current_file.parents[2]
    return server_dir


class Settings(BaseSettings):
    # Anchored to the project root rather than the process CWD, which differs
    # between `uvicorn server.main:app` locally and the Vercel function runtime.
    model_config = SettingsConfigDict(
        env_file=_default_project_root() / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Blog Backend API"
    app_version: str = "2.0.0"
    app_description: str = (
        "Modular FastAPI backend for blog analytics and content APIs. "
        "Includes views, likes, threaded comments, metadata listing, and full markdown retrieval."
    )

    mongodb_uri: str | None = Field(default=None, alias="MONGODB_URI")
    mongodb_db_name: str = Field(default="Blog", alias="MONGODB_DB_NAME")
    mongo_server_selection_timeout_ms: int = Field(
        default=4000,
        alias="MONGO_SERVER_SELECTION_TIMEOUT_MS",
    )

    views_window_seconds: int = Field(default=3600, alias="VIEWS_WINDOW_SECONDS")

    # Salt for hashing viewer IPs before storing them as view-dedup keys.
    # Set VIEWER_HASH_SALT in the environment; the default keeps dedup working
    # in local development without persisting plaintext addresses.
    viewer_hash_salt: str = Field(
        default="blog-views-local-salt", alias="VIEWER_HASH_SALT"
    )

    allowed_origins: list[str] = Field(
        default_factory=lambda: DEFAULT_ALLOWED_ORIGINS.copy(),
        alias="ALLOWED_ORIGINS",
    )

    project_root: Path = Field(
        default_factory=_default_project_root,
        alias="PROJECT_ROOT",
    )
    blogs_dir: Path | None = Field(default=None, alias="BLOGS_DIR")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> list[str]:
        if value is None:
            return DEFAULT_ALLOWED_ORIGINS.copy()

        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]

        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return DEFAULT_ALLOWED_ORIGINS.copy()

            if stripped.startswith("[") and stripped.endswith("]"):
                stripped = stripped[1:-1]

            parsed = [
                part.strip().strip('"').strip("'") for part in stripped.split(",")
            ]
            result = [item for item in parsed if item]
            return result or DEFAULT_ALLOWED_ORIGINS.copy()

        return DEFAULT_ALLOWED_ORIGINS.copy()

    @property
    def resolved_blogs_dir(self) -> Path:
        return self.blogs_dir or (self.project_root / "src" / "blogs")

    @property
    def exact_allowed_origins(self) -> list[str]:
        """Origins without a wildcard, usable directly as CORS allow_origins."""
        return [origin for origin in self.allowed_origins if "*" not in origin]

    @property
    def allowed_origin_regex(self) -> str | None:
        """
        Wildcard origins compiled into a single regex.

        Starlette compares allow_origins by exact string match, so an entry like
        "https://*.tashif.codes" never matches any request. Wildcard entries are
        translated here and passed as allow_origin_regex instead.
        """
        patterns = [
            re.escape(origin).replace(r"\*", r"[^.]+")
            for origin in self.allowed_origins
            if "*" in origin
        ]
        if not patterns:
            return None
        return "|".join(f"^{pattern}$" for pattern in patterns)


@lru_cache
def get_settings() -> Settings:
    return Settings()
