from __future__ import annotations
import os
import sys
from pathlib import Path
from logging.config import fileConfig
from alembic import context
from sqlalchemy import create_engine, pool, text
from db_core.models import Base
import re
import db_core.models.room  # noqa: F401
import db_core.models.translator    # noqa: F401
import db_core.models.language  # noqa: F401
import db_core.models.speaker   # noqa: F401
import db_core.models.language_room_user  # noqa: F401
import db_core.models.user  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

project_root = Path(__file__).resolve().parents[1]
libs_dir = project_root / "libs"

for p in (str(libs_dir), str(libs_dir / "db_core"), str(project_root)):
    if p not in sys.path:
        sys.path.insert(0, p)

def _pick_database_url() -> str:
    url = (
        os.getenv("DATABASE_URL_PGBOUNCER")
        or os.getenv("DATABASE_URL_DIRECT")
        or os.getenv("DATABASE_URL")
        or config.get_main_option("sqlalchemy.url")
        or ""
    ).strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL (ou *_PGBOUNCER/_DIRECT) não definido e sqlalchemy.url vazio no alembic.ini"
        )
    url = re.sub(r"^postgres://", "postgresql://", url)
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        try:
            import psycopg  # noqa: F401
            driver = "psycopg"
        except Exception:
            driver = "psycopg2"
        url = url.replace("postgresql://", f"postgresql+{driver}://", 1)
    return url

database_url = _pick_database_url()
db_schema = (os.getenv("DB_SCHEMA") or "public").strip() or "public"

config.set_main_option("sqlalchemy.url", database_url or "")
config.set_main_option("DB_SCHEMA", db_schema)

target_metadata = Base.metadata

def _include_object(obj, name, type_, reflected, compare_to):
    obj_schema = getattr(obj, "schema", None) or getattr(getattr(obj, "table", None), "schema", None)
    if obj_schema and obj_schema != db_schema:
        return False
    return True

def _process_revision_directives(context, revision, directives):
    if getattr(context.config.cmd_opts, "autogenerate", False):
        script = directives[0]
        if script.upgrade_ops.is_empty():
            directives[:] = []

def run_migrations_offline():
    url = database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        include_object=_include_object,
        version_table="alembic_version",
        version_table_schema=db_schema,
        render_as_batch=False,
        process_revision_directives=_process_revision_directives,
        default_schema_name=db_schema,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = create_engine(database_url, poolclass=pool.NullPool, future=True)

    with connectable.begin() as connection:
        connection.execute(text(f'SET LOCAL search_path TO "{db_schema}"'))

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True,
            include_object=_include_object,
            version_table="alembic_version",
            version_table_schema=db_schema,
            render_as_batch=False,
            process_revision_directives=_process_revision_directives,
            default_schema_name=db_schema,
        )

        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
