from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_access_token, verify_password
from app.db.session import get_platform_db
from app.models.user import User
from app.schemas.auth import Token

router = APIRouter()
settings = Settings()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_platform_db),
) -> Token:
    # First find the user globally across all tenants and platform
    # Since username is unique per org, and platform users have org=null,
    # we just fetch by username. Wait, if multiple orgs have the same username,
    # this query might return multiple users!
    # A standard OAuth2 form only takes username and password. 
    # For a B2B SaaS, it's safer if usernames are globally unique or the user inputs an org slug.
    # We will assume usernames are unique per org but we'll fetch the first matching user that matches the password.
    
    users = await db.scalars(select(User).where(User.username == form_data.username))
    valid_user = None
    for u in users:
        if verify_password(form_data.password, u.password_hash):
            valid_user = u
            break
            
    if not valid_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not valid_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    access_token = create_access_token(
        subject=valid_user.id,
        role=valid_user.role,
        org_id=valid_user.organization_id,
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")
