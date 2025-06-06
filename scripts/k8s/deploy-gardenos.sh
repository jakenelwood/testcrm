#!/bin/bash

# 🚀 GardenOS Complete Deployment Script
# Deploys all core services to the K3s cluster
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
K8S_DIR="$PROJECT_ROOT/k8s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  deploy-all            Deploy all GardenOS services"
    echo "  deploy-ingress        Deploy ingress controller only"
    echo "  deploy-supabase       Deploy Supabase stack only"
    echo "  deploy-fastapi        Deploy FastAPI services only"
    echo "  deploy-monitoring     Deploy Prometheus + Grafana monitoring"
    echo "  status                Check deployment status"
    echo "  logs SERVICE          Show logs for a service"
    echo "  restart SERVICE       Restart a service"
    echo "  scale SERVICE REPLICAS Scale a service"
    echo
    echo "Options:"
    echo "  --dry-run             Show what would be deployed without applying"
    echo "  --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 deploy-all"
    echo "  $0 status"
    echo "  $0 logs gotrue"
    echo "  $0 scale postgrest 3"
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
    
    # Check if nodes are ready
    local ready_nodes
    ready_nodes=$(kubectl get nodes --no-headers | grep -c "Ready" || echo "0")
    if [[ "$ready_nodes" -lt 3 ]]; then
        error "Expected 3 ready nodes, found $ready_nodes"
    fi
    
    log "Prerequisites check passed"
}

# Deploy ingress controller
deploy_ingress() {
    log "Deploying NGINX Ingress Controller..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply: $K8S_DIR/ingress/nginx-ingress.yaml"
        return
    fi
    
    kubectl apply -f "$K8S_DIR/ingress/nginx-ingress.yaml"
    
    # Wait for ingress controller to be ready
    log "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    log "Ingress controller deployed successfully"
}

# Deploy Supabase stack
deploy_supabase() {
    log "Deploying Supabase stack..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply Supabase manifests from: $K8S_DIR/supabase/"
        return
    fi
    
    # Apply namespace and config first
    kubectl apply -f "$K8S_DIR/supabase/namespace.yaml"
    
    # Wait a moment for namespace to be ready
    sleep 2
    
    # Apply services
    kubectl apply -f "$K8S_DIR/supabase/gotrue.yaml"
    kubectl apply -f "$K8S_DIR/supabase/postgrest.yaml"
    kubectl apply -f "$K8S_DIR/supabase/storage.yaml"
    
    # Wait for deployments to be ready
    log "Waiting for Supabase services to be ready..."
    kubectl wait --namespace supabase \
        --for=condition=available deployment \
        --all \
        --timeout=300s
    
    log "Supabase stack deployed successfully"
}

# Deploy FastAPI services
deploy_fastapi() {
    log "Deploying FastAPI services..."

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply FastAPI manifests from: $K8S_DIR/fastapi/"
        return
    fi

    # Apply namespace and config first
    kubectl apply -f "$K8S_DIR/fastapi/namespace.yaml"

    # Wait a moment for namespace to be ready
    sleep 2

    # Apply services
    kubectl apply -f "$K8S_DIR/fastapi/api-deployment.yaml"

    # Wait for deployments to be ready (with longer timeout for image pulls)
    log "Waiting for FastAPI services to be ready (this may take a while for first-time image pulls)..."
    kubectl wait --namespace fastapi \
        --for=condition=available deployment \
        --all \
        --timeout=600s

    log "FastAPI services deployed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying Prometheus + Grafana monitoring stack..."

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply monitoring manifests from: $K8S_DIR/monitoring/"
        return
    fi

    # Apply namespace first
    kubectl apply -f "$K8S_DIR/monitoring/namespace.yaml"

    # Wait a moment for namespace to be ready
    sleep 2

    # Apply monitoring services
    kubectl apply -f "$K8S_DIR/monitoring/prometheus.yaml"
    kubectl apply -f "$K8S_DIR/monitoring/grafana.yaml"

    # Wait for deployments to be ready
    log "Waiting for monitoring services to be ready..."
    kubectl wait --namespace monitoring \
        --for=condition=available deployment \
        --all \
        --timeout=300s

    log "Monitoring stack deployed successfully"
}

# Deploy ingress routes
deploy_routes() {
    log "Deploying ingress routes..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        echo "Would apply: $K8S_DIR/ingress/routes.yaml"
        return
    fi
    
    kubectl apply -f "$K8S_DIR/ingress/routes.yaml"
    
    log "Ingress routes deployed successfully"
}

