import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import Settings

async def deploy():
    settings = Settings()
    engine = create_async_engine(settings.database_url)
    
    async with engine.connect() as conn:
        # Get all tenant schemas
        schemas_result = await conn.execute(
            text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'")
        )
        schemas = [row[0] for row in schemas_result.fetchall()]
        
        print("Starting constraint deployment...")
        
        for schema in schemas:
            print(f"Deploying to schema: {schema}")
            
            # 1. items (current_full >= 0, current_empty >= 0)
            await conn.execute(text(f'ALTER TABLE "{schema}".items ADD CONSTRAINT chk_item_full_positive CHECK (current_full >= 0) NOT VALID;'))
            await conn.execute(text(f'ALTER TABLE "{schema}".items ADD CONSTRAINT chk_item_empty_positive CHECK (current_empty >= 0) NOT VALID;'))
            
            # 2. buyer_inventory (cylinders_pending >= 0)
            await conn.execute(text(f'ALTER TABLE "{schema}".buyer_inventory ADD CONSTRAINT chk_buyer_inv_positive CHECK (cylinders_pending >= 0) NOT VALID;'))
            
            # 3. provider_inventory (cylinders_pending >= 0)
            await conn.execute(text(f'ALTER TABLE "{schema}".provider_inventory ADD CONSTRAINT chk_provider_inv_positive CHECK (cylinders_pending >= 0) NOT VALID;'))
            
            await conn.commit()
            print(f"Added NOT VALID constraints to {schema}")
            
            # Now VALIDATE them
            print(f"Validating constraints for {schema}...")
            await conn.execute(text(f'ALTER TABLE "{schema}".items VALIDATE CONSTRAINT chk_item_full_positive;'))
            await conn.execute(text(f'ALTER TABLE "{schema}".items VALIDATE CONSTRAINT chk_item_empty_positive;'))
            await conn.execute(text(f'ALTER TABLE "{schema}".buyer_inventory VALIDATE CONSTRAINT chk_buyer_inv_positive;'))
            await conn.execute(text(f'ALTER TABLE "{schema}".provider_inventory VALIDATE CONSTRAINT chk_provider_inv_positive;'))
            
            await conn.commit()
            print(f"Constraints validated for {schema}")
            
        print("Constraint deployment completed successfully!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(deploy())
