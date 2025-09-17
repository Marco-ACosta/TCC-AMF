from flask import Flask, g, jsonify, request
from db.session import SessionLocal
from db_core.models.room import Room
from pydantic import BaseModel, Field
from db_core.validation import parse_body
import rstr

class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

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

    @app.get("/rooms")
    def list_rooms():
        rooms = g.db.query(Room).all()
        return jsonify([{"id": r.id, "name": r.name, "created_at": r.created_at, "updated_at": r.updated_at} for r in rooms])

    @app.post("/rooms")
    @parse_body(RoomCreate)
    def create_room():
        body: RoomCreate = g.body
        obj = Room(name=body.name, code=_generate_unique_code(db=g.db))
        g.db.add(obj)
        g.db.flush()
        return jsonify({"id": obj.id, "name": obj.name, "code": obj.code}), 201

    return app



app = create_app()
