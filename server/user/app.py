from enum import Enum
from typing import Optional, List
from db_core.http.cors import setup_cors
from flask import Flask, g, jsonify, Blueprint, request
from db.session import SessionLocal
from pydantic import BaseModel, Field, field_validator, ConfigDict
from db_core.auth import auth_required
from db_core.validation import parse_body
from db_core.services.user_service import create_user, authenticate
from db_core.security.token import create_access_token
from db_core.models.user import User
from db_core.models.translator import Translator
from db_core.models.speaker import Speaker
from db_core.models.language_speaker import LanguageSpeaker
from db_core.models.language_translator import LanguageTranslator
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, exists, delete
from db_core.security.passwords import hash_password
from db_core.models.language_room_user import LanguageRoomUser
from db_core.models.language import Language

def _body_to_dict(model_or_dict):
    """Compat Pydantic v1/v2 ou dict puro"""
    if model_or_dict is None:
        return {}
    if isinstance(model_or_dict, dict):
        return model_or_dict
    if hasattr(model_or_dict, "model_dump"):
        return model_or_dict.model_dump()
    if hasattr(model_or_dict, "dict"):
        return model_or_dict.dict()
    return {}

def _serialize_language(lang):
    if not lang:
        return None
    return {
        "id": lang.id,
        "name": getattr(lang, "name", None),
        "code": getattr(lang, "code", None),
        "created_at": getattr(lang, "created_at", None),
        "updated_at": getattr(lang, "updated_at", None),
    }

def _extract_languages(links, attr_name="language"):
    out = []
    for link in (links or []):
        lang = getattr(link, attr_name, None)
        sl = _serialize_language(lang)
        if sl:
            out.append(sl)
    return out

def _serialize_user(u: User):
    tr = getattr(u, "translator", None)
    sp = getattr(u, "speaker", None)
    return {
        "id": u.id,
        "name": getattr(u, "name", None),
        "email": getattr(u, "email", None),
        "is_admin": getattr(u, "is_admin", False),
        "is_translator": getattr(u, "is_translator", False),
        "is_speaker": getattr(u, "is_speaker", False),
        "created_at": getattr(u, "created_at", None),
        "updated_at": getattr(u, "updated_at", None),
        "translator": None if not tr else {
            "id": tr.id,
            "languages": _extract_languages(tr.language_translators),
        },
        "speaker": None if not sp else {
            "id": sp.id,
            "bio": getattr(sp, "bio", None),
            "languages": _extract_languages(sp.language_speakers),
        },
    }

class UserType(str, Enum):
    SPEAKER = "speaker"
    TRANSLATOR = "translator"
    ADMIN = "admin"

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=120)
    user_type: UserType
    languages: list[int] | None = Field(default_factory=list)
    bio: str | None = Field(default=None, max_length=320)
   
class UserUpdateSelf(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(min_length=1, max_length=120, default=None)
    email: Optional[str] = Field(max_length=320, default=None)
    password: Optional[str] = Field(min_length=8, max_length=120, default=None)
    languages: Optional[List[int]] | None = None
    bio: Optional[str] = Field(default=None, max_length=320)

    @field_validator("name", mode="before")
    @classmethod
    def _strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = (v or "").strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @field_validator("email", mode="before")
    @classmethod
    def _strip_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = (v or "").strip()
        if not v:
            raise ValueError("email must not be empty")
        return v

    @field_validator("bio", mode="before")
    @classmethod
    def _normalize_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None

class UserLogin(BaseModel):
    email: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=120)

