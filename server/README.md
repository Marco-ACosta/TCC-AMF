# Flask Microservices (PostgreSQL único, **schema public**)

Arquitetura de micro-serviços Flask compartilhando **o mesmo schema `public`** no PostgreSQL.
- Porta do Postgres: **5432**
- Banco (dbname): **postgresql**
- Schema: **public**

Há um pacote compartilhado `libs/db_core` com `Base` e modelos. As migrações são **centralizadas** (Alembic) em `migrations/`.
Há também **PgBouncer** para pooling.

## Subir
```bash
docker compose build
docker compose run --rm migrator upgrade head
docker compose up -d room signal
```

APIs:
- `GET/POST http://localhost:5001/rooms`  (body: `{ "name": "..." }`)
- `GET/POST http://localhost:5002/signals` (body: `{ "kind": "...", "payload": "..." }`)
