from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language_speaker import LanguageSpeaker
    from .user import User

class Speaker(Base, IdMixin, TimestampMixin):
    __tablename__ = "speakers"

    bio: Mapped[str | None] = mapped_column(String, nullable=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
        index=True,
    )

    language_speakers: Mapped[list["LanguageSpeaker"]] = relationship(
        "LanguageSpeaker",
        back_populates="speaker",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    languages = association_proxy(
        "language_speakers",
        "language",
        creator=lambda language: LanguageSpeaker(language=language),
    )

    user: Mapped["User"] = relationship("User", back_populates="speaker")