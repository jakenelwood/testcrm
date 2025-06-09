#!/bin/bash

# 🗄️ MinIO Deployment Script
# Deploys MinIO distributed storage cluster to K3s

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🗄️ MinIO Distributed Storage Deployment${NC}"
echo "========================================"
echo ""

# Load server configuration
if [ -f ".env-files/.env-management-config" ]; then
    source .env-files/.env-management-config
    # Expand tilde in SSH_KEY path
    SSH_KEY="${SSH_KEY/#\~/$HOME}"
    echo -e "${GREEN}✅ Loaded server configuration${NC}"
else
    echo -e "${RED}❌ Server configuration not found: .env-files/.env-management-config${NC}"
    exit 1
fi

# Function to run kubectl commands on the server
run_kubectl() {
    ssh -i "$SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "$@"
}

# Check if we can connect to the server and K3s cluster
echo -e "${BLUE}🔗 Checking server and K3s cluster connection...${NC}"
if ! run_kubectl "kubectl cluster-info" &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to K3s cluster via server${NC}"
    echo -e "${YELLOW}💡 Make sure K3s is running on the server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to K3s cluster via server${NC}"

# Show cluster nodes
echo -e "${CYAN}📋 Cluster nodes:${NC}"
run_kubectl "kubectl get nodes -o wide"

echo ""
echo -e "${BLUE}🚀 Deploying MinIO components...${NC}"

# First, upload the manifests to the server
echo -e "${CYAN}📤 Uploading MinIO manifests to server...${NC}"
scp -i "$SSH_KEY" -r k8s/storage/ "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:/tmp/"
echo -e "${GREEN}✅ Manifests uploaded${NC}"

# Deploy namespace and configuration
echo -e "${CYAN}📦 Creating storage namespace and configuration...${NC}"
run_kubectl "kubectl apply -f /tmp/storage/namespace.yaml"
echo -e "${GREEN}✅ Namespace and configuration created${NC}"

# Deploy MinIO StatefulSet
echo -e "${CYAN}🗄️ Deploying MinIO StatefulSet...${NC}"
run_kubectl "kubectl apply -f /tmp/storage/minio-statefulset.yaml"
echo -e "${GREEN}✅ MinIO StatefulSet deployed${NC}"

# Deploy Ingress
echo -e "${CYAN}🌐 Creating MinIO Ingress...${NC}"
run_kubectl "kubectl apply -f /tmp/storage/minio-ingress.yaml"
echo -e "${GREEN}✅ MinIO Ingress created${NC}"

# Wait for MinIO pods to be ready
echo -e "${BLUE}⏳ Waiting for MinIO pods to be ready...${NC}"
run_kubectl "kubectl wait --for=condition=ready pod -l app=minio -n storage --timeout=300s"

echo -e "${GREEN}✅ MinIO pods are ready${NC}"

# Show MinIO pod status
echo -e "${CYAN}📋 MinIO pod status:${NC}"
run_kubectl "kubectl get pods -n storage -l app=minio"

# Run initialization job
echo -e "${BLUE}🔧 Running MinIO initialization...${NC}"
run_kubectl "kubectl apply -f /tmp/storage/minio-init-job.yaml"

# Wait for initialization to complete
echo -e "${YELLOW}⏳ Waiting for MinIO initialization to complete...${NC}"
run_kubectl "kubectl wait --for=condition=complete job/minio-init -n storage --timeout=120s"

echo -e "${GREEN}✅ MinIO initialization complete${NC}"

# Show initialization logs
echo -e "${CYAN}📋 Initialization logs:${NC}"
run_kubectl "kubectl logs job/minio-init -n storage"

# Update Supabase storage to use MinIO
echo -e "${BLUE}🔄 Updating Supabase storage configuration...${NC}"
scp -i "$SSH_KEY" k8s/supabase/storage.yaml "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:/tmp/"
scp -i "$SSH_KEY" k8s/supabase/namespace.yaml "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:/tmp/"
run_kubectl "kubectl apply -f /tmp/storage.yaml"
run_kubectl "kubectl apply -f /tmp/namespace.yaml"

# Restart Supabase storage to pick up new configuration
echo -e "${CYAN}🔄 Restarting Supabase storage...${NC}"
run_kubectl "kubectl rollout restart deployment/storage-api -n supabase"

# Wait for Supabase storage to be ready
echo -e "${YELLOW}⏳ Waiting for Supabase storage to be ready...${NC}"
run_kubectl "kubectl wait --for=condition=available deployment/storage-api -n supabase --timeout=120s"

echo -e "${GREEN}✅ Supabase storage updated${NC}"

# Show services
echo ""
echo -e "${PURPLE}📋 MINIO DEPLOYMENT SUMMARY${NC}"
echo "============================"
echo ""

echo -e "${CYAN}🗄️ MinIO Services:${NC}"
run_kubectl "kubectl get svc -n storage"

echo ""
echo -e "${CYAN}📦 MinIO Pods:${NC}"
run_kubectl "kubectl get pods -n storage"

echo ""
echo -e "${CYAN}🌐 MinIO Ingress:${NC}"
run_kubectl "kubectl get ingress -n storage"

echo ""
echo -e "${CYAN}💾 MinIO Storage:${NC}"
run_kubectl "kubectl get pvc -n storage"

# Show access information
echo ""
echo -e "${BLUE}🔑 ACCESS INFORMATION${NC}"
echo "===================="
echo ""

# Get MinIO credentials
MINIO_ROOT_USER=$(run_kubectl "kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ROOT_USER}'" | base64 -d)
MINIO_ROOT_PASSWORD=$(run_kubectl "kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ROOT_PASSWORD}'" | base64 -d)
MINIO_ACCESS_KEY=$(run_kubectl "kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ACCESS_KEY}'" | base64 -d)

echo -e "${CYAN}🔐 MinIO Admin Console:${NC}"
echo "   URL: http://minio-console.gardenos.local"
echo "   Username: $MINIO_ROOT_USER"
echo "   Password: $MINIO_ROOT_PASSWORD"
echo ""

echo -e "${CYAN}🔌 MinIO API Endpoint:${NC}"
echo "   Internal: http://minio-api.storage.svc.cluster.local:9000"
echo "   External: http://minio-api.gardenos.local"
echo ""

echo -e "${CYAN}🔑 Application Credentials:${NC}"
echo "   Access Key: $MINIO_ACCESS_KEY"
echo "   Secret Key: [HIDDEN - check minio-secrets]"
echo ""

echo -e "${CYAN}📁 Created Buckets:${NC}"
echo "   • crm-documents    - General documents"
echo "   • crm-quotes       - Insurance quotes"
echo "   • crm-attachments  - Email attachments"
echo "   • crm-backups      - System backups"
echo "   • crm-temp         - Temporary files"

echo ""
echo -e "${GREEN}🎉 MinIO deployment complete!${NC}"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Add minio-api.gardenos.local and minio-console.gardenos.local to your /etc/hosts"
echo "2. Access MinIO console at http://minio-console.gardenos.local"
echo "3. Update your application to use MinIO S3 endpoints"
echo "4. Test file uploads through Supabase Storage API"

echo ""
echo -e "${CYAN}💡 To add to /etc/hosts:${NC}"
echo "sudo echo '5.78.31.2 minio-api.gardenos.local minio-console.gardenos.local' >> /etc/hosts"
