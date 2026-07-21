import asyncio
from sqlalchemy import select, text
from app.db.database import get_session_local, engine
from app.models import Organization

async def main():
    async with get_session_local()() as db:
        org_id = '019f7de0-42e6-76f7-8583-9cefd078930d'
        org = await db.get(Organization, org_id)
        if org:
            schema_name = f'tenant_{org_id.replace("-", "")}'
            from app.db.tenant_metadata import drop_tenant_schema
            await db.run_sync(drop_tenant_schema, schema_name)
            await db.delete(org)
            await db.commit()
            print('Deleted successfully')
        else:
            print('Org not found')

if __name__ == '__main__':
    asyncio.run(main())
