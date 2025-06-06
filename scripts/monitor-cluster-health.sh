#!/bin/bash

# 🔍 TwinCiGo CRM Continuous Cluster Health Monitor
# Provides real-time monitoring of the Hetzner HA PostgreSQL cluster
# Author: TwinCiGo CRM Team

set -euo pipefail

# Configuration
HETZNER_HOST="5.78.103.224"
CLUSTER_NAME="gardenos-dev-cluster"
COMPOSE_DIR="/opt/twincigo-crm"
MONITOR_INTERVAL=30  # seconds
LOG_FILE="/tmp/cluster-health-monitor.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

alert() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] 🚨 ALERT: $1${NC}" | tee -a "$LOG_FILE"
}

# Health check functions
check_cluster_health() {
    local status="HEALTHY"
    local issues=()

    # Check cluster status
    if cluster_info=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" 2>/dev/null); then
        leader_count=$(echo "$cluster_info" | jq -r '.members[] | select(.role=="leader") | .name' 2>/dev/null | wc -l)
        replica_count=$(echo "$cluster_info" | jq -r '.members[] | select(.role=="replica") | .name' 2>/dev/null | wc -l)
        total_members=$(echo "$cluster_info" | jq -r '.members | length' 2>/dev/null)

        if [ "$leader_count" -ne 1 ]; then
            status="CRITICAL"
            issues+=("Leader count: $leader_count (expected: 1)")
        fi

        if [ "$replica_count" -ne 2 ]; then
            status="WARNING"
            issues+=("Replica count: $replica_count (expected: 2)")
        fi

        if [ "$total_members" -ne 3 ]; then
            status="WARNING"
            issues+=("Total members: $total_members (expected: 3)")
        fi

        # Check replication lag
        for port in 8009 8010; do
            if node_info=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:$port/patroni" 2>/dev/null); then
                lag=$(echo "$node_info" | jq -r '.replication_state.lag' 2>/dev/null)
                if [ "$lag" != "null" ] && [ "$lag" != "" ] && [ "$lag" -gt 0 ]; then
                    if [ "$lag" -gt 1000 ]; then  # 1 second lag threshold
                        status="WARNING"
                        issues+=("High replication lag on port $port: ${lag}ms")
                    fi
                fi
            else
                status="CRITICAL"
                issues+=("Node on port $port not responding")
            fi
        done
    else
        status="CRITICAL"
        issues+=("Cannot connect to Patroni cluster")
    fi

    # Check database connectivity
    for port in 5435 5433 5434; do
        if ! pg_isready -h "$HETZNER_HOST" -p "$port" > /dev/null 2>&1; then
            status="CRITICAL"
            issues+=("PostgreSQL not accepting connections on port $port")
        fi
    done

    # Check etcd health
    if ! ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T etcd etcdctl endpoint health" >/dev/null 2>&1; then
        status="CRITICAL"
        issues+=("etcd cluster unhealthy")
    fi

    # Report status
    case $status in
        "HEALTHY")
            success "Cluster is HEALTHY - Leader: $leader_count, Replicas: $replica_count"
            ;;
        "WARNING")
            warning "Cluster has WARNINGS: ${issues[*]}"
            ;;
        "CRITICAL")
            alert "Cluster is CRITICAL: ${issues[*]}"
            ;;
    esac

    return $([ "$status" = "HEALTHY" ] && echo 0 || echo 1)
}

check_resource_usage() {
    # Check system resources
    if memory_usage=$(ssh root@"$HETZNER_HOST" "free | grep Mem | awk '{printf \"%.1f\", \$3/\$2 * 100.0}'" 2>/dev/null); then
        if (( $(echo "$memory_usage > 90" | bc -l) )); then
            warning "High memory usage: ${memory_usage}%"
        elif (( $(echo "$memory_usage > 80" | bc -l) )); then
            log "Memory usage: ${memory_usage}%"
        fi
    fi

    # Check disk usage
    if disk_usage=$(ssh root@"$HETZNER_HOST" "df / | tail -1 | awk '{print \$5}' | sed 's/%//'" 2>/dev/null); then
        if [ "$disk_usage" -gt 90 ]; then
            alert "Critical disk usage: ${disk_usage}%"
        elif [ "$disk_usage" -gt 80 ]; then
            warning "High disk usage: ${disk_usage}%"
        fi
    fi
}

