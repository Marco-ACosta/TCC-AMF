FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/libs/db_core:/app

WORKDIR /app

# Pacote compartilhado
COPY libs/db_core /app/libs/db_core
RUN pip install -e /app/libs/db_core

# Alembic + deps
COPY migrations /app/migrations
COPY alembic.ini /app/alembic.ini
RUN pip install --no-cache-dir "SQLAlchemy>=2.0" "psycopg[binary]==3.2.10" "alembic>=1.13"
