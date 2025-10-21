FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/libs/db_core:/app \
    PORT=5002

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
  && rm -rf /var/lib/apt/lists/*

COPY libs /app/libs
RUN pip install -e /app/libs

COPY signal/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY signal /app/app
WORKDIR /app/app

EXPOSE 5002

CMD ["gunicorn", "-k", "eventlet", "--worker-connections", "1000", "--timeout", "0", "-w", "1", "-b", "0.0.0.0:5002", "app:app"]
