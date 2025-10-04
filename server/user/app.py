from enum import Enum
from typing import Optional
from flask import Flask, g, jsonify, Blueprint
from db.session import SessionLocal
from pydantic import BaseModel, Field
from db_core.auth import auth_required
from db_core.validation import parse_body
from db_core.services.user_service import create_user, authenticate
from db_core.security.token import create_access_token

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
   

class UserUpdate(BaseModel):
    name: Optional[str] = Field(min_length=1, max_length=120)
    email: Optional[str] = Field(max_length=320)
    password: Optional[str] = Field(min_length=8, max_length=120)
    user_type: Optional[UserType]
    languages: Optional[list[int]] | None = Field(default_factory=list)
    bio: Optional[str] = Field(default=None, max_length=320)

class UserLogin(BaseModel):
    email: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=120)

def create_app():
    app = Flask(__name__)
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

    @bp.route("/", methods=["GET"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def list_user():
        pass

    @bp.route("/<int:user_id>", methods=["GET"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    def get_user():
        pass

    @bp.route("/<int:user_id>", methods=["PUT"], strict_slashes=False)
    @auth_required(roles_any=["admin"])
    @parse_body(UserUpdate)
    def update_user():
        pass

    def delete_user():
        pass

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
                "fresh": True,
            },
        )
        return jsonify({"access_token": token, "token_type": "bearer"})

    app.register_blueprint(bp)
    return app


app = create_app()
