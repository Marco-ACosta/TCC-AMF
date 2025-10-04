from __future__ import annotations
import os
import time
from typing import Any, Dict, Optional
import jwt

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_PUBLIC_KEY_PEM = os.getenv("JWT_PUBLIC_KEY_PEM", "")
JWT_PRIVATE_KEY_PEM = os.getenv("JWT_PRIVATE_KEY_PEM", "")
JWT_ISS = os.getenv("JWT_ISS")
JWT_AUD = os.getenv("JWT_AUD")
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "3600"))

def create_access_token(subject: str, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    now = int(time.time())
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + JWT_TTL_SECONDS,
    }
    if JWT_ISS:
        payload["iss"] = JWT_ISS
    if JWT_AUD:
        payload["aud"] = JWT_AUD
    if extra_claims:
        payload.update(extra_claims)

    if JWT_ALGORITHM.upper().startswith("RS"):
        if not JWT_PRIVATE_KEY_PEM:
            raise RuntimeError("JWT_PRIVATE_KEY_PEM não configurado para algoritmo RS.")
        return jwt.encode(payload, JWT_PRIVATE_KEY_PEM, algorithm=JWT_ALGORITHM)
    else:
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {
        "algorithms": [JWT_ALGORITHM],
        "options": {"require": ["exp", "sub"]},
    }
    if JWT_AUD:
        kwargs["audience"] = JWT_AUD
    if JWT_ISS:
        kwargs["issuer"] = JWT_ISS

    if JWT_ALGORITHM.upper().startswith("RS"):
        if not JWT_PUBLIC_KEY_PEM:
            raise RuntimeError("JWT_PUBLIC_KEY_PEM não configurado para algoritmo RS.")
        return jwt.decode(token, JWT_PUBLIC_KEY_PEM, **kwargs)
    else:
        return jwt.decode(token, JWT_SECRET, **kwargs)
