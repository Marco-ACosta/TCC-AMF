import json
import logging
import os
import re
from collections import defaultdict
from datetime import datetime
from typing import Any

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room

# =========================
# Logging
# =========================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "text").lower()
ENGINEIO_LOGS = os.getenv("ENGINEIO_LOGS", "0") == "1"

RESERVED_LOG_KEYS = {
    "name",
    "msg",
    "args",
    "levelname",
    "levelno",
    "pathname",
    "filename",
    "module",
    "exc_info",
    "exc_text",
    "stack_info",
    "lineno",
    "funcName",
    "created",
    "msecs",
    "relativeCreated",
    "thread",
    "threadName",
    "processName",
    "process",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        extra = {k: v for k, v in record.__dict__.items() if k not in RESERVED_LOG_KEYS}
        if extra:
            payload.update(extra)
        return json.dumps(payload, ensure_ascii=False)


root_logger = logging.getLogger()
root_logger.handlers.clear()
handler = logging.StreamHandler()
if LOG_FORMAT == "json":
    handler.setFormatter(JsonFormatter())
else:
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
    )
root_logger.addHandler(handler)
root_logger.setLevel(LOG_LEVEL)

log = logging.getLogger("webrtc_signaling")

app = Flask(__name__)
socketio_logger = log if ENGINEIO_LOGS else False
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    logger=False,
    engineio_logger=socketio_logger,
    path="/signal",
)

room_members: dict[str, set[str]] = defaultdict(set)  # room -> {sid, ...}
sid_rooms: dict[str, set[str]] = defaultdict(set)  # sid  -> {room, ...}
sid_meta: dict[str, dict[str, Any]] = defaultdict(dict)


# =========================
# Helpers
# =========================
def _candidate_type(candidate_obj) -> str | None:
    if isinstance(candidate_obj, dict):
        cand_str = candidate_obj.get("candidate", "") or ""
    elif isinstance(candidate_obj, str):
        cand_str = candidate_obj
    else:
        cand_str = ""
    m = re.search(r"\btyp\s+(\w+)\b", cand_str)
    return m.group(1) if m else None


def _sdp_info(desc: dict) -> dict:
    if not isinstance(desc, dict):
        return {"type": None, "sdp_len": 0}
    sdp = desc.get("sdp", "") or ""
    return {"type": desc.get("type"), "sdp_len": len(sdp)}


def _log_room_state(room: str):
    size = len(room_members[room])
    log.info(
        "room_state",
        extra={
            "event": "room_state",
            "room": room,
            "size": size,
            "members": list(room_members[room]),
        },
    )


def _channel_name(room: str, src_code: str) -> str:
    """Nome do subroom do canal por linguagem de origem."""
    return f"{room}::src::{src_code}"


def _extract_sources(meta: dict) -> set[str]:
    """
    Calcula os canais de origem aos quais o socket deve pertencer, a partir de:
      - meta["source"] (origem atual explícita)
      - meta["pairs"][i]["source"]["code"] (lista de pares)
    """
    out: set[str] = set()
    src_single = meta.get("source")
    if isinstance(src_single, str) and src_single.strip():
        out.add(src_single.strip())

    pairs = meta.get("pairs") or []
    if isinstance(pairs, list):
        for p in pairs:
            try:
                code = (p or {}).get("source", {}).get("code")
                if isinstance(code, str) and code.strip():
                    out.add(code.strip())
            except Exception:
                continue
    return out


def _member_payload(sid: str) -> dict:
    """
    Payload público do membro para room-info/peer-joined.
    Expõe apenas campos relevantes.
    """
    meta = dict(sid_meta.get(sid, {}))
    payload = {"id": sid}
    for k in ("role", "pairs", "want", "source", "sources"):
        if k in meta:
            payload[k] = meta[k]
    return payload


def _members_payload(room: str) -> list[dict]:
    return [_member_payload(s) for s in room_members[room]]


def _in_room(sid: str, room: str) -> bool:
    return sid in room_members.get(room, set())


def _augment_with_sender_meta(data: dict) -> dict:
    sender_meta = sid_meta.get(request.sid, {})
    meta = dict(data.get("meta", {}))
    if "role" not in meta and "role" in sender_meta:
        meta["role"] = sender_meta["role"]
    if "pairs" not in meta and "pairs" in sender_meta:
        meta["pairs"] = sender_meta["pairs"]
    if "source" not in meta and "source" in sender_meta:
        meta["source"] = sender_meta["source"]
    if "sources" not in meta and "sources" in sender_meta:
        meta["sources"] = sender_meta["sources"]

    data = dict(data)
    data["from"] = data.get("from") or request.sid
    data["meta"] = meta
    return data


