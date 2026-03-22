from __future__ import annotations

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


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
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

    allowed_origins: list[str] = Field(
        default_factory=lambda: DEFAULT_ALLOWED_ORIGINS.copy(),
        alias="ALLOWED_ORIGINS",
    )

    project_root: Path = Field(
        default=Path(__file__).resolve().parents[2], alias="PROJECT_ROOT"
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
