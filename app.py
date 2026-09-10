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

@app.route('/')
def index():
    return jsonify({
        "status": "ONLINE",
        "system": "PhantomNet SOC WebSocket Server V2.0",
        "endpoints": ["/api/events", "/api/event", "/api/honey/command"]
    }), 200

@app.route('/api/event', methods=['POST'])
def handle_event():
    data = request.get_json(silent=True) or {}
    event = {
        "source": data.get("source", "192.168.1.150"),
        "dest": data.get("dest", "10.0.0.4 (Honey)"),
        "service": data.get("service", "SSH"),
        "decision": data.get("decision", "TARPIT"),
        "severity": data.get("severity", "HIGH"),
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "payload": data.get("payload", "Unauthorized shell probe detected")
    }
    ATTACK_EVENTS.insert(0, event)
    if len(ATTACK_EVENTS) > 50:
        ATTACK_EVENTS.pop()
        
    socketio.emit('telemetry_update', {
        "active_sessions": 27 + len(ATTACK_EVENTS),
        "high_severity": sum(1 for e in ATTACK_EVENTS if e['severity'] in ['HIGH', 'CRITICAL']),
        "network_flows": 1489 + len(ATTACK_EVENTS),
        "stream": f"Intercepted {event['service']} probe from {event['source']} -> action: {event['decision']}",
        "flows": ATTACK_EVENTS
    })
    return jsonify({"status": "success", "event": event}), 200

@app.route('/api/honey/command', methods=['POST'])
def handle_honey_command():
    data = request.get_json(silent=True) or {}
    cmd = data.get("command", "whoami")
    source_ip = data.get("source", "203.0.113.42")
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    
    entry = {"source": source_ip, "command": cmd, "timestamp": ts}
    HONEY_LOGS.insert(0, entry)
    socketio.emit('honey_log', entry)
    return jsonify({"status": "intercepted", "entry": entry}), 200

@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify({"total": len(ATTACK_EVENTS), "flows": ATTACK_EVENTS}), 200

if __name__ == '__main__':
    print("🚀 Starting PhantomNet SOC WebSocket Server on http://0.0.0.0:5050")
    socketio.run(app, host='0.0.0.0', port=5050, debug=False, allow_unsafe_werkzeug=True)
