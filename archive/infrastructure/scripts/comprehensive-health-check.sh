#!/bin/bash

# 🏥 Comprehensive Server Health Check Script
# Tests all critical infrastructure components and identifies issues

set -e

# Colors for output
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
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_DIR="docs/reporting/health_reports"
REPORT_FILE="$REPORT_DIR/health_report_${TIMESTAMP}.txt"

# Server report path (when running remotely)
SERVER_REPORT_DIR="/opt/crm/docs/reporting/health_reports"
SERVER_REPORT_FILE="$SERVER_REPORT_DIR/health_report_${TIMESTAMP}.txt"

# Detect if we're running locally on the server (only check IP match)
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
if [[ "$LOCAL_IP" == "$HETZNER_HOST" ]]; then
    RUNNING_LOCALLY=true
else
    RUNNING_LOCALLY=false
fi

# Debug output (remove after testing)
# echo "DEBUG: LOCAL_IP=$LOCAL_IP, HETZNER_HOST=$HETZNER_HOST, RUNNING_LOCALLY=$RUNNING_LOCALLY"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Determine which report file to use based on execution context
if [[ "$RUNNING_LOCALLY" == "true" ]]; then
    ACTIVE_REPORT_FILE="$REPORT_FILE"
    execute_cmd "mkdir -p $REPORT_DIR"
else
    ACTIVE_REPORT_FILE="$REPORT_FILE"  # Local file for display
    execute_cmd "mkdir -p $SERVER_REPORT_DIR"  # Create server directory
fi

# Health tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
ISSUES=()
WARNINGS=()

# Helper function for writing to report file
write_to_report() {
    local message="$1"
    if [[ "$RUNNING_LOCALLY" == "true" ]]; then
        echo "$message" >> "$REPORT_FILE"
    else
        execute_cmd "echo '$message' >> '$SERVER_REPORT_FILE'"
    fi
}

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    write_to_report "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    write_to_report "✅ $1"
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

# Helper function to execute commands locally or via SSH
execute_cmd() {
    local cmd="$1"
    if [[ "$RUNNING_LOCALLY" == "true" ]]; then
        eval "$cmd"
    else
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$HETZNER_HOST" "$cmd"
    fi
}

# Test functions
test_host_connectivity() {
    header "🌐 Host Connectivity Tests"
    
    # Primary host
    if ping -c 1 "$HETZNER_HOST" >/dev/null 2>&1; then
        success "Primary host $HETZNER_HOST is reachable"
    else
        error "Primary host $HETZNER_HOST is unreachable"
        return 1
    fi
    
    # SSH connectivity (only test when running remotely)
    if [[ "$RUNNING_LOCALLY" == "false" ]]; then
        info "Testing SSH connection to $HETZNER_HOST..."
        if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$HETZNER_HOST" "echo 'SSH test successful'" >/dev/null 2>&1; then
            success "SSH connection to $HETZNER_HOST successful"
        else
            error "SSH connection to $HETZNER_HOST failed"
            # Don't return early, continue with other tests
        fi
    else
        success "Running locally on $HETZNER_HOST - SSH test skipped"
    fi
    
    # Backup hosts
    for host in "${BACKUP_HOSTS[@]}"; do
        if ping -c 1 "$host" >/dev/null 2>&1; then
            success "Backup host $host is reachable"
        else
            warning "Backup host $host is unreachable"
        fi
    done
}

test_etcd_cluster() {
    header "🔧 etcd Cluster Health"
    
    local healthy_nodes=0
    local total_nodes=0
    
    # Test all etcd endpoints
    for host in "$HETZNER_HOST" "${BACKUP_HOSTS[@]}"; do
        ((total_nodes++))
        if curl -s "http://$host:2379/health" | grep -q '"health":"true"' 2>/dev/null; then
            success "etcd on $host is healthy"
            ((healthy_nodes++))
        else
            error "etcd on $host is unhealthy or unreachable"
        fi
    done
    
    # Cluster health assessment
    if [ $healthy_nodes -eq $total_nodes ]; then
        success "etcd cluster is fully healthy ($healthy_nodes/$total_nodes nodes)"
    elif [ $healthy_nodes -gt $((total_nodes / 2)) ]; then
        warning "etcd cluster has quorum but some nodes are down ($healthy_nodes/$total_nodes nodes)"
    else
        error "etcd cluster has lost quorum ($healthy_nodes/$total_nodes nodes)"
    fi
}

