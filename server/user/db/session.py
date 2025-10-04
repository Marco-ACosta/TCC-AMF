import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@postgres:5432/postgresql")

engine = create_engine(
    DATABASE_URL,
    pool_size=int(os.getenv("DB_POOL_SIZE", 10)),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", 20)),
    pool_pre_ping=True,
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE", 1800)),
    echo=os.getenv("SQL_ECHO", "0") == "1",
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
