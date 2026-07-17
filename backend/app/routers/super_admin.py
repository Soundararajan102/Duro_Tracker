import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_super_admin
from app.core.security import get_password_hash
from app.db.session import get_platform_db
from app.models import Organization, User
from app.models.enums import UserRole
from app.schemas.organization import OrganizationCreate, OrganizationOut
from app.schemas.user import UserCreate, UserOut

router = APIRouter(dependencies=[Depends(require_super_admin())])


@router.post("/organizations", response_model=OrganizationOut)
async def create_organization(
    org_in: OrganizationCreate,
    db: AsyncSession = Depends(get_platform_db),
):
    org = Organization(name=org_in.name, max_users=org_in.max_users)
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/organizations", response_model=list[OrganizationOut])
async def list_organizations(
    db: AsyncSession = Depends(get_platform_db),
):
    result = await db.scalars(select(Organization))
    return result.all()


@router.post("/organizations/{org_id}/admins", response_model=UserOut)
async def create_tenant_admin(
    org_id: uuid.UUID,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_platform_db),
):
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Check if username exists globally (since usernames must be unique per org, and platform is global)
    # Actually, the unique constraint is on (username, org_id) and (username) for platform.
    # To be safe, we just check within the org.
    existing = await db.scalar(
        select(User).where(User.username == user_in.username, User.organization_id == org_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists in this organization")

    user = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.TENANT_ADMIN,
        organization_id=org_id,
        is_active=user_in.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
