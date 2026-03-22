from pydantic import BaseModel, Field


class ViewsResponse(BaseModel):
    views: int = Field(ge=0)


class LikesResponse(BaseModel):
    likes: int = Field(ge=0)
