from __future__ import annotations
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .speaker import Speaker
    from .translator import Translator

class User(Base, IdMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_admin: Mapped[bool] = mapped_column(default=False)
    is_speaker: Mapped[bool] = mapped_column(default=False)
    is_translator: Mapped[bool] = mapped_column(default=False)

    speaker: Mapped[Optional["Speaker"]] = relationship(
        "Speaker",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    translator: Mapped[Optional["Translator"]] = relationship(
        "Translator",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def set_password_hash(self, password_hash: str) -> None:
            self.password = password_hash

Index("ix_users_email_lower", func.lower(User.email), unique=True)