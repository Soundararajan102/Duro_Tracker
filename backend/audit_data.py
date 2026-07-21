import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from app.core.config import Settings

async def main():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    
    async with engine.connect() as conn:
        # Get all tenant schemas
        schemas_result = await conn.execute(
            text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'")
        )
        schemas = [row[0] for row in schemas_result.fetchall()]
        
        has_errors = False
        print("Starting pre-scan audit for negative values...")
        
        for schema in schemas:
            print(f"Scanning schema: {schema}")
            
            # Check items
            items = await conn.execute(text(f'SELECT id, name, current_full, current_empty FROM "{schema}".items WHERE current_full < 0 OR current_empty < 0'))
            for row in items.fetchall():
                print(f"  [ERROR] Item {row[1]} ({row[0]}) has negative inventory: full={row[2]}, empty={row[3]}")
                has_errors = True
                
            # Check buyer_inventory
            buyer_inv = await conn.execute(text(f'SELECT id, buyer_id, item_id, cylinders_pending FROM "{schema}".buyer_inventory WHERE cylinders_pending < 0'))
            for row in buyer_inv.fetchall():
                print(f"  [ERROR] Buyer Inventory {row[0]} has negative pending: {row[3]}")
                has_errors = True
                
            # Check provider_inventory
            provider_inv = await conn.execute(text(f'SELECT id, provider_id, item_id, cylinders_pending FROM "{schema}".provider_inventory WHERE cylinders_pending < 0'))
            for row in provider_inv.fetchall():
                print(f"  [ERROR] Provider Inventory {row[0]} has negative pending: {row[3]}")
                has_errors = True
                
        if not has_errors:
            print("Audit completed successfully. No negative values found! Safe to proceed with constraint deployment.")
        else:
            print("Audit failed! Negative values found. Do NOT deploy constraints until these are manually fixed.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
