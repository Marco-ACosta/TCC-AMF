from __future__ import annotations
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import MetaData

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=convention)

class Base(DeclarativeBase):
    metadata = metadata

    @declared_attr.directive
    def __tablename__(cls) -> str:
        import re
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", cls.__name__)
        return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


from .room import Room  # noqa: E402,F401
from .speaker import Speaker  # noqa: E402,F401
from .translator import Translator  # noqa: E402,F401
from .language import Language  # noqa: E402,F401
from .user import User  # noqa: E402,F401

from .room_speaker import RoomSpeaker  # noqa: E402,F401
from .room_translator import RoomTranslator  # noqa: E402,F401
from .language_speaker import LanguageSpeaker  # noqa: E402,F401
from .language_translator import LanguageTranslator  # noqa: E402,F401

__all__ = [
    "Base",
    "metadata",
    "RoomSpeaker",
    "RoomTranslator",
    "LanguageSpeaker",
    "LanguageTranslator",
    "Room",
    "Speaker",
    "Translator",
    "Language",
    "User",
]
