# 🔗 Frontend-Backend Connection Guide

## Overview

This guide covers connecting the Next.js frontend to the K3s backend services, including the AI orchestration layer, PostgreSQL cluster, and Supabase services.

## 🎯 **Connection Status: READY**

### ✅ **Backend Services Operational**
- **PostgreSQL Cluster**: 3-node HA cluster with Patroni
- **AI Orchestration**: Custom coroutine-based agents with DeepSeek-V3
- **FastAPI Services**: Main API and AI agents endpoints
- **Supabase Stack**: Auth, REST API, Storage services
- **Ingress Controller**: NGINX routing for external access

### ✅ **Frontend Configuration Updated**
- **API endpoints**: Updated to point to `api.gardenos.local`
- **Environment files**: Created `.env.k3s` for K3s deployment
- **Deployment targets**: Added `hetzner-k3s` configuration

## 🔧 **Connection Steps**

### **1. Environment Configuration**

#### **For Development (localhost:3000)**
```bash
# Copy K3s environment configuration
cp .env.k3s .env.local

# Update for local development
NEXT_PUBLIC_API_BASE_URL=http://api.gardenos.local
NEXT_PUBLIC_DEPLOYMENT_TARGET=hetzner-k3s
```

#### **For Vercel Production**
Update Vercel environment variables:
```bash
NEXT_PUBLIC_API_BASE_URL=http://api.gardenos.local
NEXT_PUBLIC_SUPABASE_URL=http://api.gardenos.local/supabase
NEXT_PUBLIC_DEPLOYMENT_TARGET=hetzner-k3s
```

### **2. DNS Configuration**

#### **Local Development Setup**
Add to `/etc/hosts` (or Windows equivalent):
```
5.161.110.205 api.gardenos.local
```

#### **Production Setup**
Configure DNS A record:
```
api.gardenos.local → 5.161.110.205
```

### **3. Test Connectivity**

#### **Basic API Test**
```bash
# Test main API
curl http://api.gardenos.local/

# Test AI orchestration
curl http://api.gardenos.local/ai/status

# Test health endpoints
curl http://api.gardenos.local/health
curl http://api.gardenos.local/ai/health
```

#### **Frontend Connection Test**
```javascript
// Test API connectivity from browser console
fetch('http://api.gardenos.local/')
  .then(response => response.json())
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('Connection Error:', error));
```

## 🚀 **Service Endpoints**

### **Main API Services**
```
Main API:           http://api.gardenos.local/
AI Orchestration:   http://api.gardenos.local/ai/
Health Check:       http://api.gardenos.local/health
Documentation:      http://api.gardenos.local/docs
```

### **AI Orchestration Endpoints**
```
System Status:      GET  /ai/status
Lead Analysis:      POST /ai/analyze-lead
Follow-up Gen:      POST /ai/generate-follow-up
Agent Scaling:      POST /ai/scale-agents
Health Check:       GET  /ai/health
Debug Queues:       GET  /ai/debug/queues
```

### **Supabase Services**
```
Auth (GoTrue):      http://api.gardenos.local/auth/
REST API:           http://api.gardenos.local/rest/
Storage:            http://api.gardenos.local/storage/
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. DNS Resolution**
```bash
# Test DNS resolution
nslookup api.gardenos.local

# Expected result: 5.161.110.205
```

#### **2. CORS Issues**
Check backend CORS configuration:
```yaml
# k8s/fastapi/namespace.yaml
BACKEND_CORS_ORIGINS: '["https://crm-jakenelwoods-projects.vercel.app", "http://localhost:3000", "http://api.gardenos.local"]'
```

#### **3. Service Discovery**
Verify K3s services are running:
```bash
# Check FastAPI services
kubectl get pods -n fastapi

# Check AI agents
kubectl get pods -n fastapi | grep ai-agents

# Check ingress
kubectl get ingress -A
```

#### **4. Database Connectivity**
Test PostgreSQL cluster:
```bash
# Test from within cluster
kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -c "SELECT 1;"

# Test external connectivity
psql -h 5.161.110.205 -U postgres -d postgres -c "SELECT 1;"
```

### **Debug Commands**

#### **Frontend Debug**
```javascript
// Check current configuration
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Deployment Target:', process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET);

// Test API endpoints
const testEndpoints = async () => {
  const endpoints = [
    '/api/health',
    '/ai/status',
    '/ai/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`);
      const data = await response.json();
      console.log(`${endpoint}:`, data);
    } catch (error) {
      console.error(`${endpoint} failed:`, error);
    }
  }
};
```

#### **Backend Debug**
```bash
# Check service logs
kubectl logs -n fastapi deployment/fastapi-api
kubectl logs -n fastapi deployment/ai-agents

# Check ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Test internal service connectivity
kubectl exec -n fastapi deployment/fastapi-api -- curl http://ai-agents:8001/health
```

## 📊 **Performance Optimization**

### **Connection Pooling**
```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Caching Strategy**
```typescript
// Implement SWR for API caching
import useSWR from 'swr';

const fetcher = (url: string) => 
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`).then(res => res.json());

export const useLeads = () => {
  const { data, error, mutate } = useSWR('/api/leads', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: false,
  });

  return {
    leads: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
};
```

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Update DNS**: Configure `api.gardenos.local` → `5.161.110.205`
2. **Test Connectivity**: Verify all endpoints respond correctly
3. **Deploy Frontend**: Update Vercel with new environment variables
4. **Validate Flow**: Test complete user journey from UI to AI

### **Monitoring Setup**
1. **Add Prometheus**: Monitor API response times and error rates
2. **Configure Grafana**: Dashboards for frontend-backend connectivity
3. **Set up Alerts**: Notify on connection failures or high latency

### **Security Enhancements**
1. **SSL/TLS**: Configure Let's Encrypt certificates
2. **API Authentication**: Implement proper JWT validation
3. **Rate Limiting**: Protect against abuse and DoS attacks

This connection architecture provides a robust foundation for the AI-native CRM platform with full observability and scalability.
