from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.db.tenant_context_var import get_active_tenant_schema
from app.models.user import User


@dataclass
class TenantContext:
    organization_id: UUID | None
    schema_name: str | None = None

    def require_organization_id(self) -> UUID:
        if self.organization_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not associated with an organization",
            )
        return self.organization_id


async def get_tenant_context(
    current_user: User = Depends(get_current_user),
) -> TenantContext:
    schema_name = get_active_tenant_schema()
    return TenantContext(
        organization_id=current_user.organization_id,
        schema_name=schema_name,
    )
