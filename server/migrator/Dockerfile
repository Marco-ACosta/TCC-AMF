FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/libs/db_core:/app

WORKDIR /app

COPY libs /app/libs
RUN pip install -e /app/libs

COPY migrations /app/migrations
COPY alembic.ini /app/alembic.ini
RUN pip install --no-cache-dir "SQLAlchemy>=2.0" "psycopg[binary]==3.2.10" "alembic>=1.13" "passlib[bcrypt]==1.7.4" "argon2-cffi>=23.1.0"
