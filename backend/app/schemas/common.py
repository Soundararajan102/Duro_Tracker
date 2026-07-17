from pydantic import BaseModel, Field


class APIErrorDetail(BaseModel):
    code: str
    message: str
    details: dict | list | str | None = None


class APIErrorResponse(BaseModel):
    error: APIErrorDetail = Field(
        ...,
        description="Structured error response payload",
    )
