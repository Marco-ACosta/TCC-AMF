import os
from flask import Flask
from flask_cors import CORS

def setup_cors(app: Flask) -> None:
    cors_kwargs = {
        "resources":{r"/*": {"origins": "*"}},
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type", "X-Requested-With"],
        "supports_credentials": bool(int(os.getenv("CORS_SUPPORTS_CREDENTIALS", "1"))),
        "max_age": 86400,
    }

    CORS(app, **cors_kwargs)

    @app.after_request
    def add_vary_origin(resp):
        resp.headers.add("Vary", "Origin")
        return resp
