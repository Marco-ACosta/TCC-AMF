from __future__ import annotations
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, String, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_core import TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .room import Room
    from .language import Language
    from .user import User

class LanguageRoomUser(Base, TimestampMixin):
    __tablename__ = "language_room_users"

    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, primary_key=True)

    source_language_id: Mapped[int] = mapped_column(ForeignKey("languages.id", ondelete="CASCADE"), nullable=False, index=True, primary_key=True)
    target_language_id: Mapped[Optional[int]] = mapped_column(ForeignKey("languages.id", ondelete="CASCADE"), nullable=True, index=True, primary_key=True)

    role: Mapped[str] = mapped_column(String(20), nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('speaker','translator')", name="ck_lru_role"),
        CheckConstraint(
            "(role = 'speaker' AND target_language_id IS NULL) OR "
            "(role = 'translator' AND target_language_id IS NOT NULL AND source_language_id <> target_language_id)",
            name="ck_lru_shape_by_role",
        ),
        UniqueConstraint(
            "room_id", "user_id", "role", "source_language_id", "target_language_id",
            name="ux_lru_unique_role_link",
        ),
    )

    room: Mapped["Room"] = relationship("Room", back_populates="language_room_users")
    user: Mapped["User"] = relationship("User", back_populates="language_room_users")

    source_language: Mapped["Language"] = relationship(
        "Language",
        foreign_keys=[source_language_id],
        back_populates="source_language_room_users",
    )
    target_language: Mapped[Optional["Language"]] = relationship(
        "Language",
        foreign_keys=[target_language_id],
        back_populates="target_language_room_users",
    )
