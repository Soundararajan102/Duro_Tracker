import asyncio
import asyncpg

async def reset():
    conn = await asyncpg.connect('postgresql://postgres:root@localhost:5432/Duro_Tracker')
    await conn.execute('DROP SCHEMA public CASCADE;')
    await conn.execute('CREATE SCHEMA public;')
    await conn.close()
    print('Public schema reset!')

asyncio.run(reset())
