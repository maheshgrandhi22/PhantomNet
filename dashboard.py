import re
import os
from collections import Counter
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)
LOG_FILE = "/root/phantomnet/phantomnet_audit.log"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PhantomNet Honeypot Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 20px; }
        h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .card { background: #1e293b; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
        .stat-val { font-size: 2em; font-weight: bold; color: #f43f5e; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; }
        th { background: #334155; color: #38bdf8; }
        tr:hover { background: #334155; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .alert { background: #f43f5e; color: white; }
        .read { background: #0ea5e9; color: white; }
        .gen { background: #10b981; color: white; }
    </style>
</head>
<body>
    <h1>🛡️ PhantomNet Honeypot Analytics Dashboard</h1>
    
    <div class="grid">
        <div class="card">
            <h3>Total Read Attempts</h3>
            <div class="stat-val" id="total-reads" style="color: #38bdf8;">0</div>
        </div>
        <div class="card">
            <h3>Sensitive Alerts Triggered</h3>
            <div class="stat-val" id="total-alerts">0</div>
        </div>
        <div class="card">
            <h3>Cached LLM Files</h3>
            <div class="stat-val" id="total-cached" style="color: #10b981;">0</div>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <h3>Most Accessed Paths</h3>
            <canvas id="pathsChart"></canvas>
        </div>
        <div class="card">
            <h3>Event Types Breakdown</h3>
            <canvas id="typesChart"></canvas>
        </div>
    </div>

    <div class="card">
        <h3>Live Activity Feed</h3>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody id="logs-table"></tbody>
        </table>
    </div>

    <script>
        let pathsChart, typesChart;

        async function updateDashboard() {
            const res = await fetch('/api/stats');
            const data = await res.json();

            document.getElementById('total-reads').innerText = data.stats.reads;
            document.getElementById('total-alerts').innerText = data.stats.alerts;
            document.getElementById('total-cached').innerText = data.stats.cached;

            const tableBody = document.getElementById('logs-table');
            tableBody.innerHTML = '';
            data.raw_logs.slice(-10).reverse().forEach(log => {
                let badgeClass = 'read';
                if (log.type.includes('ALERT')) badgeClass = 'alert';
                if (log.type.includes('LLM GENERATED')) badgeClass = 'gen';

                tableBody.innerHTML += `
                    <tr>
                        <td>${log.timestamp}</td>
                        <td><span class="badge ${badgeClass}">${log.type}</span></td>
                        <td>${log.details}</td>
                    </tr>`;
            });

            const pathLabels = Object.keys(data.top_paths);
            const pathCounts = Object.values(data.top_paths);
            if (pathsChart) pathsChart.destroy();
            pathsChart = new Chart(document.getElementById('pathsChart'), {
                type: 'bar',
                data: {
                    labels: pathLabels,
                    datasets: [{ label: 'Access Count', data: pathCounts, backgroundColor: '#38bdf8' }]
                },
                options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });

            if (typesChart) typesChart.destroy();
            typesChart = new Chart(document.getElementById('typesChart'), {
                type: 'doughnut',
                data: {
                    labels: ['File Reads', 'Alerts Triggered', 'LLM Generations'],
                    datasets: [{
                        data: [data.stats.reads, data.stats.alerts, data.stats.cached],
                        backgroundColor: ['#0ea5e9', '#f43f5e', '#10b981']
                    }]
                }
            });
        }

        setInterval(updateDashboard, 3000);
        updateDashboard();
    </script>
</body>
</html>
"""

def parse_logs():
    if not os.path.exists(LOG_FILE):
        return {"stats": {"reads": 0, "alerts": 0, "cached": 0}, "top_paths": {}, "raw_logs": []}

    reads, alerts, cached = 0, 0, 0
    paths = []
    parsed_logs = []

    with open(LOG_FILE, 'r') as f:
        for line in f:
            match = re.match(r'^([\d\-:\s,]+)\s+\[(.*?)\]\s+(.*)$', line.strip())
            if match:
                timestamp, level, message = match.groups()
                event_type = "SYSTEM"
                details = message

                if "FILE READ ATTEMPT" in message:
                    reads += 1
                    event_type = "FILE READ"
                    path_match = re.search(r"Path='(.*?)'", message)
                    if path_match:
                        paths.append(path_match.group(1))
                elif "ALERT TRIGGERED" in message:
                    alerts += 1
                    event_type = "ALERT TRIGGERED"
                elif "LLM GENERATED" in message:
                    cached += 1
                    event_type = "LLM GENERATED"

                parsed_logs.append({
                    "timestamp": timestamp,
                    "type": event_type,
                    "details": details
                })

    top_paths = dict(Counter(paths).most_common(5))

    return {
        "stats": {"reads": reads, "alerts": alerts, "cached": cached},
        "top_paths": top_paths,
        "raw_logs": parsed_logs
    }

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/stats')
def get_stats():
    return jsonify(parse_logs())

if __name__ == '__main__':
    print("[+] Starting PhantomNet Dashboard on http://0.0.0.0:5050")
    app.run(host='0.0.0.0', port=5050, debug=False)