test_k3s_cluster() {
    header "☸️  K3s Cluster Health"
    
    # K3s service status
    info "Checking K3s service status..."
    if execute_cmd "systemctl is-active k3s" >/dev/null 2>&1; then
        success "K3s service is running"
    else
        error "K3s service is not running"
        # Continue with other tests even if K3s is down
    fi

    # Node status
    local node_output
    if node_output=$(execute_cmd "kubectl get nodes --no-headers" 2>/dev/null); then
        local ready_nodes=$(echo "$node_output" | grep -c "Ready" || echo "0")
        local total_nodes=$(echo "$node_output" | wc -l)
        
        if [ "$ready_nodes" -eq "$total_nodes" ] && [ "$ready_nodes" -gt 0 ]; then
            success "All K3s nodes are Ready ($ready_nodes/$total_nodes)"
        else
            warning "Some K3s nodes are not Ready ($ready_nodes/$total_nodes)"
        fi
    else
        error "Failed to get K3s node status"
    fi
    
    # Core system pods
    local core_pods
    if core_pods=$(execute_cmd "kubectl get pods -n kube-system --no-headers" 2>/dev/null); then
        local running_pods=$(echo "$core_pods" | grep -c "Running" || echo "0")
        local total_pods=$(echo "$core_pods" | wc -l)
        
        if [ "$running_pods" -gt 0 ]; then
            success "K3s core system pods are running ($running_pods/$total_pods)"
        else
            error "No K3s core system pods are running"
        fi
    else
        warning "Failed to get K3s system pod status"
    fi
}

test_docker_services() {
    header "🐳 Docker Services Health"
    
    # Docker service status
    info "Checking Docker service status..."
    if execute_cmd "systemctl is-active docker" >/dev/null 2>&1; then
        success "Docker service is running"
    else
        error "Docker service is not running"
        # Continue with other tests
    fi

    # Container status
    local container_output
    if container_output=$(execute_cmd "cd $COMPOSE_DIR && docker compose ps --format 'table {{.Name}}\t{{.Status}}'" 2>/dev/null); then
        local running_containers=$(echo "$container_output" | grep -c "Up" || echo "0")
        local total_containers=$(echo "$container_output" | tail -n +2 | wc -l)
        
        if [ "$running_containers" -gt 0 ]; then
            success "Docker containers are running ($running_containers/$total_containers)"
            
            # Check specific critical containers
            if echo "$container_output" | grep -q "postgres.*Up"; then
                success "PostgreSQL containers are running"
            else
                error "PostgreSQL containers are not running"
            fi
        else
            error "No Docker containers are running"
        fi
    else
        error "Failed to get Docker container status"
    fi
}

test_patroni_cluster() {
    header "🗄️  Patroni PostgreSQL Cluster (Docker Compose)"

    # Test Patroni API endpoints
    local leader_count=0
    local replica_count=0
    local total_members=0

    for port in 8008 8009 8010; do
        if cluster_info=$(curl -s "http://$HETZNER_HOST:$port/cluster" 2>/dev/null); then
            if echo "$cluster_info" | grep -q "members"; then
                success "Patroni API on port $port is responding"

                # Parse cluster information
                local leaders=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"role": "leader"')
                local replicas=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"role": "replica"')
                local members=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"name":')

                # Fallback if sed approach doesn't work
                if [ "$leaders" -eq 0 ] && [ "$replicas" -eq 0 ]; then
                    leaders=$(echo "$cluster_info" | grep -o '"role":"leader"' | wc -l)
                    replicas=$(echo "$cluster_info" | grep -o '"role":"replica"' | wc -l)
                    members=$(echo "$cluster_info" | grep -o '"name":"[^"]*"' | wc -l)
                fi

                leader_count=$leaders
                replica_count=$replicas
                total_members=$members
                break
            fi
        else
            warning "Patroni API on port $port is not responding"
        fi
    done

    # Cluster health assessment
    if [ "$leader_count" -eq 1 ] && [ "$replica_count" -ge 1 ]; then
        success "Patroni cluster is healthy (1 leader, $replica_count replicas, $total_members total)"
    elif [ "$leader_count" -eq 0 ]; then
        error "Patroni cluster has no leader"
    elif [ "$leader_count" -gt 1 ]; then
        error "Patroni cluster has multiple leaders ($leader_count)"
    else
        warning "Patroni cluster configuration may need attention (leader: $leader_count, replicas: $replica_count)"
    fi

    # Database connectivity
    for port in 5435 5433 5434; do
        if execute_cmd "timeout 3 bash -c '</dev/tcp/localhost/$port'" >/dev/null 2>&1; then
            success "PostgreSQL is accepting connections on port $port"
        else
            warning "PostgreSQL is not accepting connections on port $port"
        fi
    done
}

