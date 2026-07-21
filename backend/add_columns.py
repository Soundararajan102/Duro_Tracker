import asyncio
from sqlalchemy import text
from app.db.database import get_engine

async def main():
    engine = get_engine()
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT id FROM public.organizations'))
        org_ids = [row[0] for row in result.fetchall()]
        
        for org_id in org_ids:
            schema_name = f'tenant_{str(org_id).replace("-", "")}'
            print(f'Adding bill_number to {schema_name}...')
            
            try:
                await conn.execute(text(f'ALTER TABLE {schema_name}.delivery_bills ADD COLUMN IF NOT EXISTS bill_number VARCHAR(50);'))
                await conn.execute(text(f'CREATE UNIQUE INDEX IF NOT EXISTS ix_{schema_name}_delivery_bills_bill_number ON {schema_name}.delivery_bills (bill_number);'))
                print(f'Success for {schema_name}')
            except Exception as e:
                print(f'Error for {schema_name}: {e}')

if __name__ == '__main__':
    asyncio.run(main())
