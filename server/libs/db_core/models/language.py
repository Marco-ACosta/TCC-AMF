from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language_translator import LanguageTranslator
    from .language_speaker import LanguageSpeaker


class Language(Base, IdMixin, TimestampMixin):
    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(16), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)

    language_translators: Mapped[list["LanguageTranslator"]] = relationship(
        "LanguageTranslator",
        back_populates="language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    language_speakers: Mapped[list["LanguageSpeaker"]] = relationship(
        "LanguageSpeaker",
        back_populates="language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
