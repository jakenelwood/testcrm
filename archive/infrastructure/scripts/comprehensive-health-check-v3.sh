#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# 🏥 Comprehensive Health Check Script v3 - Complete Monitoring with Real-time Output
# Orchestrator/Executor Model with full functionality and live streaming

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

# This function contains the complete health check logic
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
    
    # Logging functions that write to both screen and file
    log_message() {
        echo -e "$1" | tee -a "$REPORT_FILE"
    }
    
    success() {
        echo -e "${GREEN}✅ $1${NC}" | tee -a "$REPORT_FILE"
        ((PASSED_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    error() {
        echo -e "${RED}❌ $1${NC}" | tee -a "$REPORT_FILE"
        ISSUES+=("$1")
        ((FAILED_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    warning() {
        echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$REPORT_FILE"
        WARNINGS+=("$1")
        ((WARNING_CHECKS++))
        ((TOTAL_CHECKS++))
    }
    
    info() {
        echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$REPORT_FILE"
    }
    
    header() {
        echo -e "\n${BOLD}${BLUE}$1${NC}" | tee -a "$REPORT_FILE"
        echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}" | tee -a "$REPORT_FILE"
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
    echo -e "${CYAN}[1/10]${NC} Testing host connectivity..."
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
    echo -e "${CYAN}[2/10]${NC} Testing etcd cluster..."
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
    echo -e "${CYAN}[3/10]${NC} Testing K3s cluster..."
    header "☸️  K3s Cluster Health"
    
    info "Checking K3s service status..."
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
    
    # Core system pods
    local core_pods
    if core_pods=$(kubectl get pods -n kube-system --no-headers 2>/dev/null); then
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
    
    # Test 4: Docker Services
    echo -e "${CYAN}[4/10]${NC} Testing Docker services..."
    header "🐳 Docker Services Health"
    
    info "Checking Docker service status..."
    if systemctl is-active docker >/dev/null 2>&1; then
        success "Docker service is running"
    else
        error "Docker service is not running"
    fi
    
    # Container status
    local container_output
    if container_output=$(cd $COMPOSE_DIR && docker compose ps --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null); then
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
    
    # Test 5: Patroni Cluster (Docker)
    echo -e "${CYAN}[5/10]${NC} Testing Patroni cluster (Docker)..."
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
        if timeout 3 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1; then
            success "PostgreSQL is accepting connections on port $port"
        else
            warning "PostgreSQL is not accepting connections on port $port"
        fi
    done
    
    # Test 6: K3s PostgreSQL Cluster (Production)
    echo -e "${CYAN}[6/10]${NC} Testing K3s PostgreSQL cluster..."
    header "🗄️  K3s PostgreSQL Cluster (Production)"

    # Check if postgres-cluster namespace exists
    if ! kubectl get namespace postgres-cluster >/dev/null 2>&1; then
        warning "K3s PostgreSQL namespace 'postgres-cluster' not found"
    else
        # Get ALL pod status in postgres-cluster namespace
        local all_pods
        if all_pods=$(kubectl get pods -n postgres-cluster --no-headers 2>/dev/null); then
            # Clean up variables to ensure they're proper integers
            local total_pods=$(echo "$all_pods" | wc -l | tr -d ' \n\r')
            local running_pods=$(echo "$all_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")
            local pending_pods=$(echo "$all_pods" | grep -c "Pending" 2>/dev/null | tr -d ' \n\r' || echo "0")
            local failed_pods=$(echo "$all_pods" | grep -c -E "(Failed|Error|CrashLoopBackOff)" 2>/dev/null | tr -d ' \n\r' || echo "0")

            # Overall namespace health
            if [ "$failed_pods" -gt 0 ]; then
                error "K3s postgres-cluster namespace has $failed_pods failed pods (total: $total_pods)"
            elif [ "$pending_pods" -gt 0 ]; then
                warning "K3s postgres-cluster namespace has $pending_pods pending pods ($running_pods/$total_pods running)"
            else
                success "K3s postgres-cluster namespace is healthy ($running_pods/$total_pods pods running)"
            fi

            # Separate PostgreSQL database pods specifically
            local postgres_pods
            postgres_pods=$(echo "$all_pods" | grep -E "^postgres-[0-9]" || echo "")
            if [ -n "$postgres_pods" ]; then
                local postgres_count=$(echo "$postgres_pods" | grep -c "postgres-" 2>/dev/null | tr -d ' \n\r' || echo "0")
                local postgres_running=$(echo "$postgres_pods" | grep -c "Running" 2>/dev/null | tr -d ' \n\r' || echo "0")

                if [ "$postgres_running" -eq "$postgres_count" ]; then
                    success "PostgreSQL database pods are healthy ($postgres_running/$postgres_count running)"
                elif [ "$postgres_running" -gt 0 ]; then
                    warning "PostgreSQL database cluster degraded ($postgres_running/$postgres_count running)"
                else
                    error "PostgreSQL database cluster is down (0/$postgres_count running)"
                fi
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
                            ;;
                        "Failed"|"Error")
                            error "$pod_type pod $pod_name is in failed state: $pod_status"
                            ;;
                        "CrashLoopBackOff")
                            error "$pod_type pod $pod_name is crash looping (restarts: $pod_restarts)"
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
            if kubectl get pod $pod_name -n postgres-cluster --no-headers 2>/dev/null | grep -q Running; then
                if kubectl exec -n postgres-cluster $pod_name -- patronictl list 2>/dev/null | grep -q "$pod_name.*Leader"; then
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

            if kubectl get service $svc_name -n $namespace >/dev/null 2>&1; then
                success "$display_name is configured"
            else
                warning "$display_name not found"
            fi
        done

        # Check backup system
        info "Checking K3s PostgreSQL backup system..."
        if kubectl get cronjob postgres-backup -n postgres-cluster >/dev/null 2>&1; then
            success "PostgreSQL backup CronJob is configured"

            # Check recent backup jobs
            local all_jobs=$(kubectl get jobs -n postgres-cluster -l app=postgres-backup --sort-by=.metadata.creationTimestamp --no-headers 2>/dev/null)
            if [ -n "$all_jobs" ]; then
                local total_jobs=$(echo "$all_jobs" | wc -l)
                local successful_jobs=$(echo "$all_jobs" | grep -c "1/1" || echo "0")
                local failed_jobs=$(echo "$all_jobs" | grep -c "0/1" || echo "0")

                if [ "$failed_jobs" -gt 0 ]; then
                    error "Found $failed_jobs failed backup jobs (total: $total_jobs, successful: $successful_jobs)"
                elif [ "$successful_jobs" -gt 0 ]; then
                    success "Recent backup jobs successful ($successful_jobs/$total_jobs)"
                else
                    info "No completed backup jobs found yet"
                fi
            else
                info "No backup jobs found (CronJob may not have run yet)"
            fi
        else
            warning "PostgreSQL backup CronJob not configured"
        fi

        # Check persistent volumes
        info "Checking K3s PostgreSQL persistent volumes..."
        local pv_output
        if pv_output=$(kubectl get pvc -n postgres-cluster --no-headers 2>/dev/null); then
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
    fi

    # Test 7: Application Services
    echo -e "${CYAN}[7/10]${NC} Testing application services..."
    header "🚀 Application Services"

    # Test key application endpoints
    local services=(
        "8080:HAProxy Web Frontend"
        "8404:HAProxy Stats"
        "5432:HAProxy PostgreSQL LB"
        "6443:HAProxy K3s API LB"
    )

    for service in "${services[@]}"; do
        local port=$(echo "$service" | cut -d: -f1)
        local name=$(echo "$service" | cut -d: -f2)

        if timeout 3 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1; then
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

        if kubectl get service $svc_name -n $namespace >/dev/null 2>&1; then
            # Check if pods are running
            local running_pods=$(kubectl get pods -n $namespace -l app=$svc_name --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
            if [ "$running_pods" -gt 0 ]; then
                success "$display_name is running in K3s ($running_pods pods)"
            else
                warning "$display_name service exists but no running pods"
            fi
        else
            warning "$display_name service not found in K3s"
        fi
    done

    # Test 8: MinIO Storage
    echo -e "${CYAN}[8/10]${NC} Testing MinIO storage..."
    header "🗄️  MinIO Distributed Storage"

    # Check MinIO pods in K3s
    info "Checking MinIO cluster status..."
    local minio_pods
    if minio_pods=$(kubectl get pods -n storage -l app=minio --no-headers 2>/dev/null); then
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

        if kubectl get service $svc_name -n storage >/dev/null 2>&1; then
            success "$display_name service is available"
        else
            error "$display_name service not found"
        fi
    done

    # Test MinIO API health endpoint
    info "Testing MinIO API health..."
    if kubectl exec -n storage minio-0 -- curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
        success "MinIO API health endpoint is responding"
    else
        warning "MinIO API health endpoint is not responding"
    fi

    # Check MinIO buckets
    info "Checking MinIO buckets..."
    local bucket_output
    if bucket_output=$(kubectl exec -n storage minio-0 -- mc ls minio/ 2>/dev/null); then
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
    if storage_info=$(kubectl exec -n storage minio-0 -- mc admin info minio 2>/dev/null); then
        if echo "$storage_info" | grep -q -E "(Online|Used|Available|Drives)"; then
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
    if ingress_output=$(kubectl get ingress -n storage --no-headers 2>/dev/null); then
        local ingress_count=$(echo "$ingress_output" | wc -l)
        if [ "$ingress_count" -ge 2 ]; then
            success "MinIO ingress is configured ($ingress_count ingress rules)"
        else
            warning "MinIO ingress may be incomplete ($ingress_count ingress rules)"
        fi
    else
        warning "Failed to get MinIO ingress status"
    fi

    # Test 9: Backup System
    echo -e "${CYAN}[9/10]${NC} Testing backup system..."
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

            info "Analyzing $total_reports recent backup reports..."

            for report in $recent_reports; do
                if [ -f "$report" ]; then
                    local status=$(grep '"status"' "$report" | cut -d'"' -f4 2>/dev/null || echo "UNKNOWN")
                    if [ "$status" = "SUCCESS" ]; then
                        ((successful_backups++))
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

    # Test 10: Security Compliance
    echo -e "${CYAN}[10/10]${NC} Testing security compliance..."
    header "🔒 Security Compliance"

    # Run local security validation (only if application source code exists)
    if [ -f "scripts/validate-security.js" ] && [ -d "app" ] && [ -d "lib" ]; then
        info "Running security validation..."
        if security_output=$(node scripts/validate-security.js 2>&1); then
            # Parse the actual output format
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
        elif grep -q "your_dev_" ".env.local" && grep -q "development_password" ".env.local"; then
            success "Local .env.local file contains safe template values"
        else
            warning "Local .env.local file contains real secrets (consider server-centralized management)"
        fi
    else
        success "No local .env.local file (using server-centralized management)"
    fi

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

    # Health status
    if [ $health_percentage -ge 90 ]; then
        log_message "🎉 EXCELLENT HEALTH - Production Ready!"
    elif [ $health_percentage -ge 75 ]; then
        log_message "⚠️  GOOD HEALTH - Minor issues to address"
    elif [ $health_percentage -ge 50 ]; then
        log_message "⚠️  FAIR HEALTH - Several issues need attention"
    else
        log_message "🚨 POOR HEALTH - Critical issues require immediate attention"
    fi

    # List critical issues
    if [ ${#ISSUES[@]} -gt 0 ]; then
        log_message ""
        log_message "🚨 Critical Issues:"
        for issue in "${ISSUES[@]}"; do
            log_message "  • $issue"
        done
    fi

    # List warnings
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        log_message ""
        log_message "⚠️  Warnings:"
        for warning in "${WARNINGS[@]}"; do
            log_message "  • $warning"
        done
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
    # Capture all output and extract report path
    HEALTH_OUTPUT=$(run_health_checks "$SERVER_REPORT_DIR" 2>&1)
    echo "$HEALTH_OUTPUT"
    FINAL_REPORT_PATH=$(echo "$HEALTH_OUTPUT" | grep "REPORT_PATH:" | cut -d: -f2 | tr -d ' \r\n')
    echo -e "\n${BOLD}📄 Full report saved to: $FINAL_REPORT_PATH${NC}"

else
    # --- MODE 2: ORCHESTRATOR (Running on local dev machine) ---
    echo "Running health check remotely on $HETZNER_HOST..."
    echo "Copying script to server and executing with real-time output..."

    # Copy this script to the server
    scp "$0" root@"$HETZNER_HOST":/tmp/health-check-remote.sh >/dev/null 2>&1

    # Execute the script on the server with real-time output streaming
    echo -e "${CYAN}🔄 Starting remote health check with live output...${NC}\n"

    # Create a temporary file to capture the report path
    TEMP_OUTPUT_FILE="/tmp/health_check_output_$$"

    # Use SSH with real-time output streaming and capture to temp file
    ssh -t root@"$HETZNER_HOST" "cd /opt/crm && bash /tmp/health-check-remote.sh 2>&1" | tee "$TEMP_OUTPUT_FILE"

    # Parse the output to get the report path
    REMOTE_REPORT_PATH=$(grep "REPORT_PATH:" "$TEMP_OUTPUT_FILE" | cut -d: -f2 | tr -d ' \r\n')

    # Clean up temp file
    rm -f "$TEMP_OUTPUT_FILE"

    if [[ -z "$REMOTE_REPORT_PATH" ]]; then
        echo -e "\n⚠️ Could not determine remote report path."
        exit 1
    fi

    echo -e "\n${CYAN}📥 Downloading health report to local machine...${NC}"

    # Ensure local directory exists
    mkdir -p "$LOCAL_REPORT_DIR"
    report_filename=$(basename "$REMOTE_REPORT_PATH")
    local_report_path="$LOCAL_REPORT_DIR/$report_filename"

    # Use scp to download the file
    if scp -o ConnectTimeout=15 root@"$HETZNER_HOST":"$REMOTE_REPORT_PATH" "$local_report_path" >/dev/null 2>&1; then
        echo -e "✅ Health report downloaded to: $local_report_path"
        ls -lh "$local_report_path"
    else
        echo -e "⚠️ Failed to download health report."
    fi

    # Clean up temporary file on server
    ssh root@"$HETZNER_HOST" "rm -f /tmp/health-check-remote.sh" >/dev/null 2>&1
fi
