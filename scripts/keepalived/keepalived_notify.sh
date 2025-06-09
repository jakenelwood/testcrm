#!/bin/bash

# 📢 Keepalived State Change Notification Script
# Handles MASTER/BACKUP/FAULT state transitions

STATE="$1"
LOG_FILE="/var/log/keepalived-notify.log"
FLOATING_IP_SCRIPT="/usr/local/bin/assign_floating_ip.sh"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

case "$STATE" in
    MASTER)
        log "TRANSITION TO MASTER: This server is now the active HAProxy"
        
        # Assign floating IP to this server
        if [ -x "$FLOATING_IP_SCRIPT" ]; then
            log "Executing floating IP assignment script"
            "$FLOATING_IP_SCRIPT" 2>&1 | tee -a "$LOG_FILE"
        else
            log "WARNING: Floating IP script not found or not executable: $FLOATING_IP_SCRIPT"
        fi
        
        # Ensure HAProxy is running
        if ! systemctl is-active --quiet haproxy; then
            log "Starting HAProxy service"
            systemctl start haproxy
        fi
        
        # Send notification (optional - configure as needed)
        # curl -X POST "https://hooks.slack.com/..." -d "payload={\"text\":\"HAProxy MASTER: $(hostname)\"}"
        
        log "MASTER transition completed"
        ;;
        
    BACKUP)
        log "TRANSITION TO BACKUP: This server is now standby"
        
        # Remove floating IP from interface (it will be managed by the new master)
        FLOATING_IP="5.78.31.2"
        ip addr del "$FLOATING_IP/32" dev eth0 2>/dev/null || true
        
        log "Removed floating IP from interface"
        
        # HAProxy can keep running in backup mode
        log "BACKUP transition completed"
        ;;
        
    FAULT)
        log "TRANSITION TO FAULT: Keepalived detected a problem"
        
        # Log HAProxy status for debugging
        if systemctl is-active --quiet haproxy; then
            log "HAProxy service is running"
        else
            log "HAProxy service is NOT running"
            systemctl status haproxy --no-pager >> "$LOG_FILE" 2>&1
        fi
        
        # Log network interface status
        ip addr show eth0 >> "$LOG_FILE" 2>&1
        
        # Send alert notification
        # curl -X POST "https://hooks.slack.com/..." -d "payload={\"text\":\"HAProxy FAULT: $(hostname)\"}"
        
        log "FAULT transition logged"
        ;;
        
    *)
        log "UNKNOWN STATE: $STATE"
        ;;
esac

exit 0
