FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/libs/db_core:/app \
    PORT=5004
WORKDIR /app

COPY libs /app/libs
RUN pip install -e /app/libs

COPY room/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY room /app/app
WORKDIR /app/app
EXPOSE 5004
CMD ["gunicorn","-b","0.0.0.0:5004","--workers","1","--threads","4","app:app"]
