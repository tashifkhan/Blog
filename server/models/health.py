from pydantic import BaseModel


class HealthEnv(BaseModel):
    MONGODB_URI: bool


class HealthMongo(BaseModel):
    ok: bool
    error: str | None = None


class HealthResponse(BaseModel):
    ok: bool
    runtime: str
    env: HealthEnv
    mongo: HealthMongo