check_container_status() {
    local expected_containers=("gardenos-etcd-dev" "gardenos-postgres-1-dev" "gardenos-postgres-2-dev" "gardenos-postgres-3-dev")
    local running_containers=()

    if container_list=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose ps --format '{{.Name}}:{{.State}}'" 2>/dev/null); then
        while IFS= read -r line; do
            container_name=$(echo "$line" | cut -d':' -f1)
            container_state=$(echo "$line" | cut -d':' -f2)

            if [[ " ${expected_containers[*]} " =~ " ${container_name} " ]]; then
                if [ "$container_state" = "running" ]; then
                    running_containers+=("$container_name")
                else
                    alert "Container $container_name is not running (state: $container_state)"
                fi
            fi
        done <<< "$container_list"

        if [ ${#running_containers[@]} -eq ${#expected_containers[@]} ]; then
            success "All ${#running_containers[@]} expected containers are running"
        else
            warning "Only ${#running_containers[@]} of ${#expected_containers[@]} expected containers are running"
        fi
    else
        error "Failed to check container status"
    fi
}

# Performance monitoring
monitor_performance() {
    log "📊 Performance metrics:"

    # Connection counts
    if connection_count=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 psql -U postgres -t -c \"SELECT count(*) FROM pg_stat_activity;\"" 2>/dev/null | tr -d ' '); then
        log "  Active connections: $connection_count"

        if [ "$connection_count" -gt 80 ]; then
            warning "High connection count: $connection_count"
        fi
    fi

    # Database size
    if db_size=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 psql -U postgres -t -c \"SELECT pg_size_pretty(pg_database_size('crm'));\"" 2>/dev/null | tr -d ' '); then
        log "  Database size: $db_size"
    fi

    # WAL files
    if wal_count=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 bash -c \"ls /home/postgres/pgdata/pgroot/data/pg_wal/ | wc -l\"" 2>/dev/null); then
        log "  WAL files: $wal_count"

        if [ "$wal_count" -gt 100 ]; then
            warning "High WAL file count: $wal_count"
        fi
    fi
}

# Continuous monitoring mode
continuous_monitor() {
    log "🔄 Starting continuous monitoring (interval: ${MONITOR_INTERVAL}s)"
    log "📝 Logging to: $LOG_FILE"
    log "🛑 Press Ctrl+C to stop"
    echo

    local check_count=0
    local healthy_count=0
    local warning_count=0
    local critical_count=0

    while true; do
        check_count=$((check_count + 1))

        echo -e "${CYAN}=== Health Check #$check_count at $(date) ===${NC}"

        # Core health checks
        if check_cluster_health; then
            healthy_count=$((healthy_count + 1))
        else
            if [[ $? -eq 1 ]]; then
                warning_count=$((warning_count + 1))
            else
                critical_count=$((critical_count + 1))
            fi
        fi

        check_container_status
        check_resource_usage

        # Performance monitoring every 5th check
        if [ $((check_count % 5)) -eq 0 ]; then
            monitor_performance
        fi

        # Summary stats every 10th check
        if [ $((check_count % 10)) -eq 0 ]; then
            log "📈 Summary: $healthy_count healthy, $warning_count warnings, $critical_count critical (last 10 checks)"
        fi

        echo -e "${CYAN}--- Waiting ${MONITOR_INTERVAL}s for next check ---${NC}"
        echo

        sleep "$MONITOR_INTERVAL"
    done
}

# Single check mode
single_check() {
    log "🔍 Single health check at $(date)"
    echo

    check_cluster_health
    check_container_status
    check_resource_usage
    monitor_performance

    log "✅ Single health check complete"
}

# Alert mode - check for critical issues only
alert_check() {
    local alerts=()

    # Quick critical checks only
    if ! ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" >/dev/null 2>&1; then
        alerts+=("Patroni cluster not responding")
    fi

    if ! pg_isready -h "$HETZNER_HOST" -p 5435 > /dev/null 2>&1; then
        alerts+=("PostgreSQL leader not accepting connections")
    fi

    if ! ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T etcd etcdctl endpoint health" >/dev/null 2>&1; then
        alerts+=("etcd cluster unhealthy")
    fi

    if [ ${#alerts[@]} -gt 0 ]; then
        for alert_msg in "${alerts[@]}"; do
            alert "$alert_msg"
        done
        return 1
    else
        success "No critical alerts detected"
        return 0
    fi
}

# Main function
main() {
    local mode="single"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --continuous|-c)
                mode="continuous"
                shift
                ;;
            --interval|-i)
                MONITOR_INTERVAL="$2"
                shift 2
                ;;
            --alert|-a)
                mode="alert"
                shift
                ;;
            --log-file|-l)
                LOG_FILE="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --continuous, -c       Run continuous monitoring"
                echo "  --interval, -i SEC     Set monitoring interval (default: 30s)"
                echo "  --alert, -a            Quick alert check only"
                echo "  --log-file, -l FILE    Set log file path"
                echo "  --help, -h             Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Create log directory if needed
    mkdir -p "$(dirname "$LOG_FILE")"

    log "🏥 TwinCiGo CRM Cluster Health Monitor"
    log "Cluster: $CLUSTER_NAME"
    log "Host: $HETZNER_HOST"
    log "Mode: $mode"

    case $mode in
        "continuous")
            continuous_monitor
            ;;
        "alert")
            alert_check
            ;;
        "single")
            single_check
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Monitoring stopped by user${NC}"; exit 0' INT

main "$@"
