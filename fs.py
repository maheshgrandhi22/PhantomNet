import os
import sys
import errno
import time
import threading
import requests
import json
from datetime import datetime
from fuse import FUSE, FuseOSError, Operations
from lore import LoreGenerator

LOG_API_URL = "http://127.0.0.1:5050/api/event"
LOG_FILE = "/root/phantomnet/logs/attacks.json"

def calculate_risk_score(path):
    critical_targets = [".aws/credentials", "id_rsa", ".ssh", "shadow", "passwords.txt"]
    medium_targets = [".env", "config.json", "database.sqlite"]
    
    for target in critical_targets:
        if target in path:
            return "CRITICAL"
            
    for target in medium_targets:
        if target in path:
            return "MEDIUM"
            
    return "LOW"

def send_security_alert(event):
    if event["risk_level"] == "CRITICAL":
        alert_payload = {
            "text": f"🚨 CRITICAL SECURITY ALERT: Unauthorized access detected on {event['target_file']} at {event['timestamp']}!"
        }
        print(f"\n[ALERT TRIGGERED] {alert_payload['text']}\n")

def log_security_event(path, action, user_pid="unknown"):
    risk = calculate_risk_score(path)
    
    event = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "action": action,
        "target_file": path,
        "process_id": user_pid,
        "risk_level": risk
    }
    
    send_security_alert(event)
    
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(event) + "\n")

class PhantomFS(Operations):
    def __init__(self):
        self.lore = LoreGenerator()
        self.cache = {}

    def _norm(self, path):
        path = os.path.normpath(path)
        return "/" if path == "." else path

    def _async_log(self, event_type, path, num_bytes=0, payload=""):
        def send_log():
            try:
                data = {
                    "type": event_type,
                    "path": path,
                    "bytes": num_bytes,
                    "payload": payload[:200]
                }
                requests.post(LOG_API_URL, json=data, timeout=1.5)
            except Exception:
                pass  
        threading.Thread(target=send_log, daemon=True).start()

    def getattr(self, path, fh=None):
        path = self._norm(path)
        now = time.time()
        
        if path in ["/", "/root", "/root/.aws", "/root/.ssh", "/var", "/var/www", "/var/www/html", "/etc"]:
            return dict(st_mode=(0o040755), st_nlink=2, st_size=4096,
                        st_ctime=now, st_mtime=now, st_atime=now)

        content = self.cache.get(path) or self.lore.get_content(path)
        if content is not None:
            size = len(content.encode('utf-8'))
            mode = 0o100600 if ".ssh" in path or ".env" in path else 0o100644
            return dict(st_mode=mode, st_nlink=1, st_size=size,
                        st_ctime=now, st_mtime=now, st_atime=now)

        raise FuseOSError(errno.ENOENT)

    def readdir(self, path, fh):
        path = self._norm(path)
        entries = ['.', '..']
        
        if path == "/":
            entries.extend(['root', 'var', 'etc'])
        elif path == "/root":
            entries.extend(['.env', '.aws', '.ssh'])
        elif path == "/root/.aws":
            entries.extend(['credentials', 'config'])
        elif path == "/root/.ssh":
            entries.extend(['id_rsa', 'authorized_keys'])
        elif path == "/var/www/html":
            entries.extend(['config.php', 'index.php'])
        elif path == "/etc":
            entries.extend(['passwd', 'shadow'])
            
        return entries

    def open(self, path, flags):
        path = self._norm(path)
        self._async_log("FILE_OPEN", path)
        log_security_event(path, "OPEN")
        return 0

    def read(self, path, size, offset, fh):
        path = self._norm(path)
        content = self.cache.get(path) or self.lore.get_content(path)
        if content is None:
            raise FuseOSError(errno.ENOENT)

        encoded = content.encode('utf-8')
        chunk = encoded[offset:offset + size]
        self._async_log("FILE_READ", path, num_bytes=len(chunk))
        log_security_event(path, "READ")
        return chunk

    def write(self, path, data, offset, fh):
        path = self._norm(path)
        current = self.cache.get(path) or self.lore.get_content(path) or ""
        
        data_str = data.decode('utf-8', errors='ignore')
        updated = current[:offset] + data_str
        self.cache[path] = updated
        log_security_event(path, "WRITE")
        return len(data)
