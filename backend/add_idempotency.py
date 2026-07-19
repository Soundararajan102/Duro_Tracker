from sqlalchemy import create_engine, text
from app.core.config import Settings

def main():
    settings = Settings()
    db_url = settings.database_url.replace("+asyncpg", "")
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT schema_name FROM information_schema.schemata"))
        schemas = [row[0] for row in result.fetchall() if row[0].startswith("tenant_")]
        
        for schema in schemas:
            try:
                conn.execute(text(f"ALTER TABLE {schema}.purchase_bills ADD COLUMN idempotency_key VARCHAR(255) UNIQUE"))
                conn.commit()
                print("Success")
            except Exception as e:
                conn.rollback()
                print(f"Error (maybe exists): {e}")

if __name__ == "__main__":
    main()
