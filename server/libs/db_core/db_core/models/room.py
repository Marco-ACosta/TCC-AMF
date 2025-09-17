from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from db_core import Base, IdMixin, TimestampMixin

class Room(Base, IdMixin, TimestampMixin):
    __tablename__ = "rooms"
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(nullable=False)
