from typing import List, Optional
from sqlalchemy import select, delete, or_, and_, tuple_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError
from db_core.models.language_room_user import LanguageRoomUser
from db_core.models.speaker import Speaker
from db_core.models.translator import Translator
from flask import Blueprint, Flask, g, jsonify
from db.session import SessionLocal
from db_core.auth import auth_required
from db_core.models.room import Room
from db_core.models.user import User
from db_core.models.language import Language
from db_core.http.cors import setup_cors
from pydantic import BaseModel, Field, validator
from db_core.validation import parse_body
import rstr


class TranslatorItem(BaseModel):
    user_id: int = Field(gt=0)
    from_language_id: int = Field(gt=0)
    to_language_id: int = Field(gt=0)

    @validator("to_language_id")
    def _from_to_must_differ(cls, v, values):
        if values.get("from_language_id") == v:
            raise ValueError("to_language_id must differ from from_language_id")
        return v

class SpeakerItem(BaseModel):
    user_id: int = Field(gt=0)
    language_id: int = Field(gt=0)

class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    translators: Optional[List[TranslatorItem]] = None
    speakers: Optional[List[SpeakerItem]] = None

    @validator("name", pre=True)
    def _strip_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @validator("description", pre=True)
    def _normalize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None

    @validator("translators")
    def _validate_translators(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError("translators must be a non-empty list or null")
        return v

    @validator("speakers")
    def _validate_speakers(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError("speakers must be a non-empty list or null")
        return v

class RoomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    translators: Optional[List[TranslatorItem]] = None
    speakers: Optional[List[SpeakerItem]] = None

    @validator("name", pre=True)
    def _strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = (v or "").strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @validator("description", pre=True)
    def _normalize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None

    @validator("translators")
    def _validate_translators(cls, v):
        if v is None:
            return v
        if not isinstance(v, list):
            raise ValueError("translators must be a list")
        seen = set()
        for i, t in enumerate(v):
            key = (t.user_id, t.from_language_id, t.to_language_id)
            if key in seen:
                raise ValueError(f"duplicated translator at index {i}: {key}")
            seen.add(key)
        return v

    @validator("speakers")
    def _validate_speakers(cls, v):
        if v is None:
            return v
        if not isinstance(v, list):
            raise ValueError("speakers must be a list")
        seen = set()
        for i, s in enumerate(v):
            key = (s.user_id, s.language_id)
            if key in seen:
                raise ValueError(f"duplicated speaker at index {i}: {key}")
            seen.add(key)
        return v

def __generate_room_code__():
    return rstr.xeger(r"[A-Z]{4}-[A-Z]{4}")

def _generate_unique_code(db):
    while True:
        code = __generate_room_code__()
        exists = db.query(Room.id).filter(Room.code == code).first()
        if not exists:
            return code

def create_app():
    app = Flask(__name__)
    setup_cors(app)
    bp = Blueprint("room", __name__, url_prefix="/room")

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
    @parse_body(RoomCreate)
    @auth_required(roles_any=["admin"])
    def create_room():
        body: RoomCreate = g.body

        translators_payload = list(body.translators or [])
        translator_user_ids = sorted({int(t.user_id) for t in translators_payload if t and t.user_id})

        translators_by_user_id: dict[int, Translator] = {}
        if translator_user_ids:
            translators = g.db.execute(
                select(Translator)
                .options(selectinload(Translator.language_translators))
                .where(Translator.user_id.in_(translator_user_ids))
            ).scalars().all()

            translators_by_user_id = {t.user_id: t for t in translators}
            found_user_ids = set(translators_by_user_id.keys())
            missing = sorted(set(translator_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_translator_ids",
                    "message": "one or more translator user_ids do not exist",
                    "received_user_ids": translator_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400


        speakers_payload = list(body.speakers or [])
        speaker_user_ids = sorted({int(s.user_id) for s in speakers_payload if s and s.user_id})

        speakers_by_user_id: dict[int, Speaker] = {}
        if speaker_user_ids:
            speakers = g.db.execute(
                select(Speaker)
                .options(selectinload(Speaker.language_speakers))
                .where(Speaker.user_id.in_(speaker_user_ids))
            ).scalars().all()

            speakers_by_user_id = {s.user_id: s for s in speakers}
            found_user_ids = set(speakers_by_user_id.keys())
            missing = sorted(set(speaker_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_speaker_ids",
                    "message": "one or more speaker user_ids do not exist",
                    "received_user_ids": speaker_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400

        assignments: set[tuple[int, str, int, Optional[int]]] = set()

        for item in translators_payload:
            uid = int(item.user_id)
            src = int(item.from_language_id)
            tgt = int(item.to_language_id)

            if src == tgt:
                return jsonify({
                    "error": "invalid_translation_direction",
                    "message": "from_language_id must differ from to_language_id",
                    "user_id": uid,
                    "from_language_id": src,
                    "to_language_id": tgt,
                }), 400

            t = translators_by_user_id.get(uid)
            if not t:
                return jsonify({
                    "error": "invalid_translator_id",
                    "message": "translator user_id not found",
                    "user_id": uid,
                }), 400

            t_lang_ids = {lt.language_id for lt in (t.language_translators or [])}
            missing_langs = [lid for lid in (src, tgt) if lid not in t_lang_ids]
            if missing_langs:
                return jsonify({
                    "error": "translator_language_not_linked",
                    "message": "translator does not have the required languages linked",
                    "user_id": uid,
                    "required_language_ids": [src, tgt],
                    "missing_language_ids": sorted(set(missing_langs)),
                    "available_language_ids": sorted(t_lang_ids),
                }), 400

            assignments.add((uid, "translator", src, tgt))

        for item in speakers_payload:
            uid = int(item.user_id)
            src = int(item.language_id)

            s = speakers_by_user_id.get(uid)
            if not s:
                return jsonify({
                    "error": "invalid_speaker_id",
                    "message": "speaker user_id not found",
                    "user_id": uid,
                }), 400

            s_lang_ids = {ls.language_id for ls in (s.language_speakers or [])}
            if src not in s_lang_ids:
                return jsonify({
                    "error": "speaker_language_not_linked",
                    "message": "speaker does not have the required language linked",
                    "user_id": uid,
                    "language_id": src,
                    "available_language_ids": sorted(s_lang_ids),
                }), 400

            assignments.add((uid, "speaker", src, None))

        room = Room(
            name=(body.name or "").strip(),
            code=_generate_unique_code(db=g.db),
            description=(body.description or "").strip() if body.description is not None else None,
        )
        g.db.add(room)
        g.db.flush()

        if assignments:
            def _order_key(x: tuple[int, str, int, Optional[int]]):
                uid, role, src, tgt = x
                return (uid, role, src, -1 if tgt is None else tgt)

            rows = [
                LanguageRoomUser(
                    room_id=room.id,
                    user_id=uid,
                    role=role,
                    source_language_id=src,
                    target_language_id=tgt,
                )
                for (uid, role, src, tgt) in sorted(assignments, key=_order_key)
            ]
            g.db.add_all(rows)

        try:
            g.db.commit()
        except IntegrityError as e:
            g.db.rollback()
            return jsonify({
                "error": "pivot_integrity_error",
                "message": "could not persist room-user-language links",
                "details": str(e.__cause__) if getattr(e, "__cause__", None) else str(e),
            }), 409

        g.db.refresh(room)
        return jsonify({"id": room.id, "name": room.name, "code": room.code}), 201

    @bp.route("/", methods=["GET"], strict_slashes=False)
    @auth_required()
    def list_rooms():
        user_payload = getattr(g, "user", None) or {}
        roles_claim = user_payload.get("roles") or []

        sub = user_payload.get("sub")
        try:
            current_user_id = int(sub)
        except (TypeError, ValueError):
            return jsonify({
                "error": "invalid_user_id",
                "message": "o 'sub' do usuário deve ser inteiro para comparar com translators.user_id/speakers.user_id",
                "received_sub": sub,
            }), 400

        db_user = g.db.get(User, current_user_id)
        if not db_user:
            return jsonify({
                "error": "user_not_found",
                "message": f"usuário id={current_user_id} não encontrado"
            }), 404

        if db_user.is_admin or ("admin" in roles_claim):
            rooms = g.db.execute(select(Room).order_by(Room.id)).scalars().all()
            return jsonify([{"id": r.id, "name": r.name, "code": r.code, "description": r.description} for r in rooms]), 200

        allowed_roles = []
        if db_user.is_translator or ("translator" in roles_claim):
            allowed_roles.append("translator")
        if db_user.is_speaker or ("speaker" in roles_claim):
            allowed_roles.append("speaker")
        if not allowed_roles:
            allowed_roles = ["translator", "speaker"]

        exists_clauses = []

        if "translator" in allowed_roles:
            t_exists = (
                select(1)
                .where(
                    and_(
                        LanguageRoomUser.room_id == Room.id,
                        LanguageRoomUser.user_id == current_user_id,
                        LanguageRoomUser.role == "translator",
                    )
                )
                .correlate(Room)
                .exists()
            )
            exists_clauses.append(t_exists)

        if "speaker" in allowed_roles:
            s_exists = (
                select(1)
                .where(
                    and_(
                        LanguageRoomUser.room_id == Room.id,
                        LanguageRoomUser.user_id == current_user_id,
                        LanguageRoomUser.role == "speaker",
                    )
                )
                .correlate(Room)
                .exists()
            )
            exists_clauses.append(s_exists)

        rooms_q = select(Room).where(or_(*exists_clauses)).order_by(Room.id)
        rooms = g.db.execute(rooms_q).scalars().all()

        return jsonify([
            {"id": r.id, "name": r.name, "code": r.code, "description": r.description}
            for r in rooms
        ]), 200

    @bp.route("/<int:room_id>", methods=["PUT"], strict_slashes=False)
    @parse_body(RoomUpdate)
    @auth_required(roles_any=["admin"])
    def update_room(room_id: int):
        raw_body = getattr(g, "body", None) or {}
        body = raw_body if isinstance(raw_body, dict) else (
            raw_body.model_dump() if hasattr(raw_body, "model_dump") else raw_body.dict()
        )

        room = g.db.get(Room, room_id)
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        if "name" in body:
            room.name = (body.get("name") or "").strip()
            if not room.name:
                return jsonify({"error": "invalid_name", "message": "name não pode ser vazio"}), 400

        if "description" in body:
            desc = (body.get("description") or "").strip()
            room.description = desc or None

        if "translators" in body and body["translators"] is not None:
            body["translators"] = [
                {
                    "user_id": (t if isinstance(t, dict) else t.dict())["user_id"],
                    "source_language_id": (t if isinstance(t, dict) else t.dict()).get("source_language_id", (t if isinstance(t, dict) else t.dict()).get("from_language_id")),
                    "target_language_id": (t if isinstance(t, dict) else t.dict()).get("target_language_id", (t if isinstance(t, dict) else t.dict()).get("to_language_id")),
                }
                for t in body["translators"]
            ]
        if "speakers" in body and body["speakers"] is not None:
            body["speakers"] = [
                {
                    "user_id": (s if isinstance(s, dict) else s.dict())["user_id"],
                    "source_language_id": (s if isinstance(s, dict) else s.dict()).get("source_language_id", (s if isinstance(s, dict) else s.dict()).get("language_id")),
                }
                for s in body["speakers"]
            ]

        def fetch_users_map(user_ids: set[int]) -> dict[int, User]:
            if not user_ids:
                return {}
            users = g.db.execute(select(User).where(User.id.in_(user_ids))).scalars().all()
            return {u.id: u for u in users}

        if "translators" in body:
            translators = body.get("translators")
            if translators is not None and not isinstance(translators, list):
                return jsonify({"error": "invalid_translators_payload", "message": "translators deve ser uma lista"}), 400

            desired_triplets = set()
            uids, lang_ids = set(), set()
            for i, item in enumerate(translators or []):
                if not isinstance(item, dict):
                    return jsonify({"error": "invalid_translators_payload", "message": f"item {i} deve ser objeto"}), 400
                uid, src, tgt = item.get("user_id"), item.get("source_language_id"), item.get("target_language_id")
                try:
                    uid, src, tgt = int(uid), int(src), int(tgt)
                except (TypeError, ValueError):
                    return jsonify({"error": "invalid_translators_payload", "message": f"item {i}: user_id/source/target devem ser inteiros"}), 400
                if src == tgt:
                    return jsonify({"error": "invalid_language_pair", "message": f"item {i}: source_language_id e target_language_id não podem ser iguais"}), 400
                desired_triplets.add((uid, src, tgt))
                uids.add(uid) 
                lang_ids.update([src, tgt])

            users_map = fetch_users_map(uids)
            missing_u = sorted(uids - set(users_map.keys()))
            if missing_u:
                return jsonify({"error": "invalid_translator_ids", "missing_user_ids": missing_u}), 400
            not_translators = sorted([uid for uid, u in users_map.items() if not u.is_translator])
            if not_translators:
                return jsonify({"error": "invalid_translator_role", "user_ids": not_translators}), 400

            if lang_ids:
                found_langs = set(g.db.execute(select(Language.id).where(Language.id.in_(lang_ids))).scalars().all())
                missing_langs = sorted(lang_ids - found_langs)
                if missing_langs:
                    return jsonify({"error": "invalid_language_ids", "missing_language_ids": missing_langs}), 400

            if translators is not None:
                if desired_triplets:
                    g.db.execute(
                        delete(LanguageRoomUser).where(
                            LanguageRoomUser.room_id == room.id,
                            LanguageRoomUser.role == "translator",
                            tuple_(
                                LanguageRoomUser.user_id,
                                LanguageRoomUser.source_language_id,
                                LanguageRoomUser.target_language_id,
                            ).notin_(list(desired_triplets)),
                        )
                    )
                else:
                    g.db.execute(
                        delete(LanguageRoomUser).where(
                            LanguageRoomUser.room_id == room.id,
                            LanguageRoomUser.role == "translator",
                        )
                    )

            existing_triplets = set(
                g.db.execute(
                    select(
                        LanguageRoomUser.user_id,
                        LanguageRoomUser.source_language_id,
                        LanguageRoomUser.target_language_id,
                    ).where(
                        LanguageRoomUser.room_id == room.id,
                        LanguageRoomUser.role == "translator",
                    )
                ).all()
            )
            for (uid, src, tgt) in (desired_triplets - existing_triplets):
                g.db.add(LanguageRoomUser(
                    room_id=room.id, user_id=uid, role="translator",
                    source_language_id=src, target_language_id=tgt,
                ))

        if "speakers" in body:
            speakers = body.get("speakers")
            if speakers is not None and not isinstance(speakers, list):
                return jsonify({"error": "invalid_speakers_payload", "message": "speakers deve ser uma lista"}), 400

            desired_pairs = set()
            uids, src_langs = set(), set()
            for i, item in enumerate(speakers or []):
                if not isinstance(item, dict):
                    return jsonify({"error": "invalid_speakers_payload", "message": f"item {i} deve ser objeto"}), 400
                uid, src = item.get("user_id"), item.get("source_language_id")
                try:
                    uid, src = int(uid), int(src)
                except (TypeError, ValueError):
                    return jsonify({"error": "invalid_speakers_payload", "message": f"item {i}: user_id/source devem ser inteiros"}), 400
                desired_pairs.add((uid, src))
                uids.add(uid) 
                src_langs.add(src)

            users_map = fetch_users_map(uids)
            missing_u = sorted(uids - set(users_map.keys()))
            if missing_u:
                return jsonify({"error": "invalid_speaker_ids", "missing_user_ids": missing_u}), 400
            not_speakers = sorted([uid for uid, u in users_map.items() if not u.is_speaker])
            if not_speakers:
                return jsonify({"error": "invalid_speaker_role", "user_ids": not_speakers}), 400

            if src_langs:
                found_src = set(g.db.execute(select(Language.id).where(Language.id.in_(src_langs))).scalars().all())
                missing_src = sorted(src_langs - found_src)
                if missing_src:
                    return jsonify({"error": "invalid_language_ids", "missing_language_ids": missing_src}), 400

            if speakers is not None:
                if desired_pairs:
                    g.db.execute(
                        delete(LanguageRoomUser).where(
                            LanguageRoomUser.room_id == room.id,
                            LanguageRoomUser.role == "speaker",
                            LanguageRoomUser.target_language_id.is_(None),
                            tuple_(
                                LanguageRoomUser.user_id,
                                LanguageRoomUser.source_language_id,
                            ).notin_(list(desired_pairs)),
                        )
                    )
                else:
                    g.db.execute(
                        delete(LanguageRoomUser).where(
                            LanguageRoomUser.room_id == room.id,
                            LanguageRoomUser.role == "speaker",
                            LanguageRoomUser.target_language_id.is_(None),
                        )
                    )

            existing_pairs = set(
                g.db.execute(
                    select(
                        LanguageRoomUser.user_id,
                        LanguageRoomUser.source_language_id,
                    ).where(
                        LanguageRoomUser.room_id == room.id,
                        LanguageRoomUser.role == "speaker",
                        LanguageRoomUser.target_language_id.is_(None),
                    )
                ).all()
            )
            for (uid, src) in (desired_pairs - existing_pairs):
                g.db.add(LanguageRoomUser(
                    room_id=room.id, user_id=uid, role="speaker",
                    source_language_id=src, target_language_id=None,
                ))

        g.db.flush()
        g.db.commit()
        g.db.refresh(room)

        return jsonify({
            "id": room.id, "name": room.name, "code": room.code, "description": room.description,
        }), 200
    
    @bp.route("/<int:room_id>", methods=["DELETE"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def delete_room(room_id: int):
        room = g.db.get(Room, room_id)
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        g.db.execute(
            delete(LanguageRoomUser).where(
                LanguageRoomUser.room_id == room.id
            )
        )

        g.db.delete(room)
        g.db.commit()

        return "", 204
    
    @bp.route("/<int:room_id>", methods=["GET"], strict_slashes=False)
    @auth_required()
    def get_room(room_id: int):
        stmt = (
            select(Room)
            .options(
                joinedload(Room.language_room_users)
                    .joinedload(LanguageRoomUser.user)
                    .joinedload(User.speaker),
                joinedload(Room.language_room_users).joinedload(LanguageRoomUser.source_language),
                joinedload(Room.language_room_users).joinedload(LanguageRoomUser.target_language),
            )
            .where(Room.id == room_id)
        )
        room = g.db.execute(stmt).scalars().first()
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        speakers_by_user: dict[int, dict] = {}
        translators_by_user: dict[int, dict] = {}

        for lru in room.language_room_users:
            u = lru.user
            if lru.role == "speaker":
                entry = speakers_by_user.setdefault(u.id, {
                    "user_id": u.id,
                    "name": u.name,
                    "bio": getattr(getattr(u, "speaker", None), "bio", None),
                    "languages": [],
                    "_lang_ids": set(),
                })
                src = lru.source_language
                if src and src.id not in entry["_lang_ids"]:
                    entry["_lang_ids"].add(src.id)
                    entry["languages"].append({
                        "id": src.id,
                        "name": src.name,
                        "code": src.code,
                    })

            elif lru.role == "translator":
                entry = translators_by_user.setdefault(u.id, {
                    "user_id": u.id,
                    "name": u.name,
                    "pairs": [],
                    "_pair_keys": set()
                })
                src = lru.source_language
                tgt = lru.target_language
                if src and tgt:
                    key = (src.id, tgt.id)
                    if key not in entry["_pair_keys"]:
                        entry["_pair_keys"].add(key)
                        entry["pairs"].append({
                            "source": {"id": src.id, "name": src.name, "code": src.code},
                            "target": {"id": tgt.id, "name": tgt.name, "code": tgt.code},
                        })

        for d in speakers_by_user.values():
            d.pop("_lang_ids", None)
        for d in translators_by_user.values():
            d.pop("_pair_keys", None)

        return jsonify({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "code": room.code,
            "speakers": list(speakers_by_user.values()),
            "translators": list(translators_by_user.values()),
        }), 200

    @bp.route("/<string:room_code>", methods=["GET"], strict_slashes=False)
    def get_room_by_code(room_code: str):
        code = (room_code or "").strip()
        stmt = (
            select(Room)
            .options(
                joinedload(Room.language_room_users)
                    .joinedload(LanguageRoomUser.user)
                    .joinedload(User.speaker),
                joinedload(Room.language_room_users).joinedload(LanguageRoomUser.source_language),
                joinedload(Room.language_room_users).joinedload(LanguageRoomUser.target_language),
            )
            .where(Room.code == code)
        )
        room = g.db.execute(stmt).scalars().first()
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        speakers_by_user: dict[int, dict] = {}
        translators_by_user: dict[int, dict] = {}

        for lru in room.language_room_users:
            u = lru.user
            if lru.role == "speaker":
                entry = speakers_by_user.setdefault(u.id, {
                    "user_id": u.id,
                    "name": u.name,
                    "bio": getattr(getattr(u, "speaker", None), "bio", None),
                    "languages": [],
                    "_lang_ids": set(),
                })
                src = lru.source_language
                if src and src.id not in entry["_lang_ids"]:
                    entry["_lang_ids"].add(src.id)
                    entry["languages"].append({
                        "name": src.name,
                        "code": src.code,
                    })

            elif lru.role == "translator":
                entry = translators_by_user.setdefault(u.id, {
                    "user_id": u.id,
                    "name": u.name,
                    "pairs": [],
                    "_pair_keys": set(),
                })
                src = lru.source_language
                tgt = lru.target_language
                if src and tgt:
                    key = (src.id, tgt.id)
                    if key not in entry["_pair_keys"]:
                        entry["_pair_keys"].add(key)
                        entry["pairs"].append({
                            "source": {"name": src.name, "code": src.code},
                            "target": {"name": tgt.name, "code": tgt.code},
                        })

        for d in speakers_by_user.values():
            d.pop("_lang_ids", None)
        for d in translators_by_user.values():
            d.pop("_pair_keys", None)

        return jsonify({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "code": room.code,
            "speakers": list(speakers_by_user.values()),
            "translators": list(translators_by_user.values()),
        }), 200

    app.register_blueprint(bp)
    return app

app = create_app()