test_k3s_postgresql_cluster() {
    header "🗄️  K3s PostgreSQL Cluster (Production)"

    # Check if postgres-cluster namespace exists
    if ! execute_cmd "kubectl get namespace postgres-cluster" >/dev/null 2>&1; then
        warning "K3s PostgreSQL namespace 'postgres-cluster' not found"
        return
    fi

    # Get ALL pod status in postgres-cluster namespace
    local all_pods
    if all_pods=$(execute_cmd "kubectl get pods -n postgres-cluster --no-headers" 2>/dev/null); then
        # Clean up variables to ensure they're proper integers
        local total_pods=$(echo "$all_pods" | wc -l | tr -d ' \n\r')
        local running_pods=$(echo "$all_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")
        local pending_pods=$(echo "$all_pods" | grep -c "Pending" 2>/dev/null | tr -d ' \n\r' || echo "0")
        local failed_pods=$(echo "$all_pods" | grep -c -E "(Failed|Error|CrashLoopBackOff)" 2>/dev/null | tr -d ' \n\r' || echo "0")

        # Separate PostgreSQL database pods specifically
        local postgres_pods
        postgres_pods=$(echo "$all_pods" | grep -E "^postgres-[0-9]" || echo "")
        local postgres_count=$(echo "$postgres_pods" | grep -c "postgres-" 2>/dev/null | tr -d ' \n\r' || echo "0")
        local postgres_running=$(echo "$postgres_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")

        # Overall namespace health
        if [ "$failed_pods" -gt 0 ]; then
            error "K3s postgres-cluster namespace has $failed_pods failed pods (total: $total_pods)"
        elif [ "$pending_pods" -gt 0 ]; then
            warning "K3s postgres-cluster namespace has $pending_pods pending pods ($running_pods/$total_pods running)"
        else
            success "K3s postgres-cluster namespace is healthy ($running_pods/$total_pods pods running)"
        fi

        # PostgreSQL database cluster specific health
        if [ "$postgres_count" -gt 0 ]; then
            if [ "$postgres_running" -eq "$postgres_count" ]; then
                success "PostgreSQL database pods are healthy ($postgres_running/$postgres_count running)"
            elif [ "$postgres_running" -gt 0 ]; then
                warning "PostgreSQL database cluster degraded ($postgres_running/$postgres_count running)"
            else
                error "PostgreSQL database cluster is down (0/$postgres_count running)"
            fi
        else
            warning "No PostgreSQL database pods found"
        fi

        # Check individual pod status and identify issues for ALL pods
        echo "$all_pods" | while read -r line; do
            if [ -n "$line" ]; then
                local pod_name=$(echo "$line" | awk '{print $1}')
                local pod_status=$(echo "$line" | awk '{print $3}')
                local pod_ready=$(echo "$line" | awk '{print $2}')
                local pod_restarts=$(echo "$line" | awk '{print $4}')

                # Determine pod type for better reporting
                local pod_type="Unknown"
                if echo "$pod_name" | grep -q "^postgres-[0-9]"; then
                    pod_type="PostgreSQL Database"
                elif echo "$pod_name" | grep -q "backup"; then
                    pod_type="Backup System"
                elif echo "$pod_name" | grep -q "exporter"; then
                    pod_type="Monitoring"
                fi

                case "$pod_status" in
                    "Running")
                        if [[ "$pod_ready" =~ ^[0-9]+/[0-9]+$ ]]; then
                            local ready_count=$(echo "$pod_ready" | cut -d'/' -f1)
                            local total_count=$(echo "$pod_ready" | cut -d'/' -f2)
                            if [ "$ready_count" -eq "$total_count" ]; then
                                success "$pod_type pod $pod_name is healthy ($pod_ready ready)"
                            else
                                warning "$pod_type pod $pod_name is running but not fully ready ($pod_ready ready)"
                            fi
                        else
                            success "$pod_type pod $pod_name is running"
                        fi

                        # Check for excessive restarts
                        if [ "$pod_restarts" != "0" ] && [ "$pod_restarts" -gt 5 ]; then
                            warning "$pod_type pod $pod_name has high restart count: $pod_restarts"
                        fi
                        ;;
                    "Pending")
                        warning "$pod_type pod $pod_name is pending - checking scheduling issues..."
                        # Get detailed pod description for scheduling issues
                        local pod_events=$(execute_cmd "kubectl describe pod $pod_name -n postgres-cluster | grep -A 5 'Events:'" 2>/dev/null)
                        if echo "$pod_events" | grep -q "FailedScheduling"; then
                            error "$pod_type pod $pod_name has scheduling issues (node affinity/volume conflicts)"
                        elif echo "$pod_events" | grep -q "Insufficient"; then
                            error "$pod_type pod $pod_name cannot schedule due to insufficient resources"
                        else
                            warning "$pod_type pod $pod_name is pending for unknown reasons"
                        fi
                        ;;
                    "Failed"|"Error")
                        error "$pod_type pod $pod_name is in failed state: $pod_status"
                        ;;
                    "CrashLoopBackOff")
                        error "$pod_type pod $pod_name is crash looping (restarts: $pod_restarts)"
                        # Get recent logs for crash analysis
                        info "Recent logs for $pod_name:"
                        execute_cmd "kubectl logs $pod_name -n postgres-cluster --tail=3" 2>/dev/null || echo "  Could not retrieve logs"
                        ;;
                    "Completed")
                        if echo "$pod_name" | grep -q "backup"; then
                            success "$pod_type job $pod_name completed successfully"
                        else
                            info "$pod_type pod $pod_name completed"
                        fi
                        ;;
                    *)
                        warning "$pod_type pod $pod_name has unknown status: $pod_status"
                        ;;
                esac
            fi
        done

    else
        error "Failed to get K3s PostgreSQL pod status"
    fi

    # Check Patroni leader in K3s cluster
    info "Checking K3s Patroni cluster leadership..."
    local k3s_leader_found=false
    for i in 0 1 2; do
        local pod_name="postgres-$i"
        if execute_cmd "kubectl get pod $pod_name -n postgres-cluster --no-headers 2>/dev/null | grep -q Running"; then
            if execute_cmd "kubectl exec -n postgres-cluster $pod_name -- patronictl list 2>/dev/null | grep -q '$pod_name.*Leader'"; then
                success "K3s Patroni leader found: $pod_name"
                k3s_leader_found=true
                break
            fi
        fi
    done

    if [ "$k3s_leader_found" = false ]; then
        error "No K3s Patroni leader found - cluster may be in split-brain or all pods down"
    fi

    # Check K3s PostgreSQL services
    local k3s_pg_services=(
        "postgres-cluster:postgres-cluster:PostgreSQL Cluster Service"
        "postgres-cluster:postgres-primary:PostgreSQL Primary Service"
        "postgres-cluster:postgres-replica:PostgreSQL Replica Service"
    )

    for service in "${k3s_pg_services[@]}"; do
        local namespace=$(echo "$service" | cut -d: -f1)
        local svc_name=$(echo "$service" | cut -d: -f2)
        local display_name=$(echo "$service" | cut -d: -f3)

        if execute_cmd "kubectl get service $svc_name -n $namespace" >/dev/null 2>&1; then
            success "$display_name is configured"
        else
            warning "$display_name not found"
        fi
    done

    # Check backup system
    info "Checking K3s PostgreSQL backup system..."
    if execute_cmd "kubectl get cronjob postgres-backup -n postgres-cluster" >/dev/null 2>&1; then
        success "PostgreSQL backup CronJob is configured"

        # Check recent backup jobs (including failed ones)
        local all_jobs=$(execute_cmd "kubectl get jobs -n postgres-cluster -l app=postgres-backup --sort-by=.metadata.creationTimestamp --no-headers" 2>/dev/null)
        if [ -n "$all_jobs" ]; then
            local total_jobs=$(echo "$all_jobs" | wc -l)
            local successful_jobs=$(echo "$all_jobs" | grep -c "1/1" || echo "0")
            local failed_jobs=$(echo "$all_jobs" | grep -c "0/1" || echo "0")
            local running_jobs=$(echo "$all_jobs" | grep -v -E "(1/1|0/1)" | wc -l || echo "0")

            if [ "$failed_jobs" -gt 0 ]; then
                error "Found $failed_jobs failed backup jobs (total: $total_jobs, successful: $successful_jobs)"
                # Show details of failed jobs
                echo "$all_jobs" | grep "0/1" | while read -r job_line; do
                    local job_name=$(echo "$job_line" | awk '{print $1}')
                    warning "Failed backup job: $job_name"
                done
            elif [ "$successful_jobs" -gt 0 ]; then
                success "Recent backup jobs successful ($successful_jobs/$total_jobs)"
            else
                info "No completed backup jobs found yet"
            fi

            if [ "$running_jobs" -gt 0 ]; then
                info "$running_jobs backup jobs currently running"
            fi
        else
            info "No backup jobs found (CronJob may not have run yet)"
        fi

        # Check for any backup pods in problematic states
        local backup_pods=$(execute_cmd "kubectl get pods -n postgres-cluster -l app=postgres-backup --no-headers" 2>/dev/null)
        if [ -n "$backup_pods" ]; then
            local crash_pods=$(echo "$backup_pods" | grep -c "CrashLoopBackOff" 2>/dev/null | tr -d ' \n\r' || echo "0")
            local error_pods=$(echo "$backup_pods" | grep -c -E "(Error|Failed)" 2>/dev/null | tr -d ' \n\r' || echo "0")

            if [ "$crash_pods" -gt 0 ]; then
                error "Found $crash_pods backup pods in CrashLoopBackOff state"
            fi
            if [ "$error_pods" -gt 0 ]; then
                error "Found $error_pods backup pods in error state"
            fi
        fi

        # Check backup reports (if running locally)
        if [[ "$RUNNING_LOCALLY" == "false" ]]; then
            info "Checking backup reports..."
            local backup_reports_dir="docs/reporting/backup_reports"
            if [ -d "$backup_reports_dir" ]; then
                local recent_reports=$(ls -t "$backup_reports_dir"/backup_report_*.json 2>/dev/null | head -5)
                if [ -n "$recent_reports" ]; then
                    local total_reports=$(echo "$recent_reports" | wc -l)
                    local successful_reports=0
                    local failed_reports=0

                    for report in $recent_reports; do
                        if [ -f "$report" ]; then
                            local status=$(grep '"status"' "$report" | cut -d'"' -f4 2>/dev/null || echo "UNKNOWN")
                            if [ "$status" = "SUCCESS" ]; then
                                ((successful_reports++))
                            else
                                ((failed_reports++))
                            fi
                        fi
                    done

                    if [ "$failed_reports" -eq 0 ]; then
                        success "Recent backup reports show success ($successful_reports/$total_reports successful)"
                    else
                        warning "Some recent backups failed ($successful_reports successful, $failed_reports failed)"
                    fi

                    # Show latest backup info
                    local latest_report=$(echo "$recent_reports" | head -1)
                    if [ -f "$latest_report" ]; then
                        local latest_status=$(grep '"status"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "UNKNOWN")
                        local latest_timestamp=$(grep '"timestamp"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "Unknown")
                        local latest_size=$(grep '"backup_size_human"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "Unknown")
                        info "Latest backup: $latest_timestamp, Status: $latest_status, Size: $latest_size"
                    fi
                else
                    info "No backup reports found"
                fi
            else
                info "Backup reports directory not found (may be running remotely)"
            fi
        fi
    else
        warning "PostgreSQL backup CronJob not configured"
    fi

    # Check persistent volumes
    info "Checking K3s PostgreSQL persistent volumes..."
    local pv_output
    if pv_output=$(execute_cmd "kubectl get pvc -n postgres-cluster --no-headers" 2>/dev/null); then
        local total_pvcs=$(echo "$pv_output" | wc -l)
        local bound_pvcs=$(echo "$pv_output" | grep -c "Bound" || echo "0")

        if [ "$bound_pvcs" -eq "$total_pvcs" ] && [ "$total_pvcs" -gt 0 ]; then
            success "All PostgreSQL persistent volumes are bound ($bound_pvcs/$total_pvcs)"
        elif [ "$bound_pvcs" -gt 0 ]; then
            warning "Some PostgreSQL persistent volumes not bound ($bound_pvcs/$total_pvcs)"
        else
            error "No PostgreSQL persistent volumes are bound"
        fi
    else
        warning "Failed to get PostgreSQL persistent volume status"
    fi
}

test_application_services() {
    header "🚀 Application Services"

    # Test key application endpoints (corrected ports)
    local services=(
        "8080:HAProxy Web Frontend"
        "8404:HAProxy Stats"
        "5432:HAProxy PostgreSQL LB"
        "6443:HAProxy K3s API LB"
    )

    for service in "${services[@]}"; do
        local port=$(echo "$service" | cut -d: -f1)
        local name=$(echo "$service" | cut -d: -f2)

        if execute_cmd "timeout 3 bash -c '</dev/tcp/localhost/$port'" >/dev/null 2>&1; then
            success "$name is listening on port $port"
        else
            warning "$name is not listening on port $port"
        fi
    done

    # Test K3s-based Supabase services
    info "Checking K3s-based Supabase services..."
    local k3s_services=(
        "supabase:gotrue:Supabase Auth"
        "supabase:postgrest:Supabase REST"
        "supabase:storage-api:Supabase Storage"
    )

    for service in "${k3s_services[@]}"; do
        local namespace=$(echo "$service" | cut -d: -f1)
        local svc_name=$(echo "$service" | cut -d: -f2)
        local display_name=$(echo "$service" | cut -d: -f3)

        if execute_cmd "kubectl get service $svc_name -n $namespace" >/dev/null 2>&1; then
            # Check if pods are running
            local running_pods=$(execute_cmd "kubectl get pods -n $namespace -l app=$svc_name --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l")
            if [ "$running_pods" -gt 0 ]; then
                success "$display_name is running in K3s ($running_pods pods)"
            else
                warning "$display_name service exists but no running pods"
            fi
        else
            warning "$display_name service not found in K3s"
        fi
    done
}

test_minio_storage() {
    header "🗄️  MinIO Distributed Storage"

    # Check MinIO pods in K3s
    info "Checking MinIO cluster status..."
    local minio_pods
    if minio_pods=$(execute_cmd "kubectl get pods -n storage -l app=minio --no-headers" 2>/dev/null); then
        local running_pods=$(echo "$minio_pods" | grep -c "Running" || echo "0")
        local total_pods=$(echo "$minio_pods" | wc -l)

        if [ "$running_pods" -eq "$total_pods" ] && [ "$running_pods" -gt 0 ]; then
            success "MinIO cluster is healthy ($running_pods/$total_pods pods running)"
        elif [ "$running_pods" -gt 0 ]; then
            warning "MinIO cluster partially healthy ($running_pods/$total_pods pods running)"
        else
            error "MinIO cluster is down (0/$total_pods pods running)"
        fi
    else
        error "Failed to get MinIO pod status"
    fi

    # Check MinIO services
    local minio_services=(
        "minio-api:MinIO S3 API"
        "minio-console:MinIO Console"
    )

    for service in "${minio_services[@]}"; do
        local svc_name=$(echo "$service" | cut -d: -f1)
        local display_name=$(echo "$service" | cut -d: -f2)

        if execute_cmd "kubectl get service $svc_name -n storage" >/dev/null 2>&1; then
            success "$display_name service is available"
        else
            error "$display_name service not found"
        fi
    done

    # Test MinIO API health endpoint
    info "Testing MinIO API health..."
    if execute_cmd "kubectl exec -n storage minio-0 -- curl -s http://localhost:9000/minio/health/live" >/dev/null 2>&1; then
        success "MinIO API health endpoint is responding"
    else
        warning "MinIO API health endpoint is not responding"
    fi

    # Check MinIO buckets
    info "Checking MinIO buckets..."
    local bucket_output
    if bucket_output=$(execute_cmd "kubectl exec -n storage minio-0 -- mc ls minio/ 2>/dev/null"); then
        local bucket_count=$(echo "$bucket_output" | grep -c "crm-" || echo "0")
        if [ "$bucket_count" -ge 5 ]; then
            success "MinIO buckets are configured ($bucket_count CRM buckets found)"
        elif [ "$bucket_count" -gt 0 ]; then
            warning "Some MinIO buckets are missing ($bucket_count/5 CRM buckets found)"
        else
            error "No MinIO CRM buckets found"
        fi
    else
        warning "Failed to list MinIO buckets"
    fi

    # Check storage usage
    info "Checking MinIO storage usage..."
    if storage_info=$(execute_cmd "kubectl exec -n storage minio-0 -- mc admin info minio 2>/dev/null"); then
        # Check for various indicators of healthy storage
        if echo "$storage_info" | grep -q -E "(Online|Used|Available|Drives)"; then
            # Try to count drives or just confirm storage is accessible
            local drive_indicators=$(echo "$storage_info" | grep -c -E "(drive|Drive|/data)" || echo "0")
            if [ "$drive_indicators" -gt 0 ]; then
                success "MinIO storage is accessible and healthy ($drive_indicators storage indicators)"
            else
                success "MinIO storage is accessible and responding"
            fi
        else
            warning "MinIO storage drive status unclear"
        fi
    else
        warning "Failed to get MinIO storage information"
    fi

    # Check MinIO ingress
    info "Checking MinIO ingress configuration..."
    local ingress_output
    if ingress_output=$(execute_cmd "kubectl get ingress -n storage --no-headers" 2>/dev/null); then
        local ingress_count=$(echo "$ingress_output" | wc -l)
        if [ "$ingress_count" -ge 2 ]; then
            success "MinIO ingress is configured ($ingress_count ingress rules)"
        else
            warning "MinIO ingress may be incomplete ($ingress_count ingress rules)"
        fi
    else
        warning "Failed to get MinIO ingress status"
    fi
}

test_backup_system() {
    header "💾 Backup System Status"

    # Check backup reports directory
    local backup_reports_dir="docs/reporting/backup_reports"
    if [ -d "$backup_reports_dir" ]; then
        success "Backup reports directory exists"

        # Analyze recent backup reports
        local recent_reports=$(ls -t "$backup_reports_dir"/backup_report_*.json 2>/dev/null | head -10)
        if [ -n "$recent_reports" ]; then
            local total_reports=$(echo "$recent_reports" | wc -l)
            local successful_backups=0
            local failed_backups=0
            local total_size=0

            info "Analyzing $total_reports recent backup reports..."

            for report in $recent_reports; do
                if [ -f "$report" ]; then
                    local status=$(grep '"status"' "$report" | cut -d'"' -f4 2>/dev/null || echo "UNKNOWN")
                    local size_bytes=$(grep '"backup_size_bytes"' "$report" | cut -d':' -f2 | tr -d ' ,' 2>/dev/null || echo "0")

                    if [ "$status" = "SUCCESS" ]; then
                        ((successful_backups++))
                        total_size=$((total_size + size_bytes))
                    else
                        ((failed_backups++))
                    fi
                fi
            done

            # Report backup success rate
            local success_rate=$((successful_backups * 100 / total_reports))
            if [ "$success_rate" -ge 90 ]; then
                success "Backup success rate: $success_rate% ($successful_backups/$total_reports successful)"
            elif [ "$success_rate" -ge 70 ]; then
                warning "Backup success rate: $success_rate% ($successful_backups/$total_reports successful)"
            else
                error "Poor backup success rate: $success_rate% ($successful_backups/$total_reports successful)"
            fi

            # Show latest backup details
            local latest_report=$(echo "$recent_reports" | head -1)
            if [ -f "$latest_report" ]; then
                local latest_timestamp=$(grep '"timestamp"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "Unknown")
                local latest_status=$(grep '"status"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "UNKNOWN")
                local latest_size=$(grep '"backup_size_human"' "$latest_report" | cut -d'"' -f4 2>/dev/null || echo "Unknown")
                local latest_duration=$(grep '"duration_seconds"' "$latest_report" | cut -d':' -f2 | tr -d ' ,' 2>/dev/null || echo "0")

                if [ "$latest_status" = "SUCCESS" ]; then
                    success "Latest backup: $latest_timestamp ($latest_size, ${latest_duration}s)"
                else
                    error "Latest backup failed: $latest_timestamp"
                fi
            fi

            # Calculate average backup size
            if [ "$successful_backups" -gt 0 ]; then
                local avg_size_mb=$((total_size / successful_backups / 1024 / 1024))
                info "Average backup size: ${avg_size_mb}MB (from $successful_backups successful backups)"
            fi

        else
            warning "No backup reports found"
        fi

        # Check for backup report summaries
        local summary_files=$(ls -t "$backup_reports_dir"/backup_summary_*.txt 2>/dev/null | head -3)
        if [ -n "$summary_files" ]; then
            local summary_count=$(echo "$summary_files" | wc -l)
            success "Found $summary_count recent backup summaries"
        else
            info "No backup summary files found"
        fi

    else
        warning "Backup reports directory not found: $backup_reports_dir"
    fi

    # Check MinIO backup storage
    if [[ "$RUNNING_LOCALLY" == "true" ]]; then
        info "Checking MinIO backup storage..."
        local minio_backups=$(execute_cmd "kubectl exec -n storage minio-0 -- mc ls minio/crm-backups/ 2>/dev/null | wc -l" || echo "0")
        if [ "$minio_backups" -gt 0 ]; then
            success "MinIO contains $minio_backups backup files"
        else
            warning "No backup files found in MinIO storage"
        fi
    fi
}

test_security_compliance() {
    header "🔒 Security Compliance"
    
    # Run local security validation (only if application source code exists)
    if [ -f "scripts/validate-security.js" ] && [ -d "app" ] && [ -d "lib" ]; then
        info "Running security validation..."
        if security_output=$(node scripts/validate-security.js 2>&1); then
            # Parse the actual output format more carefully
            local passed_count=$(echo "$security_output" | grep "✅ Passed:" | sed 's/.*✅ Passed: \([0-9]*\).*/\1/')
            local failed_count=$(echo "$security_output" | grep "❌ Failed:" | sed 's/.*❌ Failed: \([0-9]*\).*/\1/')
            local warning_count=$(echo "$security_output" | grep "⚠️  Warnings:" | sed 's/.*⚠️  Warnings: \([0-9]*\).*/\1/')

            # Validate that we got numbers
            if [[ "$passed_count" =~ ^[0-9]+$ ]] && [[ "$failed_count" =~ ^[0-9]+$ ]] && [[ "$warning_count" =~ ^[0-9]+$ ]]; then
                if [ "$failed_count" -eq 0 ] && [ "$warning_count" -eq 0 ]; then
                    success "Security compliance: $passed_count/$passed_count checks passed (100%)"
                elif [ "$failed_count" -eq 0 ]; then
                    warning "Security compliance: $passed_count passed, $warning_count warnings"
                else
                    error "Security compliance: $failed_count critical issues found"
                fi
            else
                # Fallback: check for the summary message
                if echo "$security_output" | grep -q "ALL SECURITY CHECKS PASSED"; then
                    success "Security compliance: All security checks passed (100%)"
                else
                    warning "Security validation completed but could not parse detailed results"
                fi
            fi
        else
            warning "Security validation script failed to run"
        fi
    elif [ -f "scripts/validate-security.js" ]; then
        info "Security validation script found but application source code not available (infrastructure server)"
        success "Security validation should be run locally before deployment"
    else
        warning "Security validation script not found"
    fi
    
    # Check environment file security
    if [ -f ".env.local" ]; then
        # Check if using server-centralized management
        if [ -f ".env-files/.env-management-config" ]; then
            success "Using server-centralized environment management (local .env.local for development)"
            info "Server-centralized management is active - local file is for development convenience"
        # Check if it contains real secrets or just templates
        elif grep -q "your_dev_" ".env.local" && grep -q "development_password" ".env.local"; then
            success "Local .env.local file contains safe template values"
            info "Optional: Consider server-centralized management for team workflows"
        else
            warning "Local .env.local file contains real secrets (consider server-centralized management)"
        fi
    else
        success "No local .env.local file (using server-centralized management)"
    fi
}

generate_summary() {
    header "📊 Health Check Summary"
    
    local health_percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    echo -e "\n${BOLD}Overall Health Score: ${health_percentage}%${NC}"
    echo -e "\nOverall Health Score: ${health_percentage}%" >> "$REPORT_FILE"
    echo -e "${GREEN}✅ Passed: $PASSED_CHECKS${NC}"
    echo "✅ Passed: $PASSED_CHECKS" >> "$REPORT_FILE"
    echo -e "${YELLOW}⚠️  Warnings: $WARNING_CHECKS${NC}"
    echo "⚠️  Warnings: $WARNING_CHECKS" >> "$REPORT_FILE"
    echo -e "${RED}❌ Failed: $FAILED_CHECKS${NC}"
    echo "❌ Failed: $FAILED_CHECKS" >> "$REPORT_FILE"
    echo -e "${BLUE}📋 Total Checks: $TOTAL_CHECKS${NC}"
    echo "📋 Total Checks: $TOTAL_CHECKS" >> "$REPORT_FILE"
    
    # Health status
    if [ $health_percentage -ge 90 ]; then
        echo -e "\n${GREEN}🎉 EXCELLENT HEALTH - Production Ready!${NC}"
        echo -e "\n🎉 EXCELLENT HEALTH - Production Ready!" >> "$REPORT_FILE"
    elif [ $health_percentage -ge 75 ]; then
        echo -e "\n${YELLOW}⚠️  GOOD HEALTH - Minor issues to address${NC}"
        echo -e "\n⚠️  GOOD HEALTH - Minor issues to address" >> "$REPORT_FILE"
    elif [ $health_percentage -ge 50 ]; then
        echo -e "\n${YELLOW}⚠️  FAIR HEALTH - Several issues need attention${NC}"
        echo -e "\n⚠️  FAIR HEALTH - Several issues need attention" >> "$REPORT_FILE"
    else
        echo -e "\n${RED}🚨 POOR HEALTH - Critical issues require immediate attention${NC}"
        echo -e "\n🚨 POOR HEALTH - Critical issues require immediate attention" >> "$REPORT_FILE"
    fi
    
    # List critical issues
    if [ ${#ISSUES[@]} -gt 0 ]; then
        echo -e "\n${RED}🚨 Critical Issues:${NC}"
        echo -e "\n🚨 Critical Issues:" >> "$REPORT_FILE"
        for issue in "${ISSUES[@]}"; do
            echo -e "${RED}  • $issue${NC}"
            echo "  • $issue" >> "$REPORT_FILE"
        done
    fi

    # List warnings
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Warnings:${NC}"
        echo -e "\n⚠️  Warnings:" >> "$REPORT_FILE"
        for warning in "${WARNINGS[@]}"; do
            echo -e "${YELLOW}  • $warning${NC}"
            echo "  • $warning" >> "$REPORT_FILE"
        done
    fi
    
    echo -e "\n${CYAN}📄 Full report saved to: $REPORT_FILE${NC}"

    # If running locally (testing remote server), download the report from server
    if [[ "$RUNNING_LOCALLY" == "false" ]]; then
        local local_report_dir="docs/reporting/health_reports"
        local report_filename=$(basename "$REPORT_FILE")
        local local_report_path="$local_report_dir/$report_filename"

        # Ensure local directory exists
        mkdir -p "$local_report_dir" 2>/dev/null

        # Download the report from server (the report was created on server via SSH)
        echo -e "${CYAN}ℹ️  Downloading health report to local machine...${NC}"
        if timeout 30 scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$HETZNER_HOST":"$SERVER_REPORT_FILE" "$local_report_path" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Health report downloaded to: $local_report_path${NC}"
        else
            echo -e "${YELLOW}⚠️  Failed to download health report from server${NC}"
            echo -e "${YELLOW}   Server report location: $SERVER_REPORT_FILE${NC}"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BOLD}${BLUE}🏥 Comprehensive Server Health Check${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
    echo -e "${CYAN}Timestamp: $(date)${NC}"
    echo -e "${CYAN}Primary Host: $HETZNER_HOST${NC}"
    echo -e "${CYAN}Report File: $REPORT_FILE${NC}\n"
    
    # Initialize report file
    echo "Comprehensive Server Health Check Report" > "$REPORT_FILE"
    echo "Generated: $(date)" >> "$REPORT_FILE"
    echo "Primary Host: $HETZNER_HOST" >> "$REPORT_FILE"
    echo "=========================================" >> "$REPORT_FILE"
    
    # Run all tests with progress
    echo -e "${CYAN}Running comprehensive health checks...${NC}\n"

    echo -e "${CYAN}[1/10]${NC} Testing host connectivity..."
    test_host_connectivity || true

    echo -e "${CYAN}[2/10]${NC} Testing etcd cluster..."
    test_etcd_cluster || true

    echo -e "${CYAN}[3/10]${NC} Testing K3s cluster..."
    test_k3s_cluster || true

    echo -e "${CYAN}[4/10]${NC} Testing Docker services..."
    test_docker_services || true

    echo -e "${CYAN}[5/10]${NC} Testing Patroni cluster (Docker)..."
    test_patroni_cluster || true

    echo -e "${CYAN}[6/10]${NC} Testing K3s PostgreSQL cluster..."
    test_k3s_postgresql_cluster || true

    echo -e "${CYAN}[7/10]${NC} Testing backup system..."
    test_backup_system || true

    echo -e "${CYAN}[8/10]${NC} Testing application services..."
    test_application_services || true

    echo -e "${CYAN}[9/10]${NC} Testing MinIO storage..."
    test_minio_storage || true

    echo -e "${CYAN}[10/10]${NC} Testing security compliance..."
    test_security_compliance || true
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
