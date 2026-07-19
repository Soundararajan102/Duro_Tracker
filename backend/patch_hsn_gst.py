import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import Settings
from sqlalchemy import text

async def patch_tenants():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    
    async with engine.connect() as conn:
        # Get all schemas
        result = await conn.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'"))
        schemas = [row[0] for row in result.fetchall()]
        
        for schema in schemas:
            print(f"Patching schema {schema}...")
            try:
                await conn.execute(text(f"ALTER TABLE {schema}.items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50)"))
                await conn.execute(text(f"ALTER TABLE {schema}.items ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5, 2)"))
                print(f"Successfully patched {schema}")
            except Exception as e:
                print(f"Error patching {schema}: {e}")
        
        await conn.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(patch_tenants())
