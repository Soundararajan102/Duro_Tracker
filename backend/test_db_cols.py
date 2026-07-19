import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import Settings
from sqlalchemy import text

async def main():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'tenant_019f79f2bab07117a273386d17858a3a' AND table_name = 'purchase_bills'"))
        print("Columns in purchase_bills:")
        for row in result.fetchall():
            print(row[0])
            
    await engine.dispose()

asyncio.run(main())
