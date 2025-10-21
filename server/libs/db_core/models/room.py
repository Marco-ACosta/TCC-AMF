from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .language_room_user import LanguageRoomUser

class Room(Base, IdMixin, TimestampMixin):
    __tablename__ = "rooms"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    code: Mapped[str] = mapped_column(String, nullable=False)

    language_room_users: Mapped[List["LanguageRoomUser"]] = relationship(
        "LanguageRoomUser",
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    translators: Mapped[List["LanguageRoomUser"]] = relationship(
        "LanguageRoomUser",
        primaryjoin="and_(Room.id==LanguageRoomUser.room_id, LanguageRoomUser.role=='translator')",
        viewonly=True,
        overlaps="language_room_users",
    )
    speakers: Mapped[List["LanguageRoomUser"]] = relationship(
        "LanguageRoomUser",
        primaryjoin="and_(Room.id==LanguageRoomUser.room_id, LanguageRoomUser.role=='speaker')",
        viewonly=True,
        overlaps="language_room_users",
    )