def _join_source_channels_for_sid(sid: str, room: str, sources: set[str]):
    """Inscreve o sid nos subrooms por origem para aquele room."""
    for src in sources:
        ch = _channel_name(room, src)
        join_room(ch, sid=sid)
        log.debug(
            "channel_join",
            extra={"event": "channel_join", "sid": sid, "room": room, "channel": ch},
        )


def _leave_source_channels_for_sid(sid: str, room: str, sources: set[str]):
    """Remove o sid dos subrooms por origem para aquele room."""
    for src in sources:
        ch = _channel_name(room, src)
        leave_room(ch, sid=sid)
        log.debug(
            "channel_leave",
            extra={"event": "channel_leave", "sid": sid, "room": room, "channel": ch},
        )


@app.get("/healthz")
def healthz():
    return jsonify(status="ok")


@socketio.on("connect")
def on_connect():
    log.info(
        "client_connected",
        extra={"event": "connect", "sid": request.sid, "ip": request.remote_addr},
    )


@socketio.on("disconnect")
def on_disconnect(reason=None):
    sid = request.sid
    meta = sid_meta.get(sid, {})
    old_sources = _extract_sources(meta)
    rooms_to_remove = list(sid_rooms.get(sid, []))
    for room in rooms_to_remove:
        _leave_source_channels_for_sid(sid, room, old_sources)
        if sid in room_members[room]:
            room_members[room].remove(sid)
            emit(
                "peer-left",
                {"member": _member_payload(sid)},
                room=room,
                include_self=False,
            )
            emit(
                "room-info",
                {
                    "room": room,
                    "room_size": len(room_members[room]),
                    "members": _members_payload(room),
                },
                room=room,
            )
        sid_rooms[sid].discard(room)

    sid_meta.pop(sid, None)
    log.info(
        "client_disconnected",
        extra={
            "event": "disconnect",
            "sid": sid,
            "rooms": rooms_to_remove,
            "reason": reason,
        },
    )


@socketio.on("join")
def on_join(data):
    """
    Espera:
      room: str
      role: "speaker" | "translator" | "listener" | "admin" | "user"
      pairs: [{source:{code}, target:{code}}, ...]  (opcional)
      source: "xx-YY" (origem selecionada, opcional)
      want: "xx-YY"   (listener)
    """
    room = data.get("room")
    role = data.get("role")
    pairs = data.get("pairs")
    source = data.get("source")
    want = data.get("want") or data.get("target") or data.get("target_code")

    join_room(room)
    room_members[room].add(request.sid)
    sid_rooms[request.sid].add(room)

    meta = sid_meta.get(request.sid, {})
    if role is not None:
        meta["role"] = role
    if pairs is not None:
        meta["pairs"] = pairs
    if source is not None:
        meta["source"] = source
    if want is not None:
        meta["want"] = want

    sources = _extract_sources(meta)
    if sources:
        meta["sources"] = sorted(sources)
        sid_meta[request.sid] = meta
        _join_source_channels_for_sid(request.sid, room, sources)
    else:
        sid_meta[request.sid] = meta

    log.info(
        "peer_joined",
        extra={
            "event": "join",
            "sid": request.sid,
            "room": room,
            "room_size": len(room_members[room]),
            "role": role,
            "sources": list(sources),
        },
    )
    _log_room_state(room)

    emit(
        "room-info",
        {
            "room": room,
            "room_size": len(room_members[room]),
            "members": _members_payload(room),
        },
        to=request.sid,
    )
    emit(
        "peer-joined",
        {"member": _member_payload(request.sid)},
        room=room,
        include_self=False,
    )
    emit(
        "room-info",
        {
            "room": room,
            "room_size": len(room_members[room]),
            "members": _members_payload(room),
        },
        room=room,
        include_self=False,
    )


@socketio.on("leave")
def on_leave(data):
    room = data.get("room")
    meta = sid_meta.get(request.sid, {})
    old_sources = _extract_sources(meta)
    _leave_source_channels_for_sid(request.sid, room, old_sources)

    leave_room(room)
    if request.sid in room_members[room]:
        room_members[room].remove(request.sid)
    sid_rooms[request.sid].discard(room)

    log.info(
        "peer_left",
        extra={
            "event": "leave",
            "sid": request.sid,
            "room": room,
            "room_size": len(room_members[room]),
        },
    )
    _log_room_state(room)

    emit("peer-left", {"member": _member_payload(request.sid)}, room=room)
    emit(
        "room-info",
        {
            "room": room,
            "room_size": len(room_members[room]),
            "members": _members_payload(room),
        },
        room=room,
    )


