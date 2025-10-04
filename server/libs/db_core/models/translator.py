from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language_translator import LanguageTranslator
    from .room_translator import RoomTranslator
    from .user import User

class Translator(Base, IdMixin, TimestampMixin):
    __tablename__ = "translators"

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
        index=True,
    )

    room_translators: Mapped[list["RoomTranslator"]] = relationship(
        "RoomTranslator",
        back_populates="translator",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    language_translators: Mapped[list["LanguageTranslator"]] = relationship(
        "LanguageTranslator",
        back_populates="translator",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    translators = association_proxy(
        "room_translators",
        "room",
        creator=lambda room: RoomTranslator(room=room),
    )

    languages = association_proxy(
        "language_translators",
        "language",
        creator=lambda language: LanguageTranslator(language=language),
    )

    user: Mapped["User"] = relationship("User", back_populates="translator")