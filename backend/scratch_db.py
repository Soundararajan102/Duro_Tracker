import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:root@localhost:5432/Duro_Tracker")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS public;"))
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS tenant;"))
        await conn.execute(text("SET search_path TO public;"))
        print("Schemas created.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
