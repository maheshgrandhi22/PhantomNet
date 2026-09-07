from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return jsonify({"system": "PhantomNet SOC V2.0", "status": "ONLINE"})

@app.route('/api/telemetry')
def telemetry():
    return jsonify({
        "status": "ONLINE",
        "risk_score": 14,
        "captured_events": 3,
        "sql_interceptions": 1,
        "tarpit_delay": "0.8s",
        "stream": "Intercepted unauthorized shell probe on /auth/login..."
    })

@socketio.on('connect')
def handle_connect():
    print("Client connected via Socket.IO")

if __name__ == '__main__':
    socketio.run(app, port=5050, debug=True)
