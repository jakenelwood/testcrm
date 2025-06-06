#!/bin/bash

# 🗄️ etcd Utilities Script
# Common etcd operations for GardenOS cluster management
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  health                Check etcd cluster health"
    echo "  members               List etcd cluster members"
    echo "  clear-patroni         Clear Patroni cluster state from etcd"
    echo "  list-keys [PREFIX]    List keys with optional prefix"
    echo "  backup                Create etcd backup"
    echo "  status                Show detailed etcd status"
    echo
    echo "Options:"
    echo "  --cluster NAME        Specify cluster name for operations (default: postgres-cluster)"
    echo "  --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 health"
    echo "  $0 clear-patroni --cluster postgres-cluster"
    echo "  $0 list-keys /service"
    echo
}

# Check etcd cluster health
check_health() {
    section "etcd Cluster Health Check"
    
    local healthy_count=0
    local total_count=${#ETCD_SERVERS[@]}
    
    for server in "${ETCD_SERVERS[@]}"; do
        echo -n "etcd $server:$ETCD_PORT: "
        if curl -s --connect-timeout 5 "http://$server:$ETCD_PORT/health" | grep -q '"health":"true"'; then
            echo -e "${GREEN}HEALTHY${NC}"
            ((healthy_count++))
        else
            echo -e "${RED}UNHEALTHY${NC}"
        fi
    done
    
    echo
    if [[ $healthy_count -eq $total_count ]]; then
        success "etcd cluster is fully healthy ($healthy_count/$total_count nodes)"
    elif [[ $healthy_count -ge 2 ]]; then
        warn "etcd cluster has quorum but some nodes are unhealthy ($healthy_count/$total_count nodes)"
    else
        error "etcd cluster has lost quorum ($healthy_count/$total_count nodes healthy)"
    fi
}

# List etcd cluster members
list_members() {
    section "etcd Cluster Members"

    info "Querying cluster members using v3 API from ${ETCD_SERVERS[0]}:$ETCD_PORT..."

    local result
    result=$(curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/cluster/member/list" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)

    if echo "$result" | jq -e '.members' >/dev/null 2>&1; then
        echo "$result" | jq '.members[] | {name: .name, clientURLs: .clientURLs, peerURLs: .peerURLs}'
        echo
        local member_count
        member_count=$(echo "$result" | jq '.members | length')
        success "Found $member_count etcd cluster members"
    else
        warn "Failed to get cluster members via v3 API"
        info "Raw response: $result"

        # Fallback: try v2 API for older clusters
        info "Trying v2 API as fallback..."
        curl -s "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v2/members" | jq '.' 2>/dev/null || warn "v2 API also unavailable (this is normal for modern etcd)"
    fi
}

# Clear Patroni cluster state from etcd
clear_patroni_state() {
    local cluster_name="${1:-postgres-cluster}"
    
    section "Clearing Patroni State for Cluster: $cluster_name"
    
    warn "This will delete all Patroni cluster state from etcd!"
    warn "Cluster: $cluster_name"
    echo
    warn "Are you sure you want to continue? (y/N)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        log "Operation cancelled"
        return
    fi
    
    # Encode the key for etcd v3 API (base64 encoding of /service/cluster-name)
    local key_prefix="/service/$cluster_name"
    local encoded_key
    encoded_key=$(echo -n "$key_prefix" | base64 -w 0)
    local encoded_range_end
    encoded_range_end=$(echo -n "${key_prefix}0" | base64 -w 0)
    
    info "Deleting keys with prefix: $key_prefix"
    info "Encoded key: $encoded_key"
    info "Encoded range end: $encoded_range_end"
    
    local result
    result=$(curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/kv/deleterange" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$encoded_key\",\"range_end\":\"$encoded_range_end\"}" 2>/dev/null)
    
    if echo "$result" | jq -e '.deleted' >/dev/null 2>&1; then
        local deleted_count
        deleted_count=$(echo "$result" | jq -r '.deleted')
        success "Successfully deleted $deleted_count keys for cluster $cluster_name"
        log "Patroni cluster state cleared. You can now restart PostgreSQL pods for clean initialization."
    else
        error "Failed to delete cluster state. Response: $result"
    fi
}

# List keys with optional prefix
list_keys() {
    local prefix="${1:-}"
    
    section "etcd Keys"
    
    if [[ -n "$prefix" ]]; then
        info "Listing keys with prefix: $prefix"
        local encoded_prefix
        encoded_prefix=$(echo -n "$prefix" | base64 -w 0)
        local encoded_range_end
        encoded_range_end=$(echo -n "${prefix}0" | base64 -w 0)
        
        curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/kv/range" \
            -H "Content-Type: application/json" \
            -d "{\"key\":\"$encoded_prefix\",\"range_end\":\"$encoded_range_end\"}" 2>/dev/null | jq '.'
    else
        info "Listing all keys (this may be large)..."
        curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/kv/range" \
            -H "Content-Type: application/json" \
            -d '{"key":"AA==","range_end":""}' 2>/dev/null | jq '.'
    fi
}

# Create etcd backup
create_backup() {
    section "etcd Backup"
    
    local backup_dir="$PROJECT_ROOT/backups/etcd-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    info "Creating etcd backup in: $backup_dir"
    
    # Create a simple key dump
    curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/kv/range" \
        -H "Content-Type: application/json" \
        -d '{"key":"AA==","range_end":""}' > "$backup_dir/etcd-keys.json" 2>/dev/null
    
    # Save cluster member information (v3 API)
    curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/cluster/member/list" \
        -H "Content-Type: application/json" \
        -d '{}' > "$backup_dir/etcd-members.json" 2>/dev/null
    
    success "Backup created: $backup_dir"
    log "Files created:"
    log "  - etcd-keys.json (all key-value pairs)"
    log "  - etcd-members.json (cluster member info)"
}

# Show detailed etcd status
show_status() {
    section "etcd Detailed Status"
    
    check_health
    echo
    list_members
    echo
    
    info "etcd version and status from ${ETCD_SERVERS[0]}:"
    curl -s "http://${ETCD_SERVERS[0]}:$ETCD_PORT/version" | jq '.' 2>/dev/null || warn "Failed to get version"
    echo
    
    info "etcd metrics (sample):"
    curl -s "http://${ETCD_SERVERS[0]}:$ETCD_PORT/metrics" | head -10 2>/dev/null || warn "Failed to get metrics"
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    CLUSTER_NAME="postgres-cluster"
    PREFIX=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            health|members|clear-patroni|backup|status)
                COMMAND="$1"
                shift
                ;;
            list-keys)
                COMMAND="list-keys"
                PREFIX="${2:-}"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^-- ]]; then
                    shift
                fi
                ;;
            --cluster)
                CLUSTER_NAME="$2"
                shift 2
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
    print_header "etcd Utilities" "Common etcd operations for GardenOS cluster management"
    
    parse_args "$@"
    
    case "$COMMAND" in
        health)
            check_health
            ;;
        members)
            list_members
            ;;
        clear-patroni)
            clear_patroni_state "$CLUSTER_NAME"
            ;;
        list-keys)
            list_keys "$PREFIX"
            ;;
        backup)
            create_backup
            ;;
        status)
            show_status
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
    
    print_footer "etcd Utilities"
}

# Run main function
main "$@"
