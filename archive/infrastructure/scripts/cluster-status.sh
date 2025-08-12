#!/bin/bash

# 📊 TwinCiGo CRM Cluster Status Monitor
# Provides comprehensive status of the Hetzner HA PostgreSQL cluster
# Author: TwinCiGo CRM Team

set -euo pipefail

# Current deployment configuration (single server with 3-node Patroni cluster)
HETZNER_HOST="5.78.103.224"
CLUSTER_NAME="gardenos-dev-cluster"
COMPOSE_DIR="/opt/twincigo-crm"

# Patroni node ports
declare -A PATRONI_PORTS=(
    ["postgres-1"]="8008"
    ["postgres-2"]="8009"
    ["postgres-3"]="8010"
)

# PostgreSQL ports
declare -A PG_PORTS=(
    ["postgres-1"]="5435"
    ["postgres-2"]="5433"
    ["postgres-3"]="5434"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check host connectivity
check_host_connectivity() {
    log "📡 Checking host connectivity..."

    if ping -c 1 -W 3 $HETZNER_HOST > /dev/null 2>&1; then
        success "Host $HETZNER_HOST is reachable"
    else
        error "Host $HETZNER_HOST is not reachable"
        return 1
    fi

    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$HETZNER_HOST" "echo 'ok'" >/dev/null 2>&1; then
        success "SSH connection to $HETZNER_HOST successful"
    else
        error "SSH connection to $HETZNER_HOST failed"
        return 1
    fi
}

# Check Docker status
check_docker_status() {
    log "🐳 Checking Docker status..."

    if ssh root@"$HETZNER_HOST" "systemctl is-active docker" >/dev/null 2>&1; then
        success "Docker service is running"
    else
        error "Docker service is not running"
        return 1
    fi
}

# Check container status
check_containers() {
    log "📦 Checking container status..."

    if container_info=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose ps --format table" 2>/dev/null); then
        echo "$container_info"

        # Count running containers
        running_count=$(echo "$container_info" | grep -c "Up" || echo "0")
        total_count=$(echo "$container_info" | tail -n +2 | wc -l)

        if [ "$running_count" -eq "$total_count" ] && [ "$running_count" -gt 0 ]; then
            success "All $running_count containers are running"
        else
            warning "Only $running_count of $total_count containers are running"
        fi
    else
        error "Failed to get container status"
    fi
}

# Check Patroni cluster status
check_patroni_cluster() {
    log "🗄️  Checking Patroni cluster status..."

    # Get overall cluster status
    if cluster_info=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" 2>/dev/null); then
        echo "Cluster Information:"
        echo "$cluster_info" | jq . 2>/dev/null || echo "$cluster_info"

        # Parse cluster info
        leader_count=$(echo "$cluster_info" | jq -r '.members[] | select(.role=="leader") | .name' 2>/dev/null | wc -l)
        replica_count=$(echo "$cluster_info" | jq -r '.members[] | select(.role=="replica") | .name' 2>/dev/null | wc -l)
        total_members=$(echo "$cluster_info" | jq -r '.members | length' 2>/dev/null)

        log "Cluster Summary: $leader_count leader(s), $replica_count replica(s), $total_members total members"

        if [ "$leader_count" -eq 1 ] && [ "$replica_count" -eq 2 ] && [ "$total_members" -eq 3 ]; then
            success "Patroni cluster is healthy (1 leader + 2 replicas)"
        else
            warning "Patroni cluster configuration may have issues"
        fi
    else
        error "Failed to get Patroni cluster status"
    fi

    # Check individual nodes
    log "Individual Patroni node status:"
    for node in "${!PATRONI_PORTS[@]}"; do
        port="${PATRONI_PORTS[$node]}"

        if node_info=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:$port/patroni" 2>/dev/null); then
            state=$(echo "$node_info" | jq -r '.state' 2>/dev/null)
            role=$(echo "$node_info" | jq -r '.role' 2>/dev/null)
            timeline=$(echo "$node_info" | jq -r '.timeline' 2>/dev/null)

            success "$node (port $port): $role ($state) - Timeline: $timeline"

            # Check replication lag for replicas
            if [ "$role" = "replica" ]; then
                lag=$(echo "$node_info" | jq -r '.replication_state.lag' 2>/dev/null)
                if [ "$lag" != "null" ] && [ "$lag" != "" ]; then
                    if [ "$lag" -eq 0 ]; then
                        success "  └─ Replication lag: $lag (excellent)"
                    else
                        warning "  └─ Replication lag: $lag"
                    fi
                fi
            fi
        else
            error "$node (port $port): Not responding"
        fi
    done
}

# Check etcd health
check_etcd() {
    log "🔧 Checking etcd health..."

    # Check system etcd (used by K3s and Patroni)
    if etcd_health=$(curl -s http://"$HETZNER_HOST":2379/health 2>/dev/null); then
        if echo "$etcd_health" | grep -q '"health":"true"'; then
            success "System etcd is healthy"
        else
            warning "etcd health check returned: $etcd_health"
        fi
    else
        # Fallback: try Docker etcd if system etcd fails
        if etcd_health=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T etcd etcdctl endpoint health" 2>/dev/null); then
            echo "$etcd_health"
            if echo "$etcd_health" | grep -q "is healthy"; then
                success "Docker etcd cluster is healthy"
            else
                warning "Docker etcd health check returned warnings"
            fi
        else
            error "Failed to check both system and Docker etcd health"
        fi
    fi
}

# Check database connectivity
check_database() {
    log "💾 Testing database connectivity..."

    # Test each PostgreSQL port
    for node in "${!PG_PORTS[@]}"; do
        port="${PG_PORTS[$node]}"

        if pg_isready -h "$HETZNER_HOST" -p "$port" > /dev/null 2>&1; then
            success "$node (port $port): Accepting connections"
        else
            error "$node (port $port): Not accepting connections"
        fi
    done

    # Test from within the leader container
    if ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
        success "PostgreSQL leader container internal connectivity OK"

        # Check database schema
        log "Checking database schema..."
        if table_count=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 psql -U postgres -d crm -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\"" 2>/dev/null | tr -d ' '); then
            if [[ "$table_count" -gt 0 ]]; then
                success "Database schema applied ($table_count tables)"
            else
                warning "Database schema not applied or empty"
            fi
        else
            warning "Could not check database schema"
        fi
    else
        error "PostgreSQL leader container not accessible"
    fi
}

# Check HAProxy status (when running)
check_haproxy() {
    log "🔄 Checking HAProxy load balancer..."

    if ssh root@"$HETZNER_HOST" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy stats accessible at http://$HETZNER_HOST:7000/stats"

        # Check backend status
        log "HAProxy backend status:"
        ssh root@"$HETZNER_HOST" "curl -s http://localhost:7000/stats | grep postgres || echo 'No postgres backends found'" 2>/dev/null
    else
        warning "HAProxy not running or stats not accessible"
    fi
}

# Check Supabase services (when running)
check_supabase() {
    log "🚀 Checking Supabase services..."

    # Check Supabase Studio
    if ssh root@"$HETZNER_HOST" "curl -s http://localhost:3000/health" >/dev/null 2>&1; then
        success "Supabase Studio accessible at http://$HETZNER_HOST:3000"
    else
        warning "Supabase Studio not accessible"
    fi

    # Check Supabase REST API
    if ssh root@"$HETZNER_HOST" "curl -s http://localhost:54321/rest/v1/" >/dev/null 2>&1; then
        success "Supabase REST API accessible"
    else
        warning "Supabase REST API not accessible"
    fi

    # Check Supabase Auth
    if ssh root@"$HETZNER_HOST" "curl -s http://localhost:9999/health" >/dev/null 2>&1; then
        success "Supabase Auth accessible"
    else
        warning "Supabase Auth not accessible"
    fi
}

# Resource usage summary
check_resources() {
    log "📊 Checking resource usage..."

    # System resources
    log "System Resources on $HETZNER_HOST:"

    # CPU and memory
    if system_info=$(ssh root@"$HETZNER_HOST" "echo 'CPU: '$(top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1)'% | Memory: '$(free | grep Mem | awk '{printf \"%.1f%%\", \$3/\$2 * 100.0}')" 2>/dev/null); then
        echo "  $system_info"
    else
        warning "System resource check failed"
    fi

    # Disk usage
    if disk_info=$(ssh root@"$HETZNER_HOST" "df -h / | tail -1 | awk '{print \"Disk: \" \$5 \" used\"}'" 2>/dev/null); then
        echo "  $disk_info"
    else
        warning "Disk usage check failed"
    fi

    # Docker container stats
    log "Container Resource Usage:"
    if docker_stats=$(ssh root@"$HETZNER_HOST" "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'" 2>/dev/null); then
        echo "$docker_stats"
    else
        warning "Docker stats check failed"
    fi
}

# Show recent logs
show_recent_logs() {
    log "📋 Recent container logs (last 5 lines each)..."

    local services=("postgres-1" "postgres-2" "postgres-3" "etcd")

    for service in "${services[@]}"; do
        log "--- $service logs ---"
        if ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=5 $service" 2>/dev/null; then
            success "Logs retrieved for $service"
        else
            warning "Failed to get logs for $service"
        fi
        echo
    done
}

# Main status check
main() {
    local detailed=false
    local show_logs=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --detailed|-d)
                detailed=true
                shift
                ;;
            --logs|-l)
                show_logs=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --detailed, -d    Show detailed resource information"
                echo "  --logs, -l        Show recent container logs"
                echo "  --help, -h        Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    log "🔍 TwinCiGo CRM Hetzner HA Cluster Status Check"
    echo "=================================================="
    log "Cluster: $CLUSTER_NAME"
    log "Host: $HETZNER_HOST"
    log "Time: $(date)"
    echo

    # Core checks
    check_host_connectivity
    echo

    check_docker_status
    echo

    check_containers
    echo

    check_etcd
    echo

    check_patroni_cluster
    echo

    check_database
    echo

    # Optional service checks
    check_haproxy
    echo

    check_supabase
    echo

    # Optional detailed checks
    if [ "$detailed" = true ]; then
        check_resources
        echo
    fi

    # Optional log display
    if [ "$show_logs" = true ]; then
        show_recent_logs
    fi

    success "Cluster status check complete!"

    log "📋 Quick Access URLs:"
    log "  PostgreSQL Leader: $HETZNER_HOST:5435"
    log "  PostgreSQL Replica 1: $HETZNER_HOST:5433"
    log "  PostgreSQL Replica 2: $HETZNER_HOST:5434"
    log "  Patroni API: http://$HETZNER_HOST:8008/cluster"
    log "  Supabase Studio: http://$HETZNER_HOST:3000 (when running)"
    log "  HAProxy Stats: http://$HETZNER_HOST:7000/stats (when running)"
    echo
}

main "$@"
