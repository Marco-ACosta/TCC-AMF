from functools import wraps
from flask import request, jsonify, g
from pydantic import BaseModel, ValidationError

def parse_body(model: type[BaseModel]):
    """Decora uma rota Flask e valida request.json com o Model."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                data = request.get_json(force=True, silent=False)
                obj = model.model_validate(data)  # Pydantic v2
            except ValidationError as e:
                return jsonify({"error": "validation_error", "detail": e.errors()}), 422
            except Exception:
                return jsonify({"error": "invalid_json"}), 400
            g.body = obj
            return fn(*args, **kwargs)
        return wrapper
    return decorator
