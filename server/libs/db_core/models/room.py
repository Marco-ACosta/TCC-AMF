from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .room_translator import RoomTranslator
    from .room_speaker import RoomSpeaker

class Room(Base, IdMixin, TimestampMixin):
    __tablename__ = "rooms"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    code: Mapped[str] = mapped_column(String, nullable=False)

    room_translators: Mapped[list["RoomTranslator"]] = relationship(
        "RoomTranslator",
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    room_speakers: Mapped[list["RoomSpeaker"]] = relationship(
        "RoomSpeaker",
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    speakers = association_proxy(
        "room_speakers",
        "speaker",
        creator=lambda speaker: RoomSpeaker(speaker=speaker),
    )

    translators = association_proxy(
        "room_translators",
        "translator",
        creator=lambda translator: RoomTranslator(translator=translator),
    )

