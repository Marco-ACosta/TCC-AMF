from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .room import Room
    from .speaker import Speaker


class RoomSpeaker(Base, IdMixin, TimestampMixin):
    __tablename__ = "room_speakers"

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )
    speaker_id: Mapped[int] = mapped_column(
        ForeignKey("speakers.id", ondelete="CASCADE"),
        primary_key=True,
    )

    room: Mapped["Room"] = relationship("Room", back_populates="room_speakers")
    speaker: Mapped["Speaker"] = relationship("Speaker", back_populates="room_speakers")
