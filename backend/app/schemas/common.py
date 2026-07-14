from pydantic import BaseModel, Field


class APIErrorDetail(BaseModel):
    loc: list[str] | None = None
    msg: str
    type: str


class APIErrorResponse(BaseModel):
    detail: str | list[APIErrorDetail] = Field(
        ...,
        description="Either a single string error message or a list of validation errors.",
    )
