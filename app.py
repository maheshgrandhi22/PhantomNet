import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage for real-time attack logs
ATTACK_EVENTS = []

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/event', methods=['POST'])
def handle_event():
    data = request.get_json(silent=True) or {}
    
    event = {
        "id": len(ATTACK_EVENTS) + 1,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": data.get("type", "UNKNOWN"),
        "path": data.get("path", "/unknown"),
        "bytes": data.get("bytes", 0),
        "payload": data.get("payload", "")
    }
    
    ATTACK_EVENTS.insert(0, event)  # Newest first
    if len(ATTACK_EVENTS) > 100:   # Keep last 100 events
        ATTACK_EVENTS.pop()
        
    return jsonify({"status": "success", "event_id": event["id"]}), 200

@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify({
        "total": len(ATTACK_EVENTS),
        "events": ATTACK_EVENTS
    }), 200

@app.route('/api/clear', methods=['POST'])
def clear_events():
    global ATTACK_EVENTS
    ATTACK_EVENTS = []
    return jsonify({"status": "cleared"}), 200

if __name__ == '__main__':
    print("🚀 Starting PhantomNet Dashboard on http://0.0.0.0:5050")
    app.run(host='0.0.0.0', port=5050, debug=False)
import json
import os
from flask import Flask, render_template

app = Flask(__name__)
LOG_FILE = "/root/phantomnet/logs/attacks.json"

@app.route('/')
def index():
    events = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            for line in f:
                if line.strip():
                    events.append(json.loads(line.strip()))
    # Reverse so newest events show first
    events.reverse()
    return render_template('dashboard.html', events=events)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
