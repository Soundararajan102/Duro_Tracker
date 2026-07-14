"""Tenant-only SQLAlchemy metadata tools."""

from __future__ import annotations
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import Enum as SAEnum
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.engine import Connection


@contextmanager
def _reuse_public_pg_enums(connection: Connection) -> Iterator[None]:
    if connection.dialect.name != "postgresql":
        yield
        return

    from app.db.database import Base

    original_schemas = {}
    for table in Base.metadata.tables.values():
        if table.schema != "tenant":
            continue
        for column in table.columns:
            if isinstance(column.type, SAEnum) and column.type.name:
                original_schemas[column.type.name] = column.type.schema
                column.type.schema = "public"
                if isinstance(column.type.dialect_impl(connection.dialect), PG_ENUM):
                    column.type.create_type = False
    try:
        yield
    finally:
        for table in Base.metadata.tables.values():
            if table.schema != "tenant":
                continue
            for column in table.columns:
                if isinstance(column.type, SAEnum) and column.type.name:
                    column.type.schema = original_schemas.get(column.type.name)
                    column.type.create_type = True


def create_tenant_schema_and_tables(connection: Connection, schema_name: str) -> None:
    from app.db.database import Base

    safe = schema_name.replace('"', "")
    connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{safe}"'))
    
    # We must explicitly set search_path so Enum types and tables resolve properly
    connection.execute(text(f'SET search_path TO "{safe}", public'))

    with _reuse_public_pg_enums(connection):
        tables = [t for t in Base.metadata.tables.values() if t.schema == "tenant"]
        Base.metadata.create_all(connection, tables=tables)


def drop_tenant_schema(connection: Connection, schema_name: str) -> None:
    safe = schema_name.replace('"', "")
    connection.execute(text(f'DROP SCHEMA IF EXISTS "{safe}" CASCADE'))
