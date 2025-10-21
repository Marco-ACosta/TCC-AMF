from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_core import TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language import Language
    from .translator import Translator


class LanguageTranslator(Base, TimestampMixin):
    __tablename__ = "language_translators"

    language_id: Mapped[int] = mapped_column(
        ForeignKey("languages.id", ondelete="CASCADE"),
        primary_key=True,
    )
    translator_id: Mapped[int] = mapped_column(
        ForeignKey("translators.id", ondelete="CASCADE"),
        primary_key=True,
    )

    language: Mapped["Language"] = relationship("Language", back_populates="language_translators")
    translator: Mapped["Translator"] = relationship("Translator", back_populates="language_translators")

    
