import asyncio
import asyncpg

async def reset():
    print('Connecting to default postgres db...')
    conn = await asyncpg.connect('postgresql://postgres:root@localhost:5432/postgres')
    print('Terminating connections to Duro_Tracker...')
    await conn.execute('''
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'Duro_Tracker'
          AND pid <> pg_backend_pid();
    ''')
    print('Dropping Duro_Tracker...')
    await conn.execute('DROP DATABASE IF EXISTS "Duro_Tracker";')
    print('Creating Duro_Tracker...')
    await conn.execute('CREATE DATABASE "Duro_Tracker";')
    await conn.close()
    print('Database reset complete!')

asyncio.run(reset())
