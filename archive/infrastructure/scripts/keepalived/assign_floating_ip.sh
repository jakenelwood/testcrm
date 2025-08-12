#!/bin/bash

# 🌐 Hetzner Floating IP Assignment Script for Keepalived
# Assigns floating IP to the current server when it becomes MASTER

set -e

# Configuration
FLOATING_IP_NAME="crm-haproxy-main"
HCLOUD_TOKEN_FILE="/etc/hetzner/token"
LOG_FILE="/var/log/keepalived-floating-ip.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check if token file exists
if [ ! -f "$HCLOUD_TOKEN_FILE" ]; then
    log "ERROR: Hetzner Cloud token file not found: $HCLOUD_TOKEN_FILE"
    exit 1
fi

# Read the token
HCLOUD_TOKEN=$(cat "$HCLOUD_TOKEN_FILE")
export HCLOUD_TOKEN

# Get current server name (hostname)
SERVER_NAME=$(hostname)
log "Server name: $SERVER_NAME"

# Get server ID from Hetzner Cloud
SERVER_ID=$(hcloud server describe "$SERVER_NAME" 2>/dev/null | grep "ID:" | awk '{print $2}')

if [ -z "$SERVER_ID" ]; then
    log "ERROR: Could not find server ID for $SERVER_NAME"
    exit 1
fi

log "Server ID: $SERVER_ID"

# Check current floating IP assignment
CURRENT_SERVER=$(hcloud floating-ip describe "$FLOATING_IP_NAME" 2>/dev/null | grep "Server:" | awk '{print $2}' || echo "")

if [ "$CURRENT_SERVER" = "$SERVER_NAME" ]; then
    log "Floating IP $FLOATING_IP_NAME already assigned to $SERVER_NAME"
    exit 0
fi

# Assign floating IP to this server
log "Assigning floating IP $FLOATING_IP_NAME to server $SERVER_NAME (ID: $SERVER_ID)"

if hcloud floating-ip assign "$FLOATING_IP_NAME" "$SERVER_ID"; then
    log "SUCCESS: Floating IP $FLOATING_IP_NAME assigned to $SERVER_NAME"
    
    # Add the floating IP to the network interface
    FLOATING_IP=$(hcloud floating-ip describe "$FLOATING_IP_NAME" | grep "IP:" | awk '{print $2}')
    ip addr add "$FLOATING_IP/32" dev eth0 2>/dev/null || true
    
    log "Added $FLOATING_IP to eth0 interface"
else
    log "ERROR: Failed to assign floating IP $FLOATING_IP_NAME to $SERVER_NAME"
    exit 1
fi
