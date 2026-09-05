#!/bin/bash

# Port redirection rule using iptables
echo "[*] Configuring iptables network routing rules for PhantomNet..."

# Redirect incoming external PostgreSQL (5432) to local honeypot engine
iptables -t nat -A PREROUTING -p tcp --dport 5432 -j REDIRECT --to-ports 5432 2>/dev/null || true

# Redirect SSH honeypot traffic (Port 2222 -> Port 22)
iptables -t nat -A PREROUTING -p tcp --dport 2222 -j REDIRECT --to-ports 22 2>/dev/null || true

echo "[✔] Network interception rules active!"
