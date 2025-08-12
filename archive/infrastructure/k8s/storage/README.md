# 🗄️ MinIO Distributed Storage

MinIO provides S3-compatible object storage for your CRM application, deployed as a distributed cluster across your K3s nodes.

## 🏗️ Architecture

### **Distributed Setup:**
- **3-node MinIO cluster** (one pod per K3s node)
- **Erasure coding** for data protection
- **High availability** - survives single node failure
- **S3-compatible API** for application integration

### **Storage Layout:**
```
MinIO Cluster:
├── Node 1 (5.78.103.224): 20GB storage + metadata
├── Node 2 (5.161.110.205): 20GB storage + metadata
└── Node 3 (178.156.186.10): 20GB storage + metadata

Total: 60GB raw storage → ~40GB usable (with erasure coding)
```

## 📦 Components

### **StatefulSet:**
- **3 replicas** distributed across nodes
- **20GB PVC** per pod for data storage
- **Anti-affinity** rules ensure pod distribution

### **Services:**
- **minio-api**: S3 API endpoint (port 9000)
- **minio-console**: Web management interface (port 9001)
- **minio**: Headless service for StatefulSet

### **Ingress:**
- **minio-api.gardenos.local**: External S3 API access
- **minio-console.gardenos.local**: Web console access

## 🔑 Access Credentials

### **Admin Access:**
- **Username**: `minioadmin`
- **Password**: `minio123456789`
- **Console**: http://minio-console.gardenos.local

### **Application Access:**
- **Access Key**: `crm-access-key`
- **Secret Key**: `crm-secret-key-2024-secure`
- **Endpoint**: http://minio-api.storage.svc.cluster.local:9000

## 📁 Bucket Structure

### **Created Buckets:**
- **crm-documents**: General documents and files
- **crm-quotes**: Insurance quotes and PDFs
- **crm-attachments**: Email attachments
- **crm-backups**: System and database backups
- **crm-temp**: Temporary files and uploads

### **Bucket Policies:**
- **crm-documents**: Public read access
- **crm-quotes**: Private (authenticated access only)
- **crm-attachments**: Private (authenticated access only)
- **crm-backups**: Private (authenticated access only)
- **crm-temp**: Private (authenticated access only)

## 🚀 Deployment

### **Deploy MinIO:**
```bash
./scripts/deploy-minio.sh
```

### **Manual Deployment:**
```bash
# Deploy namespace and configuration
kubectl apply -f k8s/storage/namespace.yaml

# Deploy MinIO cluster
kubectl apply -f k8s/storage/minio-statefulset.yaml

# Create ingress
kubectl apply -f k8s/storage/minio-ingress.yaml

# Initialize buckets and policies
kubectl apply -f k8s/storage/minio-init-job.yaml
```

## 🔧 Integration

### **Supabase Storage:**
Supabase Storage API is configured to use MinIO as the backend:

```yaml
# In k8s/supabase/storage.yaml
STORAGE_BACKEND: s3
GLOBAL_S3_BUCKET: crm-documents
GLOBAL_S3_ENDPOINT: http://minio-api.storage.svc.cluster.local:9000
```

### **Application Code:**
```javascript
// Using AWS SDK with MinIO
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://minio-api.storage.svc.cluster.local:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'crm-access-key',
    secretAccessKey: 'crm-secret-key-2024-secure'
  },
  forcePathStyle: true
});
```

## 📊 Monitoring

### **Health Checks:**
- **Liveness**: `/minio/health/live` on port 9000
- **Readiness**: `/minio/health/ready` on port 9000

### **Metrics:**
MinIO exposes Prometheus metrics at `/minio/v2/metrics/cluster`

### **Status Commands:**
```bash
# Check pod status
kubectl get pods -n storage

# Check storage usage
kubectl exec -it minio-0 -n storage -- mc admin info minio

# List buckets
kubectl exec -it minio-0 -n storage -- mc ls minio/
```

## 🔒 Security

### **Network Policies:**
- Internal cluster communication only
- External access via Ingress only

### **Credentials Management:**
- Stored in Kubernetes secrets
- Separate admin and application credentials
- Regular credential rotation recommended

### **Bucket Policies:**
- Principle of least privilege
- Public access only where needed
- Private by default for sensitive data

## 🛠️ Maintenance

### **Scaling:**
```bash
# Scale to more replicas (must be multiple of 4 for erasure coding)
kubectl scale statefulset minio -n storage --replicas=4
```

### **Backup:**
```bash
# Backup MinIO configuration
kubectl exec -it minio-0 -n storage -- mc admin config export minio > minio-config-backup.json

# Backup data (use mc mirror)
kubectl exec -it minio-0 -n storage -- mc mirror minio/crm-backups /backup/location
```

### **Updates:**
```bash
# Update MinIO image
kubectl set image statefulset/minio minio=minio/minio:RELEASE.2024-07-01T00-00-00Z -n storage
```

## 🚨 Troubleshooting

### **Common Issues:**

#### **Pods Not Starting:**
```bash
# Check events
kubectl describe pod minio-0 -n storage

# Check logs
kubectl logs minio-0 -n storage
```

#### **Storage Issues:**
```bash
# Check PVC status
kubectl get pvc -n storage

# Check storage class
kubectl get storageclass
```

#### **Network Issues:**
```bash
# Test internal connectivity
kubectl exec -it minio-0 -n storage -- nc -zv minio-1.minio.storage.svc.cluster.local 9000

# Check ingress
kubectl get ingress -n storage
```

## 📈 Performance

### **Expected Performance:**
- **Throughput**: ~100MB/s per node
- **IOPS**: Limited by underlying storage
- **Latency**: <10ms for small objects

### **Optimization:**
- Use SSD storage for better performance
- Increase replica count for higher throughput
- Enable compression for text files

---

**Deployment Date**: $(date)
**MinIO Version**: RELEASE.2024-06-04T19-20-08Z
**Status**: ✅ Production Ready
