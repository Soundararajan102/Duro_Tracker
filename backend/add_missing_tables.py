import asyncio
from sqlalchemy import text
from app.db.database import get_engine, Base

async def main():
    import app.models
    engine = get_engine()
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT id FROM public.organizations'))
        org_ids = [row[0] for row in result.fetchall()]
        
        for org_id in org_ids:
            schema_name = f'tenant_{str(org_id).replace("-", "")}'
            print(f'Adding missing tables for {schema_name}...')
            
            # ensure schema exists first
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
            
            def create_tables(connection):
                from app.db.tenant_metadata import _reuse_public_pg_enums
                with _reuse_public_pg_enums(connection):
                    tables = [t for t in Base.metadata.tables.values() if t.schema == 'tenant']
                    connection_with_opts = connection.execution_options(schema_translate_map={'tenant': schema_name})
                    Base.metadata.create_all(connection_with_opts, tables=tables)
                    
            await conn.run_sync(create_tables)
            print(f'Finished {schema_name}.')

if __name__ == '__main__':
    asyncio.run(main())
