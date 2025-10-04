import os
import re
import json
import logging
from datetime import datetime
from collections import defaultdict

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "text").lower()
ENGINEIO_LOGS = os.getenv("ENGINEIO_LOGS", "0") == "1"

RESERVED_LOG_KEYS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename", "module",
    "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created", "msecs",
    "relativeCreated", "thread", "threadName", "processName", "process"
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
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s"))
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
    engineio_logger=socketio_logger
)

room_members = defaultdict(set)   
sid_rooms = defaultdict(set)      

def _candidate_type(candidate_obj) -> str | None:
    """
    Recebe o objeto candidate vindo do browser (RTCICECandidate) ou string, e extrai o 'typ'.
    Ex.: 'candidate:... typ srflx ...' -> 'srflx'
    """
    if isinstance(candidate_obj, dict):
        cand_str = candidate_obj.get("candidate", "") or ""
    elif isinstance(candidate_obj, str):
        cand_str = candidate_obj
    else:
        cand_str = ""
    m = re.search(r"\btyp\s+(\w+)\b", cand_str)
    return m.group(1) if m else None

def _sdp_info(desc: dict) -> dict:
    """
    Retorna metadados do SDP sem logar o conteúdo completo (evita logs gigantes/sensíveis).
    """
    if not isinstance(desc, dict):
        return {"type": None, "sdp_len": 0}
    sdp = desc.get("sdp", "") or ""
    return {"type": desc.get("type"), "sdp_len": len(sdp)}

def _log_room_state(room: str):
    size = len(room_members[room])
    log.info(
        "room_state",
        extra={"event": "room_state", "room": room, "size": size, "members": list(room_members[room])}
    )

@app.get("/healthz")
def healthz():
    return jsonify(status="ok")

@socketio.on("connect")
def on_connect():
    log.info(
        "client_connected",
        extra={"event": "connect", "sid": request.sid, "ip": request.remote_addr}
    )

@socketio.on("disconnect")
def on_disconnect(reason=None):
    sid = request.sid
    rooms_to_remove = list(sid_rooms.get(sid, []))
    for room in rooms_to_remove:
        if sid in room_members[room]:
            room_members[room].remove(sid)
            _log_room_state(room)
            emit("peer-left", {"sid": sid}, room=room, include_self=False)
        sid_rooms[sid].discard(room)
    log.info(
        "client_disconnected",
        extra={"event": "disconnect", "sid": sid, "rooms": rooms_to_remove, "reason": reason}
    )

@socketio.on("join")
def on_join(data):
    room = data.get("room")
    join_room(room)
    room_members[room].add(request.sid)
    sid_rooms[request.sid].add(room)
    log.info(
        "peer_joined",
        extra={"event": "join", "sid": request.sid, "room": room, "room_size": len(room_members[room])}
    )
    _log_room_state(room)

    emit(
        "room-info",
        {"room": room, "members": list(room_members[room])},
        to=request.sid
    )

    emit("peer-joined", {"sid": request.sid}, room=room, include_self=False)

@socketio.on("leave")
def on_leave(data):
    room = data.get("room")
    leave_room(room)
    if request.sid in room_members[room]:
        room_members[room].remove(request.sid)
    sid_rooms[request.sid].discard(room)
    log.info(
        "peer_left",
        extra={"event": "leave", "sid": request.sid, "room": room, "room_size": len(room_members[room])}
    )
    _log_room_state(room)
    emit("peer-left", {"sid": request.sid}, room=room)

@socketio.on("offer")
def on_offer(data):
    room = data.get("room")
    offer_meta = _sdp_info(data.get("offer"))
    log.info(
        "offer_forwarded",
        extra={"event": "offer", "sid": request.sid, "room": room, **offer_meta}
    )
    emit("offer", data, room=room, include_self=False)

@socketio.on("answer")
def on_answer(data):
    room = data.get("room")
    answer_meta = _sdp_info(data.get("answer"))
    log.info(
        "answer_forwarded",
        extra={"event": "answer", "sid": request.sid, "room": room, **answer_meta}
    )
    emit("answer", data, room=room, include_self=False)

@socketio.on("ice-candidate")
def on_ice_candidate(data):
    room = data.get("room")
    cand = data.get("candidate")
    cand_type = _candidate_type(cand)
    log.debug(
        "ice_candidate_forwarded",
        extra={"event": "ice-candidate", "sid": request.sid, "room": room, "candidate_type": cand_type}
    )
    emit("ice-candidate", data, room=room, include_self=False)

@socketio.on_error_default
def default_error_handler(e):
    log.exception("socketio_handler_error", extra={"event": "error", "sid": request.sid})

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5002"))
    log.info("starting_signaling_server", extra={"host": host, "port": port, "log_level": LOG_LEVEL, "engineio_logs": ENGINEIO_LOGS})
    socketio.run(app, host=host, port=port)
