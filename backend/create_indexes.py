import asyncio
from sqlalchemy import text
from app.db.database import get_db

async def create_indexes():
    async for db in get_db():
        # Get schemas
        result = await db.execute(text("SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%'"))
        schemas = result.scalars().all()
        
        for schema in schemas:
            print(f"Creating indexes for schema {schema}")
            try:
                await db.execute(text(f"CREATE INDEX IF NOT EXISTS idx_delivery_pagination ON {schema}.delivery_bills (timestamp DESC, id DESC)"))
                await db.execute(text(f"CREATE INDEX IF NOT EXISTS idx_purchase_pagination ON {schema}.purchase_bills (created_at DESC, id DESC)"))
                await db.commit()
            except Exception as e:
                print(f"Error on {schema}: {e}")
                await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_indexes())