# Deploy all services
deploy_all() {
    log "Starting complete GardenOS deployment..."

    check_prerequisites
    deploy_ingress
    deploy_supabase
    deploy_monitoring
    deploy_fastapi
    deploy_routes

    log "Complete GardenOS deployment finished!"
    show_status
}

# Show deployment status
show_status() {
    log "GardenOS Deployment Status"
    echo
    
    echo -e "${BLUE}=== Cluster Nodes ===${NC}"
    kubectl get nodes -o wide
    echo
    
    echo -e "${BLUE}=== Ingress Controller ===${NC}"
    kubectl get pods -n ingress-nginx
    echo
    
    echo -e "${BLUE}=== Supabase Services ===${NC}"
    kubectl get pods -n supabase
    echo
    
    echo -e "${BLUE}=== FastAPI Services ===${NC}"
    kubectl get pods -n fastapi
    echo

    echo -e "${BLUE}=== Monitoring Services ===${NC}"
    kubectl get pods -n monitoring
    echo

    echo -e "${BLUE}=== Ingress Routes ===${NC}"
    kubectl get ingress -A
    echo
    
    echo -e "${BLUE}=== Service URLs ===${NC}"
    echo "Add to /etc/hosts:"
    echo "$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}') api.gardenos.local monitoring.gardenos.local"
    echo
    echo "Access URLs:"
    echo "- Supabase Auth: http://api.gardenos.local/auth"
    echo "- Supabase REST: http://api.gardenos.local/rest"
    echo "- Supabase Storage: http://api.gardenos.local/storage"
    echo "- FastAPI: http://api.gardenos.local/api"
    echo "- AI Agents: http://api.gardenos.local/ai"
    echo "- Monitoring: http://monitoring.gardenos.local"
}

# Show logs for a service
show_logs() {
    local service="$1"
    local namespace=""
    
    # Determine namespace based on service
    case "$service" in
        gotrue|postgrest|storage-api)
            namespace="supabase"
            ;;
        fastapi-api|fastapi-ai-agents)
            namespace="fastapi"
            ;;
        nginx-ingress|ingress-nginx)
            namespace="ingress-nginx"
            service="ingress-nginx-controller"
            ;;
        *)
            error "Unknown service: $service"
            ;;
    esac
    
    log "Showing logs for $service in namespace $namespace..."
    kubectl logs -n "$namespace" -l app="$service" --tail=100 -f
}

# Restart a service
restart_service() {
    local service="$1"
    local namespace=""
    
    # Determine namespace based on service
    case "$service" in
        gotrue|postgrest|storage-api)
            namespace="supabase"
            ;;
        fastapi-api|fastapi-ai-agents)
            namespace="fastapi"
            ;;
        *)
            error "Unknown service: $service"
            ;;
    esac
    
    log "Restarting $service in namespace $namespace..."
    kubectl rollout restart deployment "$service" -n "$namespace"
    kubectl rollout status deployment "$service" -n "$namespace"
}

# Scale a service
scale_service() {
    local service="$1"
    local replicas="$2"
    local namespace=""
    
    # Determine namespace based on service
    case "$service" in
        gotrue|postgrest|storage-api)
            namespace="supabase"
            ;;
        fastapi-api|fastapi-ai-agents)
            namespace="fastapi"
            ;;
        *)
            error "Unknown service: $service"
            ;;
    esac
    
    log "Scaling $service to $replicas replicas in namespace $namespace..."
    kubectl scale deployment "$service" --replicas="$replicas" -n "$namespace"
    kubectl rollout status deployment "$service" -n "$namespace"
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    DRY_RUN="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy-all|deploy-ingress|deploy-supabase|deploy-fastapi|deploy-monitoring|status)
                COMMAND="$1"
                shift
                ;;
            logs)
                COMMAND="logs"
                SERVICE="$2"
                shift 2
                ;;
            restart)
                COMMAND="restart"
                SERVICE="$2"
                shift 2
                ;;
            scale)
                COMMAND="scale"
                SERVICE="$2"
                REPLICAS="$3"
                shift 3
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
    log "GardenOS Deployment Manager"
    
    parse_args "$@"
    
    case "$COMMAND" in
        deploy-all)
            deploy_all
            ;;
        deploy-ingress)
            check_prerequisites
            deploy_ingress
            ;;
        deploy-supabase)
            check_prerequisites
            deploy_supabase
            ;;
        deploy-fastapi)
            check_prerequisites
            deploy_fastapi
            ;;
        deploy-monitoring)
            check_prerequisites
            deploy_monitoring
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$SERVICE"
            ;;
        restart)
            restart_service "$SERVICE"
            ;;
        scale)
            scale_service "$SERVICE" "$REPLICAS"
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
}

# Run main function
main "$@"
