#!/bin/bash

# 🔍 HAProxy Health Check Script for Keepalived
# Checks if HAProxy is running and responding properly

# Exit codes:
# 0 = HAProxy is healthy
# 1 = HAProxy is unhealthy

# Check if HAProxy process is running
if ! pgrep haproxy > /dev/null; then
    echo "HAProxy process not running"
    exit 1
fi

# Check if HAProxy stats page is responding
if ! curl -f -s http://localhost:8404/stats > /dev/null; then
    echo "HAProxy stats page not responding"
    exit 1
fi

# Check if HAProxy is listening on required ports
required_ports=(5000 5001 6443 7000 8404)

for port in "${required_ports[@]}"; do
    if ! netstat -ln | grep -q ":$port "; then
        echo "HAProxy not listening on port $port"
        exit 1
    fi
done

# All checks passed
echo "HAProxy is healthy"
exit 0
