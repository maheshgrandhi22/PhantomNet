#!/usr/bin/env python3
import socket
import threading
import requests
import datetime

HOST = '0.0.0.0'
PORT = 5432  # Standard PostgreSQL Port

def send_sql_telemetry(query, client_address):
    try:
        payload = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": "SQL_QUERY",
            "path": f"DB Query from {client_address[0]}",
            "session_id": "hacker_session_001",
            "threat_score": 50,
            "threat_level": "MEDIUM",
            "tarpit_delay": 0.5
        }
        requests.post("http://127.0.0.1:5050/api/telemetry", json=payload, timeout=0.5)
    except Exception:
        pass

def handle_client(client_socket, client_address):
    print(f"[+] Intercepted connection from {client_address}")
    try:
        data = client_socket.recv(1024).decode('utf-8', errors='ignore')
        if data:
            print(f"[*] SQL Query Captured: {data.strip()}")
            send_sql_telemetry(data.strip(), client_address)
            
            # Simulated PostgreSQL payload response
            response = "id|name|salary\n1|Executive|150000\n2|Admin|120000\n"
            client_socket.sendall(response.encode('utf-8'))
    except Exception as e:
        print(f"[-] Error: {e}")
    finally:
        client_socket.close()

def start_sql_honeypot():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind((HOST, PORT))
        server.listen(5)
        print(f"[*] PhantomNet Mock SQL Engine listening on port {PORT}...")
        while True:
            client, addr = server.accept()
            client_handler = threading.Thread(target=handle_client, args=(client, addr))
            client_handler.start()
    except PermissionError:
        print("[-] Port 5432 requires root permissions. Run with sudo/root.")

if __name__ == "__main__":
    start_sql_honeypot()
EOFcat << 'EOF' > sandbox/mock_sql.py
#!/usr/bin/env python3
import socket
import threading
import requests
import datetime

HOST = '0.0.0.0'
PORT = 5432  # Standard PostgreSQL Port

def send_sql_telemetry(query, client_address):
    try:
        payload = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": "SQL_QUERY",
            "path": f"DB Query from {client_address[0]}",
            "session_id": "hacker_session_001",
            "threat_score": 50,
            "threat_level": "MEDIUM",
            "tarpit_delay": 0.5
        }
        requests.post("http://127.0.0.1:5050/api/telemetry", json=payload, timeout=0.5)
    except Exception:
        pass

def handle_client(client_socket, client_address):
    print(f"[+] Intercepted connection from {client_address}")
    try:
        data = client_socket.recv(1024).decode('utf-8', errors='ignore')
        if data:
            print(f"[*] SQL Query Captured: {data.strip()}")
            send_sql_telemetry(data.strip(), client_address)
            
            # Simulated PostgreSQL payload response
            response = "id|name|salary\n1|Executive|150000\n2|Admin|120000\n"
            client_socket.sendall(response.encode('utf-8'))
    except Exception as e:
        print(f"[-] Error: {e}")
    finally:
        client_socket.close()

def start_sql_honeypot():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind((HOST, PORT))
        server.listen(5)
        print(f"[*] PhantomNet Mock SQL Engine listening on port {PORT}...")
        while True:
            client, addr = server.accept()
            client_handler = threading.Thread(target=handle_client, args=(client, addr))
            client_handler.start()
    except PermissionError:
        print("[-] Port 5432 requires root permissions. Run with sudo/root.")

if __name__ == "__main__":
    start_sql_honeypot()
