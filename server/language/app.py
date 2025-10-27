from flask import Blueprint, Flask, g, jsonify
from sqlalchemy import select

from db_core.auth import auth_required
from db_core.http.cors import setup_cors
from db_core.models.language import Language
from db.session import SessionLocal


def create_app(): 
    app = Flask(__name__)
    setup_cors(app)
    bp = Blueprint("language", __name__, url_prefix="/language")


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
    def list_languages():
        languages_q = select(Language).order_by(Language.id)
        languages = g.db.execute(languages_q).scalars().all()
        return jsonify([{"id": l.id, "name": l.name, "code": l.code} for l in languages]), 200

    app.register_blueprint(bp)
    return app

app = create_app()
