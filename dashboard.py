from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import random
import time
import threading

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

telemetry_state = {
    "status": "ONLINE",
    "risk_score": 14,
    "active_sessions": 27,
    "high_severity": 1,
    "network_flows": 1489,
    "ai_models": 3,
    "stream": "Intercepted unauthorized shell probe on /auth/login...",
    "sql_interceptions": 1,
    "tarpit_delay": "0.8s"
}

@app.route('/')
def index():
    return jsonify({"system": "PhantomNet SOC V2.0", "status": "ONLINE"})

@app.route('/api/telemetry')
def telemetry():
    return jsonify(telemetry_state)

def background_telemetry_stream():
    events = [
        "Unauthorized root privilege escalation attempt blocked.",
        "SQL Injection payload neutralized on /api/v1/search.",
        "New eBPF network flow captured from unknown external IP.",
        "Tarpit delay successfully applied to port-scanner probe."
    ]
    while True:
        time.sleep(4)
        telemetry_state["risk_score"] = random.randint(10, 45)
        telemetry_state["active_sessions"] = random.randint(20, 35)
        telemetry_state["stream"] = random.choice(events)
        socketio.emit('telemetry_update', telemetry_state)

@socketio.on('connect')
def handle_connect():
    print("Client connected via WebSocket")
    emit('telemetry_update', telemetry_state)

if __name__ == '__main__':
    threading.Thread(target=background_telemetry_stream, daemon=True).start()
    socketio.run(app, port=5050, debug=True)
