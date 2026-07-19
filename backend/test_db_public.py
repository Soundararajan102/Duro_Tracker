import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import Settings
from sqlalchemy import text

async def main():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT * FROM public.alembic_version"))
        print("Public Alembic version:")
        for row in result.fetchall():
            print(row)
            
    await engine.dispose()

asyncio.run(main())
