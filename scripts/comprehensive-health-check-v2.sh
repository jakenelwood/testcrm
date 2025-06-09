#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# 🏥 Comprehensive Health Check Script - Orchestrator/Executor Model
# Runs locally OR remotely with automatic report download

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
HETZNER_HOST="5.78.103.224"
BACKUP_HOSTS=("5.161.110.205" "178.156.186.10")
COMPOSE_DIR="/opt/twincigo-crm"
SERVER_REPORT_DIR="/opt/crm/docs/reporting/health_reports"
LOCAL_REPORT_DIR="docs/reporting/health_reports"

# This function contains the entire health check logic
# It will be executed in its entirety, either locally or remotely
run_health_checks() {
    local REPORT_DIR_CONTEXT="$1"
    local TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    local REPORT_FILE="$REPORT_DIR_CONTEXT/health_report_$TIMESTAMP.txt"
    
    # Ensure report directory exists
    mkdir -p "$REPORT_DIR_CONTEXT"
    
    # Health tracking
    local TOTAL_CHECKS=0
    local PASSED_CHECKS=0
    local FAILED_CHECKS=0
    local WARNING_CHECKS=0
    local ISSUES=()
    local WARNINGS=()
    
    # Logging functions that write to the correct context
    log_message() {
        echo -e "$1" | tee -a "$REPORT_FILE"
    }
    
    success() {
        echo -e "${GREEN}✅ $1${NC}"
        echo "✅ $1" >> "$REPORT_FILE"
        ((PASSED_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    error() {
        echo -e "${RED}❌ $1${NC}"
        echo "❌ $1" >> "$REPORT_FILE"
        ISSUES+=("$1")
        ((FAILED_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    warning() {
        echo -e "${YELLOW}⚠️  $1${NC}"
        echo "⚠️  $1" >> "$REPORT_FILE"
        WARNINGS+=("$1")
        ((WARNING_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    info() {
        echo -e "${CYAN}ℹ️  $1${NC}"
        echo "ℹ️  $1" >> "$REPORT_FILE"
    }
    
    header() {
        echo -e "\n${BOLD}${BLUE}$1${NC}"
        echo -e "\n$1" >> "$REPORT_FILE"
        echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
        echo "$(printf '=%.0s' {1..50})" >> "$REPORT_FILE"
    }
    
    # Initialize report
    log_message "${BOLD}🏥 Comprehensive Server Health Check${NC}"
    log_message "=================================================="
    log_message "Timestamp: $(date)"
    log_message "Primary Host: $HETZNER_HOST"
    log_message "Report File: $REPORT_FILE"
    log_message ""
    log_message "Running comprehensive health checks..."
    log_message ""
    
    # Test 1: Host Connectivity
    header "🌐 Host Connectivity Tests"
    
    # Primary host
    if ping -c 1 "$HETZNER_HOST" >/dev/null 2>&1; then
        success "Primary host $HETZNER_HOST is reachable"
    else
        error "Primary host $HETZNER_HOST is unreachable"
    fi
    
    # Backup hosts
    for host in "${BACKUP_HOSTS[@]}"; do
        if ping -c 1 "$host" >/dev/null 2>&1; then
            success "Backup host $host is reachable"
        else
            warning "Backup host $host is unreachable"
        fi
    done
    
    # Test 2: etcd Cluster
    header "🔧 etcd Cluster Health"
    
    local healthy_nodes=0
    local total_nodes=0
    
    for host in "$HETZNER_HOST" "${BACKUP_HOSTS[@]}"; do
        ((total_nodes++))
        if curl -s "http://$host:2379/health" | grep -q '"health":"true"' 2>/dev/null; then
            success "etcd on $host is healthy"
            ((healthy_nodes++))
        else
            error "etcd on $host is unhealthy or unreachable"
        fi
    done
    
    if [ $healthy_nodes -eq $total_nodes ]; then
        success "etcd cluster is fully healthy ($healthy_nodes/$total_nodes nodes)"
    elif [ $healthy_nodes -gt $((total_nodes / 2)) ]; then
        warning "etcd cluster has quorum but some nodes are down ($healthy_nodes/$total_nodes nodes)"
    else
        error "etcd cluster has lost quorum ($healthy_nodes/$total_nodes nodes)"
    fi
    
    # Test 3: K3s Cluster
    header "☸️  K3s Cluster Health"
    
    if systemctl is-active k3s >/dev/null 2>&1; then
        success "K3s service is running"
    else
        error "K3s service is not running"
    fi
    
    if kubectl get nodes --no-headers >/dev/null 2>&1; then
        local ready_nodes=$(kubectl get nodes --no-headers | grep -c "Ready" || echo "0")
        local total_nodes=$(kubectl get nodes --no-headers | wc -l)
        
        if [ "$ready_nodes" -eq "$total_nodes" ] && [ "$ready_nodes" -gt 0 ]; then
            success "All K3s nodes are Ready ($ready_nodes/$total_nodes)"
        else
            warning "Some K3s nodes are not Ready ($ready_nodes/$total_nodes)"
        fi
    else
        error "Failed to get K3s node status"
    fi
    
    # Test 4: PostgreSQL K3s Cluster
    header "🗄️  K3s PostgreSQL Cluster"
    
    if kubectl get namespace postgres-cluster >/dev/null 2>&1; then
        local all_pods=$(kubectl get pods -n postgres-cluster --no-headers 2>/dev/null)
        if [ -n "$all_pods" ]; then
            local total_pods=$(echo "$all_pods" | wc -l | tr -d ' \n\r')
            local running_pods=$(echo "$all_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")
            local failed_pods=$(echo "$all_pods" | grep -c -E "(Failed|Error|CrashLoopBackOff)" 2>/dev/null | tr -d ' \n\r' || echo "0")
            
            if [ "$failed_pods" -gt 0 ]; then
                error "K3s postgres-cluster namespace has $failed_pods failed pods (total: $total_pods)"
            else
                success "K3s postgres-cluster namespace is healthy ($running_pods/$total_pods pods running)"
            fi
            
            # Check PostgreSQL database pods specifically
            local postgres_pods=$(echo "$all_pods" | grep -E "^postgres-[0-9]" || echo "")
            if [ -n "$postgres_pods" ]; then
                local postgres_count=$(echo "$postgres_pods" | wc -l | tr -d ' \n\r')
                local postgres_running=$(echo "$postgres_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")
                
                if [ "$postgres_running" -eq "$postgres_count" ]; then
                    success "PostgreSQL database pods are healthy ($postgres_running/$postgres_count running)"
                else
                    warning "PostgreSQL database cluster degraded ($postgres_running/$postgres_count running)"
                fi
            fi
        fi
    else
        warning "K3s PostgreSQL namespace 'postgres-cluster' not found"
    fi
    
    # Test 5: MinIO Storage
    header "🗄️  MinIO Distributed Storage"
    
    if kubectl get pods -n storage -l app=minio --no-headers >/dev/null 2>&1; then
        local minio_pods=$(kubectl get pods -n storage -l app=minio --no-headers)
        local running_minio=$(echo "$minio_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")
        local total_minio=$(echo "$minio_pods" | wc -l | tr -d ' \n\r')
        
        if [ "$running_minio" -eq "$total_minio" ] && [ "$total_minio" -gt 0 ]; then
            success "MinIO cluster is healthy ($running_minio/$total_minio pods running)"
        else
            warning "MinIO cluster issues ($running_minio/$total_minio pods running)"
        fi
    else
        warning "MinIO pods not found"
    fi
    
    # Test 6: Application Services
    header "🚀 Application Services"
    
    for port_info in "8080:HAProxy Web Frontend" "8404:HAProxy Stats" "5432:HAProxy PostgreSQL LB" "6443:HAProxy K3s API LB"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local name=$(echo "$port_info" | cut -d: -f2)
        
        if timeout 3 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1; then
            success "$name is listening on port $port"
        else
            warning "$name is not listening on port $port"
        fi
    done
    
    # Final Summary
    header "📊 Health Check Summary"
    
    local health_percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    log_message ""
    log_message "Overall Health Score: ${health_percentage}%"
    log_message "✅ Passed: $PASSED_CHECKS"
    log_message "⚠️  Warnings: $WARNING_CHECKS"
    log_message "❌ Failed: $FAILED_CHECKS"
    log_message "📋 Total Checks: $TOTAL_CHECKS"
    log_message ""
    
    if [ $health_percentage -ge 95 ]; then
        log_message "🎉 EXCELLENT HEALTH - Production Ready!"
    elif [ $health_percentage -ge 80 ]; then
        log_message "✅ GOOD HEALTH - Minor issues to address"
    else
        log_message "⚠️  NEEDS ATTENTION - Critical issues found"
    fi
    
    # Print the report path for the orchestrator to capture
    echo "REPORT_PATH:$REPORT_FILE"
}

# --- Main Execution Logic ---

# Determine if we are on the server or running locally against the server
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
if [[ "$LOCAL_IP" == "$HETZNER_HOST" ]]; then
    RUNNING_LOCALLY="true"
else
    RUNNING_LOCALLY="false"
fi

if [[ "$RUNNING_LOCALLY" == "true" ]]; then
    # --- MODE 1: EXECUTOR (Running on the server itself) ---
    echo "Running health check directly on the server..."
    # Capture output and display it, handling TTY issues
    HEALTH_OUTPUT=$(run_health_checks "$SERVER_REPORT_DIR" 2>&1)
    echo "$HEALTH_OUTPUT"
    FINAL_REPORT_PATH=$(echo "$HEALTH_OUTPUT" | grep "REPORT_PATH:" | cut -d: -f2)
    echo -e "\n${BOLD}📄 Full report saved to: $FINAL_REPORT_PATH${NC}"

else
    # --- MODE 2: ORCHESTRATOR (Running on local dev machine) ---
    echo "Running health check remotely on $HETZNER_HOST..."
    
    # Create the complete script to send to the remote server
    # We'll copy this entire file to the server and execute it there
    echo "Copying script to server and executing..."
    
    # Copy this script to the server
    scp "$0" root@"$HETZNER_HOST":/tmp/health-check-remote.sh
    
    # Execute the script on the server
    REMOTE_OUTPUT=$(ssh -o ConnectTimeout=10 root@"$HETZNER_HOST" "cd /opt/crm && bash /tmp/health-check-remote.sh")
    
    # Parse the remote machine's output to get the report path
    REMOTE_REPORT_PATH=$(echo "$REMOTE_OUTPUT" | grep "REPORT_PATH:" | cut -d: -f2)
    
    if [[ -z "$REMOTE_REPORT_PATH" ]]; then
        echo -e "⚠️ Could not determine remote report path. SSH command output:"
        echo "$REMOTE_OUTPUT"
        exit 1
    fi

    echo "Remote report generated at: $REMOTE_REPORT_PATH"
    echo "Downloading health report to local machine..."

    # Ensure local directory exists
    mkdir -p "$LOCAL_REPORT_DIR"
    report_filename=$(basename "$REMOTE_REPORT_PATH")
    local_report_path="$LOCAL_REPORT_DIR/$report_filename"

    # Use scp to download the file
    if scp -o ConnectTimeout=15 root@"$HETZNER_HOST":"$REMOTE_REPORT_PATH" "$local_report_path"; then
        echo -e "✅ Health report downloaded to: $local_report_path"
        ls -lh "$local_report_path"
    else
        echo -e "⚠️ Failed to download health report. Check SSH/SCP connectivity and paths."
    fi
    
    # Clean up temporary file on server
    ssh root@"$HETZNER_HOST" "rm -f /tmp/health-check-remote.sh"
fi
