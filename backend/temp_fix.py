import asyncio
import asyncpg

async def fix():
    conn = await asyncpg.connect('postgresql://postgres:root@localhost:5432/Duro_Tracker')
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS public.alembic_version (
            version_num VARCHAR(32) NOT NULL, 
            CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
        );
    ''')
    await conn.close()
    print('alembic_version created')

asyncio.run(fix())
