from sqlalchemy import create_engine, text
from app.core.config import Settings

settings = Settings()
db_url = settings.database_url.replace("+asyncpg", "")
engine = create_engine(db_url)

with engine.connect() as conn:
    res = conn.execute(text("SELECT id, name, hsn_code, gst_percent FROM tenant_019f79f2bab07117a273386d17858a3a.items limit 5"))
    print("DB items:")
    for row in res:
        print(row)
