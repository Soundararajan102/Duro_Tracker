from fastapi import APIRouter
from pydantic import BaseModel

readiness_router = APIRouter()

class HealthCheck(BaseModel):
    status: str

@readiness_router.get("/health", response_model=HealthCheck)
async def health_check():
    return {"status": "ok"}
