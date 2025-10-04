from __future__ import annotations
from functools import wraps
from typing import Iterable, Optional, Set, Callable, Dict, Any
from flask import request, jsonify, g
from jwt import ExpiredSignatureError, InvalidTokenError
from db_core.security.token import decode_token


def _json_error(status: int, code: str, message: str):
    return jsonify({"error": code, "message": message}), status


def _extract_bearer_token() -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    return token or None


def _has_all(have: Set[str], need: Set[str]) -> bool:
    return not need or need.issubset(have)


def _has_any(have: Set[str], any_of: Set[str]) -> bool:
    return not any_of or bool(have & any_of)


def auth_required(
    *,
    roles_all: Optional[Iterable[str]] = None,
    roles_any: Optional[Iterable[str]] = None,
    scopes_all: Optional[Iterable[str]] = None,
    scopes_any: Optional[Iterable[str]] = None,
    require_fresh: bool = False,
    policy: Optional[Callable[[Dict[str, Any]], bool]] = None,
) -> Callable:
    need_roles_all: Set[str] = set(roles_all or [])
    need_roles_any: Set[str] = set(roles_any or [])
    need_scopes_all: Set[str] = set(scopes_all or [])
    need_scopes_any: Set[str] = set(scopes_any or [])

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = _extract_bearer_token()
            if not token:
                return _json_error(401, "missing_token", "Cabeçalho Authorization Bearer ausente.")

            try:
                claims: Dict[str, Any] = decode_token(token)
            except ExpiredSignatureError:
                return _json_error(401, "token_expired", "O token expirou.")
            except InvalidTokenError as e:
                return _json_error(401, "invalid_token", f"Token inválido: {str(e)}")
            except Exception:
                return _json_error(401, "invalid_token", "Não foi possível validar o token.")

            roles: Set[str] = set(claims.get("roles") or [])
            scope_str = claims.get("scope") or ""
            scopes_list = claims.get("scopes") or []
            scopes: Set[str] = set(scope_str.split()) | set(scopes_list)

            bypass_scope_checks = "*" in scopes

            if require_fresh and not claims.get("fresh", False):
                return _json_error(401, "stale_token", "Token não é fresco para esta operação.")

            if not _has_all(roles, need_roles_all):
                return _json_error(403, "forbidden_role_all", "Faltam papéis obrigatórios.")
            if not _has_any(roles, need_roles_any):
                return _json_error(403, "forbidden_role_any", "Nenhum dos papéis exigidos foi encontrado.")

            if not bypass_scope_checks:
                if not _has_all(scopes, need_scopes_all):
                    return _json_error(403, "forbidden_scope_all", "Faltam escopos obrigatórios.")
                if not _has_any(scopes, need_scopes_any):
                    return _json_error(403, "forbidden_scope_any", "Nenhum dos escopos exigidos foi encontrado.")

            if policy and not policy(claims):
                return _json_error(403, "forbidden_policy", "A política de acesso negou esta operação.")

            g.user = {
                "sub": claims.get("sub"),
                "email": claims.get("email"),
                "roles": roles,
                "scopes": scopes,
                "claims": claims,
            }
            return fn(*args, **kwargs)
        return wrapper
    return decorator
