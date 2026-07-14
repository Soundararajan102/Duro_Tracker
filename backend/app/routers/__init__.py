from fastapi import APIRouter
from . import auth, super_admin, admin, driver, dashboard, purchase

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(driver.router, prefix="/driver", tags=["driver"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(purchase.router, prefix="/purchase", tags=["purchase"])
