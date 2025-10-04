"""Criacao usuario admin

Revision ID: ca0385904376
Revises: e92f306fd1e2
Create Date: 2025-09-28 21:48:22.254687
"""

import os
import time
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert as pg_insert

from db_core.security.passwords import hash_password


revision = 'ca0385904376'
down_revision = 'e92f306fd1e2'
branch_labels = None
depends_on = None

SCHEMA = os.getenv("DB_SCHEMA", "public")


def _users_table(conn) -> sa.Table:
    meta = sa.MetaData(schema=SCHEMA)
    return sa.Table("users", meta, autoload_with=conn, schema=SCHEMA)


def upgrade() -> None:
    conn = op.get_bind()
    users = _users_table(conn)
    now = int(time.time())

    email = (os.getenv("ADMIN_EMAIL", "admin@example.com") or "").strip().lower()
    name = os.getenv("ADMIN_NAME", "Administrador")

    password = hash_password(os.getenv("ADMIN_PASSWORD"))

    ins = pg_insert(users).values(
        email=email,
        name=name,
        password=password,
        is_admin=True,
        is_speaker=False,
        is_translator=False,
        created_at=now,
        updated_at=now,
    )

    set_on_update = {
        "name": ins.excluded.name,
        "is_admin": True,
        "is_speaker": False,
        "is_translator": False,
        "updated_at": now,
    }

    do_upsert = ins.on_conflict_do_update(
        index_elements=[users.c.email],
        set_=set_on_update,
    )
    conn.execute(do_upsert)


def downgrade() -> None:
    conn = op.get_bind()
    users = _users_table(conn)
    email = (os.getenv("ADMIN_EMAIL", "admin@example.com") or "").strip().lower()
    conn.execute(sa.delete(users).where(sa.func.lower(users.c.email) == email))

