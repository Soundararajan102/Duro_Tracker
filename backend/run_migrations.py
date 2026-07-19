import os
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command
from app.db.tenant_schema import build_schema_name
from app.core.config import Settings

def main():
    settings = Settings()
    # The URL from settings is likely postgresql+asyncpg, we need synchronous psycopg2
    db_url = settings.database_url.replace("+asyncpg", "")
    engine = create_engine(db_url)
    
    # Get active tenants
    tenant_schemas = []
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id FROM public.organizations"))
        tenant_schemas = [build_schema_name(row[0]) for row in result.fetchall()]

    # Upgrade public schema
    print("Upgrading public schema...")
    os.environ["ALEMBIC_MODE"] = "public"
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    
    # Upgrade tenant schemas
    for schema in tenant_schemas:
        print(f"Upgrading tenant schema: {schema}")
        os.environ["ALEMBIC_MODE"] = "tenant_upgrade"
        os.environ["CURRENT_TENANT"] = schema
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")

if __name__ == "__main__":
    main()
