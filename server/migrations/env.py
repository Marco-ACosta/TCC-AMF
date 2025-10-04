from __future__ import annotations
import os
import sys
from pathlib import Path
from logging.config import fileConfig
from alembic import context
from sqlalchemy import create_engine, pool, text
from db_core.models import Base
import db_core.models.room  # noqa: F401
import db_core.models.translator    # noqa: F401
import db_core.models.language  # noqa: F401
import db_core.models.speaker   # noqa: F401
import db_core.models.language_translator   # noqa: F401
import db_core.models.language_speaker  # noqa: F401
import db_core.models.room_translator   # noqa: F401
import db_core.models.room_speaker  # noqa: F401
import db_core.models.user  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

project_root = Path(__file__).resolve().parents[1]
libs_dir = project_root / "libs"

for p in (str(libs_dir), str(libs_dir / "db_core"), str(project_root)):
    if p not in sys.path:
        sys.path.insert(0, p)

database_url = os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
db_schema = os.getenv("DB_SCHEMA", "public")

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
    url = config.get_main_option("sqlalchemy.url")
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
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
        future=True,
    )

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
