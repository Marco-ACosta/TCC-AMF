from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_core import IdMixin, TimestampMixin
from . import Base

if TYPE_CHECKING:
    from .room import Room
    from .translator import Translator


class RoomTranslator(Base, IdMixin, TimestampMixin):
    __tablename__ = "room_translators"

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )

    translator_id: Mapped[int] = mapped_column(
        ForeignKey("translators.id", ondelete="CASCADE"),
        primary_key=True,
    )

    room: Mapped["Room"] = relationship("Room", back_populates="room_translators")
    translator: Mapped["Translator"] = relationship("Translator", back_populates="room_translators")
