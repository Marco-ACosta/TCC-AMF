from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from db_core.models.room_speaker import RoomSpeaker
from db_core.models.room_translator import RoomTranslator
from db_core.models.speaker import Speaker
from db_core.models.translator import Translator
from flask import Blueprint, Flask, g, jsonify
from db.session import SessionLocal
from db_core.auth import auth_required
from db_core.models.room import Room
from pydantic import BaseModel, Field
from db_core.validation import parse_body
import rstr

class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=255)
    translators_ids: Optional[List[int]] = None 
    speakers_ids: Optional[List[int]] = None 

class RoomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    translators_ids: Optional[List[int]] = None 
    speakers_ids: Optional[List[int]] = None

def __generate_room_code__():
    "Gera o código de acesso a sala"
    return rstr.xeger(r"[A-Z]{4}-[A-Z]{4}")

def _generate_unique_code(db):
    while True:
        code = __generate_room_code__()
        exists = db.query(Room.id).filter(Room.code == code).first()
        if not exists:
            return code

def create_app():
    app = Flask(__name__)
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

    @bp.route("/", methods=["GET"], strict_slashes=False)
    @auth_required()
    def list_rooms():
        user = getattr(g, "user", None) or {}
        roles = user.get("roles") or []

        if "admin" in roles:
            rooms = g.db.execute(select(Room)).scalars().all()
            return jsonify([{"id": r.id, "name": r.name} for r in rooms]), 200

        sub = user.get("sub")
        try:
            current_user_id = int(sub)
        except (TypeError, ValueError):
            return jsonify({
                "error": "invalid_user_id",
                "message": "o 'sub' do usuário deve ser inteiro para comparar com translators.user_id/speakers.user_id",
                "received_sub": sub,
            }), 400

        t_exists = (
            select(1)
            .select_from(RoomTranslator)
            .join(Translator, RoomTranslator.translator_id == Translator.id)
            .where(RoomTranslator.room_id == Room.id, Translator.user_id == current_user_id)
        )
        s_exists = (
            select(1)
            .select_from(RoomSpeaker)
            .join(Speaker, RoomSpeaker.speaker_id == Speaker.id)
            .where(RoomSpeaker.room_id == Room.id, Speaker.user_id == current_user_id)
        )

        rooms = g.db.execute(
            select(Room).where(or_(t_exists.exists(), s_exists.exists()))
        ).scalars().all()

        return jsonify([{"id": r.id, "name": r.name} for r in rooms]), 200

    @bp.route("/", methods=["POST"], strict_slashes=False)
    @parse_body(RoomCreate)
    @auth_required(roles_any=["admin"])
    def create_room():
        body: RoomCreate = g.body

        room = Room(
            name=(body.name or "").strip(),
            code=_generate_unique_code(db=g.db),
            description=(body.description or "").strip() if body.description is not None else None,
        )

        if body.translators_ids is not None:
            target_user_ids = sorted({int(uid) for uid in body.translators_ids if uid})
            translators = []
            if target_user_ids:
                translators = list(
                    g.db.execute(
                        select(Translator).where(Translator.user_id.in_(target_user_ids))
                    ).scalars()
                )

            found_user_ids = {t.user_id for t in translators}
            missing = sorted(set(target_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_translator_ids",
                    "message": "one or more translator user_ids do not exist",
                    "received_user_ids": target_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400

            room.room_translators = [RoomTranslator(room=room, translator=t) for t in translators]

        if body.speakers_ids is not None:
            target_user_ids = sorted({int(uid) for uid in body.speakers_ids if uid})
            speakers = []
            if target_user_ids:
                speakers = list(
                    g.db.execute(
                        select(Speaker).where(Speaker.user_id.in_(target_user_ids))
                    ).scalars()
                )

            found_user_ids = {s.user_id for s in speakers}
            missing = sorted(set(target_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_speaker_ids",
                    "message": "one or more speaker user_ids do not exist",
                    "received_user_ids": target_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400

            room.room_speakers = [RoomSpeaker(room=room, speaker=s) for s in speakers]

        g.db.add(room)
        g.db.commit()
        g.db.refresh(room)

        return jsonify({"id": room.id, "name": room.name, "code": room.code}), 201

    
    @bp.route("/<int:room_id>", methods=["PUT"], strict_slashes=False)
    @parse_body(RoomUpdate)
    @auth_required(roles_any=["admin"])
    def update_room(room_id: int):
        body: RoomUpdate = g.body
        room = g.db.query(Room).get(room_id)

        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        if body.name is not None:
            room.name = body.name.strip()

        if body.description is not None:
            room.description = body.description.strip()

        if body.translators_ids is not None:
            target_user_ids = sorted({sid for sid in body.translators_ids if sid})
            translators = []
            if target_user_ids:
                translators = list(
                    g.db.execute(
                        select(Translator).where(Translator.user_id.in_(target_user_ids))
                    ).scalars()
                )
            
            found_user_ids = {s.user_id for s in translators}
            missing = sorted(set(target_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_translator_ids",
                    "message": "one or more translator user_ids do not exist",
                    "received_user_ids": target_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400
            current_by_translator_id = {rs.translator_id: rs for rs in room.room_translators}
            desired_ids = {s.id for s in translators}

            for translator_id, rs in list(current_by_translator_id.items()):
                if translator_id not in desired_ids:
                    g.db.delete(rs)
            
            existing_ids = set(current_by_translator_id.keys())
            for s in translators:
                if s.id not in existing_ids:
                    room.room_translators.append(RoomTranslator(room=room, translator=s))

        if body.speakers_ids is not None:
            target_user_ids = sorted({sid for sid in body.speakers_ids if sid})
            speakers = []
            if target_user_ids:
                speakers = list(
                    g.db.execute(
                        select(Speaker).where(Speaker.user_id.in_(target_user_ids))
                    ).scalars()
                )
            found_user_ids = {s.user_id for s in speakers}
            missing = sorted(set(target_user_ids) - found_user_ids)
            if missing:
                return jsonify({
                    "error": "invalid_speaker_ids",
                    "message": "one or more speaker user_ids do not exist",
                    "received_user_ids": target_user_ids,
                    "found_user_ids": sorted(found_user_ids),
                    "missing_user_ids": missing,
                }), 400

            current_by_speaker_id = {rs.speaker_id: rs for rs in room.room_speakers}
            desired_ids = {s.id for s in speakers}

            for speaker_id, rs in list(current_by_speaker_id.items()):
                if speaker_id not in desired_ids:
                    g.db.delete(rs)

            existing_ids = set(current_by_speaker_id.keys())
            for s in speakers:
                if s.id not in existing_ids:
                    room.room_speakers.append(RoomSpeaker(room=room, speaker=s))


        g.db.add(room)
        g.db.commit()
        g.db.refresh(room)

        return jsonify({"id": room.id, "name": room.name, "code": room.code}), 200
    
    @bp.route("/<int:room_id>", methods=["DELETE"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def delete_room(room_id: int):
        room = g.db.query(Room).get(room_id)
        
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        if hasattr(room, "speakers") and room.speakers is not None:
            room.speakers.clear()
        
        if hasattr(room, "translators") and room.translators is not None:
            room.translators.clear()
        
        g.db.flush()
        g.db.delete(room)
        g.db.commit()

        return "", 204
    
    @bp.route("/<int:room_id>", methods=["GET"], strict_slashes=False)
    @auth_required()
    def get_room(room_id: int):
        stmt = (
        select(Room)
        .where(Room.id == room_id)
            .options(
                selectinload(Room.room_speakers).selectinload(RoomSpeaker.speaker),
                selectinload(Room.room_translators).selectinload(RoomTranslator.translator),
            )
        )
        room = g.db.execute(stmt).scalars().first()
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        return jsonify({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "code": room.code,
            "speakers": [{
                "id": speaker.id,
                "name": speaker.user.name,
                "bio": speaker.bio,
                "languages": [{
                    "id": language.id,
                    "name": language.name,
                    "code": language.code,
                } for language in speaker.languages]
            } for speaker in room.speakers],
            "translators": [{
                "id": translator.id,
                "name": translator.user.name,
                "languages": [{
                    "id": language.id,
                    "name": language.name,
                    "code": language.code,
                } for language in translator.languages]
            } for translator in room.translators],
        }), 200

    @bp.route("/<string:room_code>", methods=["GET"], strict_slashes=False)
    def get_room_by_code(room_code: str):
        stmt = (
        select(Room)
        .where(Room.code == room_code)
            .options(
                selectinload(Room.room_speakers).selectinload(RoomSpeaker.speaker),
                selectinload(Room.room_translators).selectinload(RoomTranslator.translator),
            )
        )
        room = g.db.execute(stmt).scalars().first()
        if not room:
            return jsonify({"error": "not_found", "message": "room not found"}), 404

        return jsonify({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "code": room.code,
            "speakers": [{
                "id": speaker.id,
                "name": speaker.user.name,
                "bio": speaker.bio,
                "languages": [{
                    "id": language.id,
                    "name": language.name,
                    "code": language.code,
                } for language in speaker.languages]
            } for speaker in room.speakers],
            "translators": [{
                "id": translator.id,
                "name": translator.user.name,
                "languages": [{
                    "id": language.id,
                    "name": language.name,
                    "code": language.code,
                } for language in translator.languages]
            } for translator in room.translators],
        }), 200
        
    app.register_blueprint(bp)
    return app



app = create_app()
