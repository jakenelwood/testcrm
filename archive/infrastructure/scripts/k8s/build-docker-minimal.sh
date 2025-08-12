#!/bin/bash

# 🐳 Minimal Docker Image Build Script for GardenOS FastAPI Services
# Network-resilient build approach for DNS resolution issues
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-gardenos}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BUILD_CONTEXT="$PROJECT_ROOT/deployment"

# Main execution
main() {
    print_header "Minimal Docker Image Build" "Building FastAPI services with network-resilient approach"
    
    # Prerequisites
    check_docker
    check_build_context
    
    # Build images with minimal approach
    section "Building FastAPI API Image (Minimal)"
    build_fastapi_api_minimal
    
    section "Building AI Agents Image (Minimal)"
    build_ai_agents_minimal
    
    # Verify images
    section "Verifying Built Images"
    verify_images
    
    print_footer "Minimal Docker Image Build"
    success "All Docker images built successfully with minimal approach!"
}

# Check if Docker is available
check_docker() {
    log "Checking Docker availability..."
    
    if ! command_exists docker; then
        error "Docker not found. Please install Docker." exit
    fi
    
    if ! docker info &>/dev/null; then
        error "Cannot connect to Docker daemon. Please start Docker." exit
    fi
    
    success "Docker is available and running"
}

# Check build context
check_build_context() {
    log "Checking build context..."
    
    if [[ ! -d "$BUILD_CONTEXT" ]]; then
        error "Build context not found: $BUILD_CONTEXT" exit
    fi
    
    if [[ ! -f "$BUILD_CONTEXT/backend/main.py" ]]; then
        error "FastAPI backend source not found" exit
    fi
    
    if [[ ! -f "$BUILD_CONTEXT/ai-agents/main.py" ]]; then
        error "AI agents source not found" exit
    fi
    
    success "Build context verified"
}

# Build FastAPI API image with minimal approach
build_fastapi_api_minimal() {
    local image_name="$DOCKER_REGISTRY/fastapi-api:$IMAGE_TAG"
    
    log "Building FastAPI API image (minimal): $image_name"
    
    # Use minimal Dockerfile with network resilience
    docker build \
        --tag "$image_name" \
        --file "$BUILD_CONTEXT/backend/Dockerfile.minimal" \
        --network=host \
        "$BUILD_CONTEXT/backend" || {
        warn "Build failed, trying with original Dockerfile..."
        docker build \
            --tag "$image_name" \
            --file "$BUILD_CONTEXT/backend/Dockerfile" \
            --network=host \
            "$BUILD_CONTEXT/backend"
    }
    
    success "FastAPI API image built: $image_name"
}

# Build AI Agents image with minimal approach
build_ai_agents_minimal() {
    local image_name="$DOCKER_REGISTRY/ai-agents:$IMAGE_TAG"
    
    log "Building AI Agents image (minimal): $image_name"
    
    # Use minimal Dockerfile with network resilience
    docker build \
        --tag "$image_name" \
        --file "$BUILD_CONTEXT/ai-agents/Dockerfile.minimal" \
        --network=host \
        "$BUILD_CONTEXT/ai-agents" || {
        warn "Build failed, trying with original Dockerfile..."
        docker build \
            --tag "$image_name" \
            --file "$BUILD_CONTEXT/ai-agents/Dockerfile" \
            --network=host \
            "$BUILD_CONTEXT/ai-agents"
    }
    
    success "AI Agents image built: $image_name"
}

# Verify built images
verify_images() {
    log "Verifying built images..."
    
    local images=(
        "$DOCKER_REGISTRY/fastapi-api:$IMAGE_TAG"
        "$DOCKER_REGISTRY/ai-agents:$IMAGE_TAG"
    )
    
    for image in "${images[@]}"; do
        if docker image inspect "$image" &>/dev/null; then
            local size
            size=$(docker image inspect "$image" --format='{{.Size}}' | numfmt --to=iec)
            success "✅ $image (Size: $size)"
        else
            fail "❌ $image - Not found"
        fi
    done
    
    # Show all gardenos images
    echo
    info "All GardenOS images:"
    docker images "$DOCKER_REGISTRY/*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# Test network connectivity
test_network() {
    log "Testing network connectivity..."
    
    if ping -c 1 8.8.8.8 &>/dev/null; then
        success "Network connectivity: OK"
    else
        warn "Network connectivity: Issues detected"
    fi
    
    if nslookup pypi.org &>/dev/null; then
        success "DNS resolution: OK"
    else
        warn "DNS resolution: Issues detected"
    fi
}

# Handle command line arguments
case "${1:-build}" in
    "build")
        main
        ;;
    "test-network")
        test_network
        ;;
    "verify")
        verify_images
        ;;
    *)
        echo "Usage: $0 {build|test-network|verify}"
        echo "  build        - Build Docker images with minimal approach (default)"
        echo "  test-network - Test network connectivity"
        echo "  verify       - Verify built images"
        exit 1
        ;;
esac
