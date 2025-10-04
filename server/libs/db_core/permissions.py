from __future__ import annotations
from typing import Dict, Set
from db_core.models.user import User

ROLE_SCOPES: Dict[str, Set[str]] = {
    "admin": {"*"},
    "speaker": {"speakers:read", "speakers:create", "speakers:update", "speakers:delete"},
    "translator": {"translators:read", "translators:create", "translators:update", "translators:delete"},
    "user": {"rooms:read", "rooms:create", "rooms:update", "rooms:delete"},
}

def _collect_roles(user: User) -> Set[str]:
    roles: Set[str] = set()
    if getattr(user, "is_admin", False):
        roles.add("admin")
    if getattr(user, "is_speaker", False):
        roles.add("speaker")
    if getattr(user, "is_translator", False):
        roles.add("translator")
    if not roles:
        roles.add("user")
    return roles

def _collect_scopes_from_roles(roles: Set[str]) -> Set[str]:
    scopes: Set[str] = set()
    for r in roles:
        scopes |= ROLE_SCOPES.get(r, set())
    return scopes

def compose_claims(user: User) -> Dict:
    roles = _collect_roles(user)
    scopes = _collect_scopes_from_roles(roles)

    extra_scopes = set(getattr(user, "extra_scopes", []) or [])
    revoked_scopes = set(getattr(user, "revoked_scopes", []) or [])

    if "*" not in scopes:
        scopes = (scopes | extra_scopes) - revoked_scopes

    return {
        "roles": sorted(roles),
        "scopes": ["*"] if "*" in scopes else sorted(scopes),
    }
