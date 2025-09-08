# Dockerfile - WebRTC Signaling (Flask-SocketIO + Gunicorn + Eventlet)
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=5001 \
    WORKERS=1

WORKDIR /app

# (Opcional) Se precisar de build de wheels em arquiteturas específicas, descomente:
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Depêndencias mínimas para Socket.IO com WebSocket
RUN pip install --no-cache-dir \
      flask \
      flask-socketio \
      eventlet \
      gunicorn

# Copia apenas o app (ajuste o nome se necessário)
COPY app.py /app/app.py

# Usuário não-root (opcional)
RUN useradd -ms /bin/bash appuser
USER appuser

EXPOSE 5001

# Usa Gunicorn com worker Eventlet (suporte WebSocket)
# Permite trocar PORT/WORKERS via env sem alterar a imagem
CMD sh -c 'gunicorn -k eventlet -w ${WORKERS:-1} -b 0.0.0.0:${PORT:-5001} app:app'
