#!/bin/bash

MOUNT_DIR="/tmp/phantom_mount"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}      PhantomNet Live Attack & Mitigation Demo      ${NC}"
echo -e "${CYAN}====================================================${NC}\n"

if [ ! -d "$MOUNT_DIR" ]; then
    echo -e "${RED}[!] Mount directory $MOUNT_DIR not found. Start FUSE daemon first!${NC}"
    exit 1
fi

# Step 1: Reconnaissance
echo -e "${YELLOW}[1/4] Attacker Stage: Initial Reconnaissance (ls -la)${NC}"
start_time=$(date +%s%N)
ls -la "$MOUNT_DIR"
end_time=$(date +%s%N)
elapsed=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}[+] Completed in ${elapsed}ms${NC}\n"
sleep 1

# Step 2: Low-Risk File Access
echo -e "${YELLOW}[2/4] Attacker Stage: Exfiltrating Payroll CSV (Low/Medium Risk)${NC}"
start_time=$(date +%s%N)
cat "$MOUNT_DIR/payroll_2026.csv" | head -n 5
end_time=$(date +%s%N)
elapsed=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}[+] Completed in ${elapsed}ms${NC}\n"
sleep 1

# Step 3: High-Risk Access & Canary Extraction
echo -e "${YELLOW}[3/4] Attacker Stage: Stealing DB Config (High Risk + Canary Injection)${NC}"
start_time=$(date +%s%N)
CONFIG_OUTPUT=$(cat "$MOUNT_DIR/db_config.env")
echo "$CONFIG_OUTPUT"
end_time=$(date +%s%N)
elapsed=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}[+] Target accessed in ${elapsed}ms${NC}\n"

if echo "$CONFIG_OUTPUT" | grep -q "AWS_ACCESS_KEY_ID"; then
    echo -e "${RED}[!] DECEPTION TRAP ACTIVE: Canary credentials successfully injected and served!${NC}\n"
fi
sleep 1

# Step 4: Tarpitting & Anti-Exfiltration Delay
echo -e "${YELLOW}[4/4] Attacker Stage: Automated Exfiltration Loop (Testing Tarpitting)${NC}"
echo -e "${CYAN}[*] Reading high-sensitivity target repeatedly to trigger latency escalation...${NC}"

for i in {1..2}; do
    start_time=$(date +%s)
    echo -n "  -> Attack iteration $i reading db_config.env ... "
    cat "$MOUNT_DIR/db_config.env" > /dev/null
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo -e "${RED}Blocked/Delayed for ${duration}s${NC}"
done

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}[✔] Simulation complete! Check dashboard at http://localhost:5050${NC}"
echo -e "${GREEN}====================================================${NC}"
