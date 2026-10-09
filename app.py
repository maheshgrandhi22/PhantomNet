import datetime
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

ATTACK_EVENTS = [
    { "source": "192.168.1.105", "dest": "10.0.0.4 (Honey)", "service": "SSH", "decision": "TARPIT", "severity": "HIGH" },
    { "source": "45.33.32.156", "dest": "10.0.0.8 (SQL)", "service": "POSTGRES", "decision": "BLOCKED", "severity": "CRITICAL" },
    { "source": "10.0.0.12", "dest": "10.0.0.1 (Gateway)", "service": "HTTP", "decision": "ALLOW", "severity": "LOW" }
]

HONEY_LOGS = [
    {"source": "203.0.113.42", "command": "uname -a", "timestamp": "21:40:12"},
    {"source": "192.168.1.105", "command": "cat /etc/passwd", "timestamp": "21:42:05"}
]

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "ONLINE",
        "system": "PhantomNet SOC WebSocket Server V2.0",
        "endpoints": [
            "/api/events",
            "/api/event",
            "/api/honey/command",
            "/api/sqli/intercept"
        ]
    }), 200


# Receive events from PhantomFS
@app.route("/api/event", methods=["POST"])
def handle_event():
    data = request.get_json(silent=True) or {}

    event_type = data.get("type", "NETWORK_EVENT")

    # Preserve the filesystem event details sent by PhantomFS
    event = {
        "type": event_type,
        "path": data.get("path", ""),
        "bytes": data.get("bytes", 0),
        "source": data.get("source", request.remote_addr or "unknown"),
        "dest": data.get("dest", "PhantomNet Honeypot"),
        "service": data.get(
            "service",
            "FILESYSTEM" if event_type.startswith("FILE_") else "NETWORK"
        ),
        "decision": data.get("decision", "LOGGED"),
        "severity": data.get(
            "severity",
            "HIGH" if event_type in ("FILE_WRITE", "FILE_TRUNCATE")
            else "MEDIUM"
        ),
        "timestamp": datetime.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "payload": data.get("payload", "")
    }

    ATTACK_EVENTS.insert(0, event)

    # Keep the most recent 50 events
    del ATTACK_EVENTS[50:]

    socketio.emit("telemetry_update", {
        "active_sessions": 27 + len(ATTACK_EVENTS),
        "high_severity": sum(
            1 for item in ATTACK_EVENTS
            if item.get("severity") in ("HIGH", "CRITICAL")
        ),
        "network_flows": 1489 + len(ATTACK_EVENTS),
        "stream": (
            f"{event['type']}: {event['path'] or event['service']} "
            f"-> {event['decision']}"
        ),
        "flows": ATTACK_EVENTS
    })

    return jsonify({
        "status": "success",
        "event": event
    }), 200


# Receive commands sent to the honeypot
@app.route("/api/honey/command", methods=["POST"])
def handle_honey_command():
    data = request.get_json(silent=True) or {}

    command = data.get("command", "whoami")
    source_ip = data.get(
        "source", request.remote_addr or "unknown"
    )

    entry = {
        "source": source_ip,
        "command": command,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
    }

    HONEY_LOGS.insert(0, entry)
    del HONEY_LOGS[50:]

    socketio.emit("honey_log", entry)

    return jsonify({
        "status": "intercepted",
        "entry": entry
    }), 200


# Return stored attack events
@app.route("/api/events", methods=["GET"])
def get_events():
    return jsonify({
        "total": len(ATTACK_EVENTS),
        "flows": ATTACK_EVENTS
    }), 200


# Record SQL injection simulation/interception events
@app.route("/api/sqli/intercept", methods=["POST"])
def handle_sqli_intercept():
    data = request.get_json(silent=True) or {}

    payload = data.get("payload", "' OR '1'='1")
    source_ip = data.get(
        "source", request.remote_addr or "unknown"
    )

    entry = {
        "type": "SQLI_ATTEMPT",
        "source": source_ip,
        "dest": "10.0.0.8 (SQL)",
        "service": "POSTGRES",
        "payload": payload,
        "decision": "BLOCKED",
        "severity": "CRITICAL",
        "timestamp": datetime.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    }

    ATTACK_EVENTS.insert(0, entry)
    del ATTACK_EVENTS[50:]

    socketio.emit("sqli_log", entry)

    socketio.emit("telemetry_update", {
        "active_sessions": 27 + len(ATTACK_EVENTS),
        "high_severity": sum(
            1 for item in ATTACK_EVENTS
            if item.get("severity") in ("HIGH", "CRITICAL")
        ),
        "network_flows": 1489 + len(ATTACK_EVENTS),
        "stream": (
            f"SQLI_ATTEMPT from {entry['source']} "
            f"-> {entry['decision']}"
        ),
        "flows": ATTACK_EVENTS
    })

    return jsonify({
        "status": "intercepted",
        "entry": entry
    }), 200


# Start the server only after all routes are registered
if __name__ == "__main__":
    print(
        "Starting PhantomNet SOC WebSocket Server "
        "on http://0.0.0.0:5050"
    )

    socketio.run(
        app,
        host="0.0.0.0",
        port=5050,
        debug=False,
        allow_unsafe_werkzeug=True
    )
