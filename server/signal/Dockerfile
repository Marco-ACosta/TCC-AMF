FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/libs/db_core:/app \
    PORT=5002
WORKDIR /app

COPY libs/db_core /app/libs/db_core
RUN pip install -e /app/libs/db_core

COPY signal/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY signal /app/app
WORKDIR /app/app
EXPOSE 5002
CMD ["gunicorn","-b","0.0.0.0:5002","--workers","1","--threads","4","app:app"]
