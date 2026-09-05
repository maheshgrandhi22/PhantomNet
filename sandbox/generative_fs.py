#!/usr/bin/env python3
import sys
import stat
import errno
import logging
import datetime
import time
import requests
from fuse import FUSE, Operations, FuseOSError
from llm_engine.ollama_client import generate_response
from llm_engine.consistency_store import ConsistencyStore
from llm_engine.threat_engine import ThreatEngine

logging.basicConfig(level=logging.INFO)

threat_engine = ThreatEngine()

def calculate_tarpit_delay(score: int) -> float:
    if score >= 150:
        return 4.0
    elif score >= 80:
        return 2.0
    elif score >= 40:
        return 0.5
    return 0.0

def send_telemetry(event_type, path, session_id, risk_meta=None, delay_applied=0.0):
    try:
        payload = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": event_type,
            "path": path,
            "session_id": session_id,
            "threat_score": risk_meta["cumulative_score"] if risk_meta else 0,
            "threat_level": risk_meta["threat_level"] if risk_meta else "LOW",
            "tarpit_delay": delay_applied
        }
        requests.post("http://127.0.0.1:5050/api/telemetry", json=payload, timeout=0.5)
    except Exception:
        pass

class GenerativeFS(Operations):
    def __init__(self):
        self.files = {}
        self.store = None
        self.session_id = "hacker_session_001"
        
        self.files['/'] = dict(st_mode=(stat.S_IFDIR | 0o755), st_nlink=2, st_size=4096)
        
        self.default_paths = [
            '/readme.txt',
            '/payroll_2026.csv',
            '/db_config.env',
            '/employee_records.json'
        ]
        
        self.files['/readme.txt'] = b"Welcome to Infotact Systems Internal Shell.\n"
        for fpath in self.default_paths[1:]:
            self.files[fpath] = None

    def _get_store(self):
        if self.store is None:
            self.store = ConsistencyStore()
        return self.store

    def getattr(self, path, fh=None):
        if path == '/':
            return dict(st_mode=(stat.S_IFDIR | 0o755), st_nlink=2, st_size=4096)
        
        if path in self.files or path in self.default_paths:
            size = len(self.files[path]) if self.files.get(path) is not None else 2048
            return dict(
                st_mode=(stat.S_IFREG | 0o644),
                st_nlink=1,
                st_size=size,
                st_ctime=time.time(),
                st_mtime=time.time(),
                st_atime=time.time()
            )
        
        raise FuseOSError(errno.ENOENT)

    def open(self, path, flags):
        if path in self.files or path in self.default_paths:
            return 0
        raise FuseOSError(errno.ENOENT)

    def readdir(self, path, fh):
        risk_meta = threat_engine.calculate_risk(self.session_id, path)
        delay = calculate_tarpit_delay(risk_meta["cumulative_score"])
        
        if delay > 0:
            time.sleep(delay)

        send_telemetry("DIRECTORY_LIST", path, self.session_id, risk_meta, delay_applied=delay)
        entries = ['.', '..'] + [p.lstrip('/') for p in self.default_paths]
        return list(set(entries))

    def read(self, path, length, offset, fh):
        try:
            if path not in self.default_paths and path not in self.files:
                raise FuseOSError(errno.ENOENT)

            risk_meta = threat_engine.calculate_risk(self.session_id, path)
            delay = calculate_tarpit_delay(risk_meta["cumulative_score"])

            if delay > 0:
                time.sleep(delay)

            send_telemetry("FILE_READ", path, self.session_id, risk_meta, delay_applied=delay)

            if path not in self.files or self.files[path] is None:
                store = self._get_store()
                past_context = store.query_context(path, self.session_id)
                context_str = "\n".join(past_context) if past_context else "None"

                prompt = (
                    f"You are a honeypot filesystem generator for Infotact Systems.\n"
                    f"Prior context:\n{context_str}\n\n"
                    f"Task: Generate synthetic, dummy content for file path '{path}'."
                )
                raw_content = generate_response(prompt)
                canary_content = threat_engine.inject_canary(raw_content, path)
                encoded_content = canary_content.encode('utf-8')

                self.files[path] = encoded_content
                store.save_context(self.session_id, canary_content, {"path": path})

            content = self.files[path]
            return content[offset:offset + length]
        except Exception as e:
            logging.error(f"Error reading file {path}: {e}")
            raise FuseOSError(errno.EIO)

if __name__ == '__main__':
    mountpoint = sys.argv[1] if len(sys.argv) > 1 else '/tmp/phantom_mount'
    FUSE(GenerativeFS(), mountpoint, foreground=True, nonempty=True)
