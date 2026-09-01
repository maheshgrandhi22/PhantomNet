import json
import os
from flask import Flask, render_template, jsonify

app = Flask(__name__)
LOG_FILE = "/root/phantomnet/logs/attacks.json"

@app.route('/')
def index():
    events = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            for line in f:
                if line.strip():
                    try:
                        events.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        pass
    events.reverse()
    return render_template('dashboard.html', events=events)

@app.route('/api/events')
def api_events():
    events = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            for line in f:
                if line.strip():
                    try:
                        events.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        pass
    events.reverse()
    return jsonify(events)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