def create_app():
    app = Flask(__name__)
    setup_cors(app)

    bp = Blueprint("user", __name__, url_prefix="/user")

    @app.before_request
    def open_session():
        g.db = SessionLocal()

    @app.teardown_request
    def close_session(exc):
        db = getattr(g, "db", None)
        if not db:
            return
        try:
            db.commit() if exc is None else db.rollback()
        finally:
            db.close()

    @bp.route("/", methods=["POST"], strict_slashes=False)
    @parse_body(UserCreate)
    @auth_required(roles_any=["admin"])
    def store_user():
        body: UserCreate = g.body

        try:
            user = create_user(
                db=g.db,
                name=body.name,
                email=body.email,
                password=body.password,
                user_type=body.user_type.value,
                languages_ids=body.languages,
                bio=body.bio,
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 409

        return jsonify({
            "id": str(user.id),
            "email": user.email,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }), 201

    @bp.route("/profile", methods=["GET"], strict_slashes=False)
    @auth_required()   
    def get_profile():
        auth_user = getattr(g, "user", None) or {}
        sub = (auth_user.get("sub") or "").strip()
        try:
            current_user_id = int(sub)
        except (TypeError, ValueError):
            return jsonify({"message": "invalid_token"}), 401

        session = g.db

        user = session.execute(
            session.query(User).where(User.id == current_user_id)
        ).scalars().first()
        if not user:
            return jsonify({"message": "user_not_found"}), 404

        translator = session.execute(
            session.query(Translator)
            .options(
                selectinload(Translator.language_translators)
                .selectinload(LanguageTranslator.language)
            )
            .where(Translator.user_id == current_user_id)
        ).scalars().first()

        speaker = session.execute(
            session.query(Speaker)
            .options(
                selectinload(Speaker.language_speakers)
                .selectinload(LanguageSpeaker.language)
            )
            .where(Speaker.user_id == current_user_id)
        ).scalars().first()

        def serialize_language(lang):
            if not lang:
                return None
            return {
                "id": lang.id,
                "name": getattr(lang, "name", None),
                "code": getattr(lang, "code", None),
                "created_at": getattr(lang, "created_at", None),
                "updated_at": getattr(lang, "updated_at", None),
            }

        def extract_languages(links, attr_name="language"):
            out = []
            for link in (links or []):
                lang = getattr(link, attr_name, None)
                sl = serialize_language(lang)
                if sl:
                    out.append(sl)
            return out

        resp = {
            "user": {
                "id": user.id,
                "name": getattr(user, "name", None),
                "email": getattr(user, "email", None),
                "created_at": getattr(user, "created_at", None),
                "updated_at": getattr(user, "updated_at", None),
            },
            "translator": None,
            "speaker": None,
        }

        if translator:
            resp["translator"] = {
                "id": translator.id,
                "user_id": translator.user_id,
                "created_at": translator.created_at,
                "updated_at": translator.updated_at,
                "languages": extract_languages(translator.language_translators),
            }

        if speaker:
            resp["speaker"] = {
                "id": speaker.id,
                "bio": speaker.bio,
                "user_id": speaker.user_id,
                "created_at": speaker.created_at,
                "updated_at": speaker.updated_at,
                "languages": extract_languages(speaker.language_speakers),
            }

        return jsonify(resp)

    @bp.route("/login", methods=["POST"], strict_slashes=False)
    @parse_body(UserLogin)
    def login():
        body: UserLogin = g.body
        user = authenticate(g.db, body.email, body.password)
        if not user:
            return jsonify({"error": "credenciais_invalidas"}), 401

        token = create_access_token(
            subject=str(user.id),
            extra_claims={
                "email": user.email,
                "roles": ["user"] if not getattr(user, "is_admin", False) else ["admin"],
                "scopes": ["rooms:read", "rooms:create", "rooms:update", "rooms:delete", "speakers:read", "speakers:create", "speakers:update", "speakers:delete", "translators:read", "translators:create", "translators:update", "translators:delete"],
                "fresh": False,
            },
        )
        return jsonify({"access_token": token, "token_type": "bearer"})

    @bp.route("/profile", methods=["PUT"], strict_slashes=False)
    @auth_required()
    @parse_body(UserUpdateSelf)
    def update_profile():
        auth_user = getattr(g, "user", None) or {}
        sub = (auth_user.get("sub") or "").strip()
        try:
            current_user_id = int(sub)
        except (TypeError, ValueError):
            return jsonify({"message": "invalid_token"}), 401

        session = g.db
        body = g.body.model_dump(exclude_unset=True)

        user = session.execute(
            session.query(User)
            .options(
                selectinload(User.translator)
                    .selectinload(Translator.language_translators)
                    .selectinload(LanguageTranslator.language),
                selectinload(User.speaker)
                    .selectinload(Speaker.language_speakers)
                    .selectinload(LanguageSpeaker.language),
            )
            .where(User.id == current_user_id)
        ).scalars().first()

        if not user:
            return jsonify({"message": "user_not_found"}), 404

        if "name" in body:
            user.name = body["name"]

        if "email" in body:
            new_email = body["email"]
            exists_same = session.execute(
                select(User.id).where(
                    func.lower(User.email) == func.lower(new_email),
                    User.id != user.id
                ).limit(1)
            ).scalar()
            if exists_same:
                return jsonify({"error": "email_in_use"}), 409
            user.email = new_email

        if "password" in body:
            pwd = body["password"]
            if not isinstance(pwd, str) or len(pwd) < 8:
                return jsonify({"error": "invalid_password", "message": "min 8 chars"}), 400
            user.password = hash_password(pwd)

        if "bio" in body and user.speaker:
            user.speaker.bio = body["bio"]

        if "languages" in body:
            lang_ids = body.get("languages") or []
            lang_ids = list(dict.fromkeys(lang_ids))
            if lang_ids:
                found = set(session.execute(
                    select(Language.id).where(Language.id.in_(lang_ids))
                ).scalars().all())
                missing = sorted(set(lang_ids) - found)
                if missing:
                    return jsonify({"error": "invalid_language_ids", "missing": missing}), 400

            if user.translator is not None:
                current = {lt.language_id for lt in (user.translator.language_translators or [])}
                desired = set(lang_ids)
                if current - desired:
                    session.execute(
                        delete(LanguageTranslator).where(
                            LanguageTranslator.translator_id == user.translator.id,
                            LanguageTranslator.language_id.in_(list(current - desired))
                        )
                    )
                for lid in (desired - current):
                    session.add(LanguageTranslator(
                        translator_id=user.translator.id,
                        language_id=lid
                    ))

            if user.speaker is not None:
                current = {ls.language_id for ls in (user.speaker.language_speakers or [])}
                desired = set(lang_ids)
                if current - desired:
                    session.execute(
                        delete(LanguageSpeaker).where(
                            LanguageSpeaker.speaker_id == user.speaker.id,
                            LanguageSpeaker.language_id.in_(list(current - desired))
                        )
                    )
                for lid in (desired - current):
                    session.add(LanguageSpeaker(
                        speaker_id=user.speaker.id,
                        language_id=lid
                    ))

        session.flush()
        translator = session.execute(
            session.query(Translator)
            .options(
                selectinload(Translator.language_translators)
                .selectinload(LanguageTranslator.language)
            )
            .where(Translator.user_id == current_user_id)
        ).scalars().first()

        speaker = session.execute(
            session.query(Speaker)
            .options(
                selectinload(Speaker.language_speakers)
                .selectinload(LanguageSpeaker.language)
            )
            .where(Speaker.user_id == current_user_id)
        ).scalars().first()

        resp = {
            "user": {
                "id": user.id,
                "name": getattr(user, "name", None),
                "email": getattr(user, "email", None),
                "created_at": getattr(user, "created_at", None),
                "updated_at": getattr(user, "updated_at", None),
            },
            "translator": None if not translator else {
                "id": translator.id,
                "user_id": translator.user_id,
                "created_at": translator.created_at,
                "updated_at": translator.updated_at,
                "languages": _extract_languages(translator.language_translators),
            },
            "speaker": None if not speaker else {
                "id": speaker.id,
                "user_id": speaker.user_id,
                "created_at": speaker.created_at,
                "updated_at": speaker.updated_at,
                "languages": _extract_languages(speaker.language_speakers),
                "bio": getattr(speaker, "bio", None),
            },
        }
        return jsonify(resp), 200

    @bp.route("/<int:user_id>", methods=["DELETE"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def delete_user(user_id: int):
        auth_user = getattr(g, "user", None) or {}
        sub = (auth_user.get("sub") or "").strip()
        try:
            current_user_id = int(sub)
        except (TypeError, ValueError):
            return jsonify({"message": "invalid_token"}), 401

        if user_id == current_user_id:
            return jsonify({"error": "cannot_delete_self"}), 400

        session = g.db

        user = session.execute(
            session.query(User).where(User.id == user_id)
        ).scalars().first()
        if not user:
            return jsonify({"error": "not_found", "message": "user not found"}), 404

        linked = session.execute(
            select(exists().where(LanguageRoomUser.user_id == user_id))
        ).scalar()
        if linked:
            return jsonify({
                "error": "user_linked_to_rooms",
                "message": "não é possível remover usuário vinculado a salas"
            }), 409

        if user.translator:
            session.execute(
                delete(LanguageTranslator).where(LanguageTranslator.translator_id == user.translator.id)
            )
            session.delete(user.translator)

        if user.speaker:
            session.execute(
                delete(LanguageSpeaker).where(LanguageSpeaker.speaker_id == user.speaker.id)
            )
            session.delete(user.speaker)

        session.delete(user)
        session.commit()
        return "", 204

    @bp.route("/", methods=["GET"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def list_user():
        session = g.db
        q = (
            session.query(User)
            .options(
                selectinload(User.translator)
                    .selectinload(Translator.language_translators)
                    .selectinload(LanguageTranslator.language),
                selectinload(User.speaker)
                    .selectinload(Speaker.language_speakers)
                    .selectinload(LanguageSpeaker.language),
            )
            .order_by(User.id.asc())
        )

        type_param = (request.args.get("type") or "").strip().lower()
        if type_param:
            if type_param == "translator":
                q = q.filter(User.is_translator.is_(True))
            elif type_param == "speaker":
                q = q.filter(User.is_speaker.is_(True))
            elif type_param == "admin":
                q = q.filter(User.is_admin.is_(True))
            else:
                return jsonify({
                    "error": "invalid_type",
                    "message": "Parâmetro 'type' deve ser 'translator' ou 'speaker'.",
                    "allowed": ["translator", "speaker"],
                }), 400

        users = session.execute(q).scalars().all()

        return jsonify([_serialize_user(u) for u in users]), 200

    @bp.route("/<int:user_id>", methods=["PUT"], strict_slashes=False)
    @auth_required()
    @parse_body(UserUpdateSelf)
    def update(user_id: int):
        try:
            current_user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"message": "invalid_token"}), 401

        session = g.db
        body = g.body.model_dump(exclude_unset=True)

        user = session.execute(
            session.query(User)
            .options(
                selectinload(User.translator)
                    .selectinload(Translator.language_translators)
                    .selectinload(LanguageTranslator.language),
                selectinload(User.speaker)
                    .selectinload(Speaker.language_speakers)
                    .selectinload(LanguageSpeaker.language),
            )
            .where(User.id == current_user_id)
        ).scalars().first()

        if not user:
            return jsonify({"message": "user_not_found"}), 404

        if "name" in body:
            user.name = body["name"]

        if "email" in body:
            new_email = body["email"]
            exists_same = session.execute(
                select(User.id).where(
                    func.lower(User.email) == func.lower(new_email),
                    User.id != user.id
                ).limit(1)
            ).scalar()
            if exists_same:
                return jsonify({"error": "email_in_use"}), 409
            user.email = new_email

        if "password" in body:
            pwd = body["password"]
            if not isinstance(pwd, str) or len(pwd) < 8:
                return jsonify({"error": "invalid_password", "message": "min 8 chars"}), 400
            user.password = hash_password(pwd)

        if "bio" in body and user.speaker:
            user.speaker.bio = body["bio"]

        if "languages" in body:
            lang_ids = body.get("languages") or []
            lang_ids = list(dict.fromkeys(lang_ids))
            if lang_ids:
                found = set(session.execute(
                    select(Language.id).where(Language.id.in_(lang_ids))
                ).scalars().all())
                missing = sorted(set(lang_ids) - found)
                if missing:
                    return jsonify({"error": "invalid_language_ids", "missing": missing}), 400

            if user.translator is not None:
                current = {lt.language_id for lt in (user.translator.language_translators or [])}
                desired = set(lang_ids)
                if current - desired:
                    session.execute(
                        delete(LanguageTranslator).where(
                            LanguageTranslator.translator_id == user.translator.id,
                            LanguageTranslator.language_id.in_(list(current - desired))
                        )
                    )
                for lid in (desired - current):
                    session.add(LanguageTranslator(
                        translator_id=user.translator.id,
                        language_id=lid
                    ))

            if user.speaker is not None:
                current = {ls.language_id for ls in (user.speaker.language_speakers or [])}
                desired = set(lang_ids)
                if current - desired:
                    session.execute(
                        delete(LanguageSpeaker).where(
                            LanguageSpeaker.speaker_id == user.speaker.id,
                            LanguageSpeaker.language_id.in_(list(current - desired))
                        )
                    )
                for lid in (desired - current):
                    session.add(LanguageSpeaker(
                        speaker_id=user.speaker.id,
                        language_id=lid
                    ))

        session.flush()
        translator = session.execute(
            session.query(Translator)
            .options(
                selectinload(Translator.language_translators)
                .selectinload(LanguageTranslator.language)
            )
            .where(Translator.user_id == current_user_id)
        ).scalars().first()

        speaker = session.execute(
            session.query(Speaker)
            .options(
                selectinload(Speaker.language_speakers)
                .selectinload(LanguageSpeaker.language)
            )
            .where(Speaker.user_id == current_user_id)
        ).scalars().first()

        resp = {
            "user": {
                "id": user.id,
                "name": getattr(user, "name", None),
                "email": getattr(user, "email", None),
                "created_at": getattr(user, "created_at", None),
                "updated_at": getattr(user, "updated_at", None),
            },
            "translator": None if not translator else {
                "id": translator.id,
                "user_id": translator.user_id,
                "created_at": translator.created_at,
                "updated_at": translator.updated_at,
                "languages": _extract_languages(translator.language_translators),
            },
            "speaker": None if not speaker else {
                "id": speaker.id,
                "user_id": speaker.user_id,
                "created_at": speaker.created_at,
                "updated_at": speaker.updated_at,
                "languages": _extract_languages(speaker.language_speakers),
                "bio": getattr(speaker, "bio", None),
            },
        }
        return jsonify(resp), 200

    app.register_blueprint(bp)
    return app

app = create_app()
