# Flask Microservices (PostgreSQL único, **schema public**)

Arquitetura de micro-serviços Flask compartilhando **o mesmo schema `public`** no PostgreSQL.

- Porta do Postgres: **5432**
- Banco (dbname): **postgresql**
- Schema: **public**

## Subir

```bash
docker compose build
docker compose run --rm migrator upgrade head
docker compose up
```
