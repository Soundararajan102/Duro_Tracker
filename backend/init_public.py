import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.database import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.enums import UserRole

async def init_public():
    engine = create_async_engine('postgresql+asyncpg://postgres:root@localhost:5432/Duro_Tracker')
    async with engine.begin() as conn:
        print('Creating public tables...')
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print('Public tables created!')

asyncio.run(init_public())
