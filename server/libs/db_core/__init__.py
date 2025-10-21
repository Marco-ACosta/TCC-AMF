import os
import time
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import MetaData, Integer, Identity, BigInteger

DB_SCHEMA = os.getenv("DB_SCHEMA", "public")

class Base(DeclarativeBase):
    metadata = MetaData(schema=DB_SCHEMA)

class IdMixin:
    id: Mapped[int] = mapped_column(Integer, Identity(always=False), primary_key=True)

class TimestampMixin:
    created_at: Mapped[int] = mapped_column(BigInteger, default=lambda: int(time.time()))
    updated_at: Mapped[int] = mapped_column(BigInteger, default=lambda: int(time.time()),
                                            onupdate=lambda: int(time.time()))
