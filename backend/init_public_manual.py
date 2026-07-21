import asyncio
import asyncpg

async def init_db():
    conn = await asyncpg.connect('postgresql://postgres:root@localhost:5432/Duro_Tracker')
    
    # 1. Create organizations
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            max_users INTEGER NOT NULL DEFAULT 5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )
    ''')
    
    # 2. Create userrole enum
    try:
        await conn.execute("CREATE TYPE userrole AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'DRIVER')")
    except Exception:
        pass
        
    # 3. Create users
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role userrole NOT NULL,
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_login_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )
    ''')
    await conn.close()
    print('Tables created manually!')

asyncio.run(init_db())
