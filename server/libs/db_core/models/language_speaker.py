from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_core import TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language import Language
    from .speaker import Speaker


class LanguageSpeaker(Base, TimestampMixin):
    __tablename__ = "language_speakers"

    language_id: Mapped[int] = mapped_column(
        ForeignKey("languages.id", ondelete="CASCADE"),
        primary_key=True,
    )
    speaker_id: Mapped[int] = mapped_column(
        ForeignKey("speakers.id", ondelete="CASCADE"),
        primary_key=True,
    )

    language: Mapped["Language"] = relationship("Language", back_populates="language_speakers")
    speaker: Mapped["Speaker"] = relationship("Speaker", back_populates="language_speakers")