@socketio.on("update-meta")
def on_update_meta(data):
    """
    Permite ao cliente atualizar seus metadados (ex.: translator muda 'source' ou 'pairs', listener muda 'want').
    Exemplo:
      socket.emit("update-meta", { source: "pt-PT" })
    """
    sid = request.sid
    meta = sid_meta.get(sid, {})
    before_sources = _extract_sources(meta)

    for key in ("role", "pairs", "want", "target", "target_code", "source"):
        if key in data and data[key] is not None:
            if key in ("target", "target_code"):
                meta["want"] = data[key]
            else:
                meta[key] = data[key]
    sid_meta[sid] = meta

    after_sources = _extract_sources(meta)
    for room in list(sid_rooms.get(sid, [])):
        for src in before_sources - after_sources:
            _leave_source_channels_for_sid(sid, room, {src})
        for src in after_sources - before_sources:
            _join_source_channels_for_sid(sid, room, {src})
        meta["sources"] = sorted(after_sources)
        sid_meta[sid] = meta

        emit(
            "room-info",
            {
                "room": room,
                "room_size": len(room_members[room]),
                "members": _members_payload(room),
            },
            room=room,
        )

    log.info(
        "meta_updated",
        extra={
            "event": "update-meta",
            "sid": sid,
            "meta": {k: meta.get(k) for k in ("role", "want", "source", "sources")},
        },
    )


@socketio.on("list-members")
def on_list_members(data):
    room = data.get("room")
    emit(
        "room-info",
        {
            "room": room,
            "room_size": len(room_members[room]),
            "members": _members_payload(room),
        },
        to=request.sid,
    )


# =========================
# Signaling
# =========================
@socketio.on("offer")
def on_offer(data):
    room = data.get("room")
    to_sid = data.get("to")
    offer_meta = _sdp_info(data.get("offer"))
    data = _augment_with_sender_meta(data)
    if to_sid:
        if not _in_room(to_sid, room):
            log.warning(
                "offer_target_not_in_room",
                extra={
                    "event": "offer",
                    "sid": request.sid,
                    "room": room,
                    "to": to_sid,
                },
            )
            return
        log.info(
            "offer_routed_1to1",
            extra={
                "event": "offer",
                "sid": request.sid,
                "room": room,
                "to": to_sid,
                **offer_meta,
                "src": data.get("meta", {}).get("src"),
            },
        )
        emit("offer", data, to=to_sid)
    else:
        log.info(
            "offer_broadcast",
            extra={"event": "offer", "sid": request.sid, "room": room, **offer_meta},
        )
        emit("offer", data, room=room, include_self=False)


@socketio.on("answer")
def on_answer(data):
    room = data.get("room")
    to_sid = data.get("to")
    answer_meta = _sdp_info(data.get("answer"))
    data = _augment_with_sender_meta(data)

    if to_sid:
        if not _in_room(to_sid, room):
            log.warning(
                "answer_target_not_in_room",
                extra={
                    "event": "answer",
                    "sid": request.sid,
                    "room": room,
                    "to": to_sid,
                },
            )
            return
        log.info(
            "answer_routed_1to1",
            extra={
                "event": "answer",
                "sid": request.sid,
                "room": room,
                "to": to_sid,
                **answer_meta,
                "src": data.get("meta", {}).get("src"),
            },
        )
        emit("answer", data, to=to_sid)
    else:
        log.info(
            "answer_broadcast",
            extra={"event": "answer", "sid": request.sid, "room": room, **answer_meta},
        )
        emit("answer", data, room=room, include_self=False)


@socketio.on("ice-candidate")
def on_ice_candidate(data):
    room = data.get("room")
    to_sid = data.get("to")
    cand = data.get("candidate")
    cand_type = _candidate_type(cand)
    data = _augment_with_sender_meta(data)

    if to_sid:
        if not _in_room(to_sid, room):
            log.warning(
                "ice_target_not_in_room",
                extra={
                    "event": "ice-candidate",
                    "sid": request.sid,
                    "room": room,
                    "to": to_sid,
                },
            )
            return
        log.debug(
            "ice_routed_1to1",
            extra={
                "event": "ice-candidate",
                "sid": request.sid,
                "room": room,
                "to": to_sid,
                "candidate_type": cand_type,
                "src": data.get("meta", {}).get("src"),
            },
        )
        emit("ice-candidate", data, to=to_sid)
    else:
        log.debug(
            "ice_broadcast",
            extra={
                "event": "ice-candidate",
                "sid": request.sid,
                "room": room,
                "candidate_type": cand_type,
            },
        )
        emit("ice-candidate", data, room=room, include_self=False)


@socketio.on_error_default
def default_error_handler(e):
    log.exception(
        "socketio_handler_error", extra={"event": "error", "sid": request.sid}
    )


# =========================
# Main
# =========================
if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5002"))
    log.info(
        "starting_signaling_server",
        extra={
            "host": host,
            "port": port,
            "log_level": LOG_LEVEL,
            "engineio_logs": ENGINEIO_LOGS,
        },
    )
    socketio.run(app, host=host, port=port)
