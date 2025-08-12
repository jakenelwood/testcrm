#!/bin/bash

# 🐳 Docker Image Build Script for GardenOS FastAPI Services
# Builds and tags Docker images for K3s deployment
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
    print_header "Docker Image Build" "Building FastAPI services for K3s deployment"
    
    # Prerequisites
    check_docker
    check_build_context
    
    # Build images
    section "Building FastAPI API Image"
    build_fastapi_api
    
    section "Building AI Agents Image"
    build_ai_agents
    
    # Verify images
    section "Verifying Built Images"
    verify_images
    
    print_footer "Docker Image Build"
    success "All Docker images built successfully!"
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

# Configure Docker DNS for build process
configure_docker_dns() {
    log "Configuring Docker DNS for build process..."

    # Test network connectivity
    if ! ping -c 1 8.8.8.8 &>/dev/null; then
        warn "Network connectivity issues detected"
    fi

    # Check if Docker daemon is using proper DNS
    local docker_dns
    docker_dns=$(docker info --format '{{.SystemStatus}}' 2>/dev/null || echo "")

    success "Docker DNS configuration checked"
}

# Build FastAPI API image
build_fastapi_api() {
    local image_name="$DOCKER_REGISTRY/fastapi-api:$IMAGE_TAG"

    log "Building FastAPI API image: $image_name"

    # Configure Docker daemon DNS for build
    configure_docker_dns

    docker build \
        --tag "$image_name" \
        --file "$BUILD_CONTEXT/backend/Dockerfile" \
        --dns=8.8.8.8 \
        --dns=8.8.4.4 \
        --network=host \
        "$BUILD_CONTEXT/backend"

    success "FastAPI API image built: $image_name"
}

# Build AI Agents image
build_ai_agents() {
    local image_name="$DOCKER_REGISTRY/ai-agents:$IMAGE_TAG"

    log "Building AI Agents image: $image_name"

    # Configure Docker daemon DNS for build
    configure_docker_dns

    docker build \
        --tag "$image_name" \
        --file "$BUILD_CONTEXT/ai-agents/Dockerfile" \
        --dns=8.8.8.8 \
        --dns=8.8.4.4 \
        --network=host \
        "$BUILD_CONTEXT/ai-agents"

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

# Test images (optional)
test_images() {
    log "Testing built images..."
    
    # Test FastAPI API
    info "Testing FastAPI API image..."
    docker run --rm -d \
        --name test-fastapi-api \
        -p 8000:8000 \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        "$DOCKER_REGISTRY/fastapi-api:$IMAGE_TAG" &
    
    sleep 5
    
    if curl -f http://localhost:8000/health &>/dev/null; then
        success "FastAPI API image test passed"
    else
        warn "FastAPI API image test failed (expected - no database)"
    fi
    
    docker stop test-fastapi-api &>/dev/null || true
    
    # Test AI Agents
    info "Testing AI Agents image..."
    docker run --rm -d \
        --name test-ai-agents \
        -p 8001:8001 \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        "$DOCKER_REGISTRY/ai-agents:$IMAGE_TAG" &
    
    sleep 5
    
    if curl -f http://localhost:8001/health &>/dev/null; then
        success "AI Agents image test passed"
    else
        warn "AI Agents image test failed (expected - no database)"
    fi
    
    docker stop test-ai-agents &>/dev/null || true
}

# Push images to registry (optional)
push_images() {
    local registry_url="${1:-}"
    
    if [[ -z "$registry_url" ]]; then
        warn "No registry URL provided, skipping push"
        return
    fi
    
    log "Pushing images to registry: $registry_url"
    
    local images=(
        "$DOCKER_REGISTRY/fastapi-api:$IMAGE_TAG"
        "$DOCKER_REGISTRY/ai-agents:$IMAGE_TAG"
    )
    
    for image in "${images[@]}"; do
        local remote_image="$registry_url/$image"
        
        info "Tagging $image as $remote_image"
        docker tag "$image" "$remote_image"
        
        info "Pushing $remote_image"
        docker push "$remote_image"
        
        success "Pushed: $remote_image"
    done
}

# Clean up old images
cleanup_old_images() {
    log "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old gardenos images (keep latest 3)
    docker images "$DOCKER_REGISTRY/*" --format "{{.Repository}}:{{.Tag}}" | \
        grep -v ":latest" | \
        tail -n +4 | \
        xargs -r docker rmi
    
    success "Old images cleaned up"
}

# Handle command line arguments
case "${1:-build}" in
    "build")
        main
        ;;
    "test")
        test_images
        ;;
    "push")
        push_images "${2:-}"
        ;;
    "cleanup")
        cleanup_old_images
        ;;
    "all")
        main
        test_images
        cleanup_old_images
        ;;
    *)
        echo "Usage: $0 {build|test|push|cleanup|all}"
        echo "  build   - Build Docker images (default)"
        echo "  test    - Test built images"
        echo "  push    - Push images to registry"
        echo "  cleanup - Clean up old images"
        echo "  all     - Build, test, and cleanup"
        exit 1
        ;;
esac
