from __future__ import annotations
from typing import TYPE_CHECKING, List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language_translator import LanguageTranslator
    from .language_speaker import LanguageSpeaker
    from .language_room_user import LanguageRoomUser

class Language(Base, IdMixin, TimestampMixin):
    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(16), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)

    language_translators: Mapped[List["LanguageTranslator"]] = relationship(
        "LanguageTranslator",
        back_populates="language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    language_speakers: Mapped[List["LanguageSpeaker"]] = relationship(
        "LanguageSpeaker",
        back_populates="language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    source_language_room_users: Mapped[List["LanguageRoomUser"]] = relationship(
        "LanguageRoomUser",
        foreign_keys="LanguageRoomUser.source_language_id",
        back_populates="source_language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    target_language_room_users: Mapped[List["LanguageRoomUser"]] = relationship(
        "LanguageRoomUser",
        foreign_keys="LanguageRoomUser.target_language_id",
        back_populates="target_language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
