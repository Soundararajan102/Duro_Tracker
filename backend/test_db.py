import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import Settings
from sqlalchemy import text

async def main():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_019f79f2bab07117a273386d17858a3a'"))
        print("Tables in tenant schema:")
        for row in result.fetchall():
            print(row[0])
            
        result = await conn.execute(text("SELECT * FROM tenant_019f79f2bab07117a273386d17858a3a.alembic_version"))
        print("Alembic version:")
        for row in result.fetchall():
            print(row)
            
    await engine.dispose()

asyncio.run(main())
