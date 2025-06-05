#!/bin/bash

# 🐘 PostgreSQL K3s Deployment Script
# Deploys PostgreSQL cluster natively in K3s with Patroni
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  deploy                Deploy PostgreSQL cluster"
    echo "  status                Check PostgreSQL cluster status"
    echo "  backup-docker         Backup data from Docker containers"
    echo "  migrate-data          Migrate data from Docker to K3s"
    echo "  cleanup               Remove PostgreSQL cluster"
    echo "  logs POD_NAME         Show logs for specific pod"
    echo
    echo "Options:"
    echo "  --dry-run             Show what would be deployed without applying"
    echo "  --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 backup-docker"
    echo "  $0 logs postgres-0"
    echo
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found. Please install kubectl."
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    fi

    # Check etcd cluster
    check_etcd_health

    # Check storage class availability
    if ! kubectl get storageclass local-path &> /dev/null; then
        warn "local-path storage class not found. Installing local-path-provisioner..."
        install_local_path_provisioner
    fi

    log "Prerequisites check passed"
}

# Install local-path-provisioner for dynamic storage
install_local_path_provisioner() {
    log "Installing local-path-provisioner..."

    # Install the local-path-provisioner
    kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml

    # Wait for the provisioner to be ready
    log "Waiting for local-path-provisioner to be ready..."
    kubectl wait --namespace local-path-storage \
        --for=condition=ready pod \
        --selector=app=local-path-provisioner \
        --timeout=120s

    # Set local-path as default storage class
    kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

    log "local-path-provisioner installed and configured as default storage class"
}

# Backup Docker PostgreSQL data
backup_docker_data() {
    log "Backing up Docker PostgreSQL data..."
    
    local backup_dir="$PROJECT_ROOT/backups/postgres-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Check if Docker containers are running
    if ! ssh_exec "$PRIMARY_SERVER" "docker ps | grep gardenos-postgres" &>/dev/null; then
        warn "Docker PostgreSQL containers not found or not running"
        return
    fi

    # Create database dump
    log "Creating database dump..."
    ssh_exec "$PRIMARY_SERVER" "docker exec gardenos-postgres-1-dev pg_dumpall -U postgres" > "$backup_dir/full-dump.sql"

    # Create individual database dumps
    log "Creating individual database dumps..."
    local databases
    databases=$(ssh_exec "$PRIMARY_SERVER" "docker exec gardenos-postgres-1-dev psql -U postgres -t -c \"SELECT datname FROM pg_database WHERE datistemplate = false;\"" | grep -v "^$" | tr -d ' ')

    for db in $databases; do
        if [[ "$db" != "postgres" ]]; then
            log "Backing up database: $db"
            ssh_exec "$PRIMARY_SERVER" "docker exec gardenos-postgres-1-dev pg_dump -U postgres $db" > "$backup_dir/$db.sql"
        fi
    done
    
    log "Backup completed: $backup_dir"
    echo "Backup location: $backup_dir"
}

# Deploy PostgreSQL cluster
deploy_postgres() {
    log "Deploying PostgreSQL cluster to K3s..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply PostgreSQL manifests from: $K8S_DIR/postgres/"
        return
    fi
    
    # Apply namespace and configuration
    kubectl apply -f "$K8S_DIR/postgres/namespace.yaml"
    
    # Wait for namespace to be ready
    sleep 2
    
    # Apply StatefulSet
    kubectl apply -f "$K8S_DIR/postgres/statefulset.yaml"
    
    # Wait for pods to be ready
    wait_for_pods "$POSTGRES_NAMESPACE" "app=postgres" "$POSTGRES_TIMEOUT"
    
    log "PostgreSQL cluster deployed successfully"
}

# Check PostgreSQL cluster status
check_status() {
    log "PostgreSQL Cluster Status"
    echo
    
    echo -e "${BLUE}=== Namespace ===${NC}"
    kubectl get namespace postgres-cluster
    echo
    
    echo -e "${BLUE}=== Pods ===${NC}"
    kubectl get pods -n postgres-cluster -o wide
    echo
    
    echo -e "${BLUE}=== Services ===${NC}"
    kubectl get svc -n postgres-cluster
    echo
    
    echo -e "${BLUE}=== Persistent Volumes ===${NC}"
    kubectl get pv | grep postgres || echo "No PostgreSQL PVs found"
    echo
    
    echo -e "${BLUE}=== Persistent Volume Claims ===${NC}"
    kubectl get pvc -n postgres-cluster
    echo
    
    # Check Patroni cluster status
    echo -e "${BLUE}=== Patroni Cluster Status ===${NC}"
    if kubectl get pods -n postgres-cluster | grep -q "postgres-0.*Running"; then
        kubectl exec -n postgres-cluster postgres-0 -- patronictl list || echo "Patroni not ready yet"
    else
        echo "postgres-0 pod not ready"
    fi
    echo
    
    # Check database connectivity
    echo -e "${BLUE}=== Database Connectivity ===${NC}"
    if kubectl get pods -n postgres-cluster | grep -q "postgres-0.*Running"; then
        kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -c "SELECT version();" || echo "Database not ready yet"
    else
        echo "postgres-0 pod not ready"
    fi
}

# Migrate data from Docker to K3s
migrate_data() {
    log "Migrating data from Docker PostgreSQL to K3s..."
    
    # Check if backup exists
    local latest_backup
    latest_backup=$(find "$PROJECT_ROOT/backups" -name "postgres-*" -type d | sort | tail -1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found. Please run 'backup-docker' first."
    fi
    
    log "Using backup: $latest_backup"
    
    # Wait for PostgreSQL to be ready
    kubectl wait --namespace postgres-cluster \
        --for=condition=ready pod \
        postgres-0 \
        --timeout=300s
    
    # Restore data
    log "Restoring database dump..."
    kubectl exec -i -n postgres-cluster postgres-0 -- psql -U postgres < "$latest_backup/full-dump.sql"
    
    log "Data migration completed"
}

# Show logs for a specific pod
show_logs() {
    local pod_name="$1"
    
    log "Showing logs for $pod_name..."
    kubectl logs -n postgres-cluster "$pod_name" -f
}

# Cleanup PostgreSQL cluster
cleanup_postgres() {
    log "Cleaning up PostgreSQL cluster..."
    
    warn "This will delete all PostgreSQL data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        log "Cleanup cancelled"
        return
    fi
    
    # Delete StatefulSet
    kubectl delete -f "$K8S_DIR/postgres/statefulset.yaml" || true
    
    # Delete PVCs
    kubectl delete pvc -n postgres-cluster --all || true
    
    # Delete namespace
    kubectl delete namespace postgres-cluster || true
    
    log "PostgreSQL cluster cleanup completed"
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    DRY_RUN="false"
    POD_NAME=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|status|backup-docker|migrate-data|cleanup)
                COMMAND="$1"
                shift
                ;;
            logs)
                COMMAND="logs"
                POD_NAME="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    if [[ -z "$COMMAND" ]]; then
        usage
        exit 1
    fi
}

# Main execution
main() {
    log "PostgreSQL K3s Deployment Manager"
    
    parse_args "$@"
    
    case "$COMMAND" in
        deploy)
            check_prerequisites
            deploy_postgres
            check_status
            ;;
        status)
            check_status
            ;;
        backup-docker)
            backup_docker_data
            ;;
        migrate-data)
            check_prerequisites
            migrate_data
            ;;
        cleanup)
            cleanup_postgres
            ;;
        logs)
            show_logs "$POD_NAME"
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
}

# Run main function
main "$@"
