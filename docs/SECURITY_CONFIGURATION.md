# 🔒 Security Configuration Guide

## Overview

This guide covers the comprehensive security configuration for the Insurance CRM, including password policies, audit logging, session management, and security best practices.

## 🛡️ Password Security

### Password Requirements
- **Minimum length**: 8 characters
- **Maximum length**: 128 characters
- **Required complexity**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- **Common password prevention**: Blocks common passwords like "password123"
- **Password history**: Prevents reuse of last 5 passwords

### Password Validation
The system includes server-side password validation:
```sql
SELECT public.validate_password_strength('YourPassword123!');
```

### Password Reset Security
- Reset links expire after 1 hour
- One-time use tokens
- Email confirmation required
- Rate limited to 5 requests per hour

## 📊 Audit Logging

### Audit Events Tracked
- **Authentication**: Login, logout, failed attempts
- **Data Changes**: Create, update, delete operations
- **Permission Changes**: Role assignments, permission modifications
- **Security Events**: Session revocations, suspicious activity
- **Administrative Actions**: User invitations, organization changes

### Audit Log Structure
```sql
-- Example audit log entry
{
  "event_type": "update",
  "table_name": "leads",
  "record_id": "uuid",
  "user_id": "uuid",
  "organization_id": "uuid",
  "old_values": {...},
  "new_values": {...},
  "changes": {...},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "metadata": {...}
}
```

### Viewing Audit Logs
- **Users**: Can view their own actions
- **Managers**: Can view team actions
- **Admins**: Can view organization-wide logs
- **System Admins**: Can view all audit logs

## 🔐 Session Management

### Session Security Features
- **JWT tokens**: 24-hour expiration
- **Refresh token rotation**: Automatic token refresh
- **Session tracking**: Active session monitoring
- **Device fingerprinting**: Track login devices
- **Geographic tracking**: Monitor login locations
- **Concurrent session limits**: Configurable per user

### Session Cleanup
Automated cleanup of:
- Expired sessions (after 24 hours)
- Inactive sessions (after 7 days)
- Revoked sessions

### Emergency Session Revocation
Admins can revoke all sessions for a user:
```sql
SELECT public.revoke_user_sessions('user-uuid');
```

## 🚨 Rate Limiting

### Authentication Rate Limits
- **Login attempts**: 10 per hour per IP
- **Password reset**: 5 per hour per email
- **Email confirmation**: 5 per hour per email
- **API requests**: Varies by endpoint

### Rate Limit Configuration
Rate limits are configured in `middleware.ts`:
```typescript
const RATE_LIMITS = {
  '/api/auth/login': { maxRequests: 10, windowMinutes: 60 },
  '/api/auth/reset': { maxRequests: 5, windowMinutes: 60 },
  // ... other endpoints
};
```

## 🔍 Security Monitoring

### Suspicious Activity Detection
- Multiple failed login attempts
- Login from new devices/locations
- Unusual API usage patterns
- Permission escalation attempts
- Data export activities

### Security Alerts
Automated alerts for:
- Failed login attempts (>5 in 10 minutes)
- New device logins
- Admin permission changes
- Bulk data operations
- System configuration changes

## 🛠️ Security Headers

### HTTP Security Headers
```typescript
// In middleware.ts
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
```

### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

## 🔐 Data Encryption

### Encryption at Rest
- **Database**: AES-256 encryption (Supabase managed)
- **File storage**: Encrypted buckets
- **Backups**: Encrypted snapshots
- **Logs**: Encrypted audit trails

### Encryption in Transit
- **HTTPS**: TLS 1.3 for all connections
- **API calls**: Encrypted communication
- **Database connections**: SSL/TLS required
- **File uploads**: Encrypted transfer

## 🏢 Multi-Tenant Security

### Data Isolation
- **Row Level Security (RLS)**: Enforced at database level
- **Organization boundaries**: Strict data separation
- **User permissions**: Role-based access control
- **API isolation**: Organization-scoped endpoints

### Cross-Tenant Protection
- **UUID validation**: Prevent ID enumeration
- **Permission checks**: Multi-layer authorization
- **Audit trails**: Cross-tenant access logging
- **Data leakage prevention**: Automated checks

## 🚀 Production Security Checklist

### Environment Security
- [ ] Strong secrets generated (32+ characters)
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys restricted by IP/domain
- [ ] SSL certificates configured
- [ ] Security headers implemented

### Application Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload restrictions
- [ ] Error message sanitization

### Monitoring & Alerting
- [ ] Security monitoring enabled
- [ ] Audit logging configured
- [ ] Alert thresholds set
- [ ] Incident response plan
- [ ] Backup verification
- [ ] Recovery procedures tested

## 🆘 Incident Response

### Security Incident Procedures
1. **Immediate Response**:
   - Revoke compromised sessions
   - Change affected passwords
   - Block suspicious IPs
   - Notify security team

2. **Investigation**:
   - Review audit logs
   - Analyze attack vectors
   - Assess data exposure
   - Document findings

3. **Recovery**:
   - Patch vulnerabilities
   - Restore from backups if needed
   - Update security policies
   - Communicate with stakeholders

### Emergency Contacts
- **Security Team**: security@company.com
- **System Admin**: admin@company.com
- **Legal/Compliance**: legal@company.com

## 📋 Compliance

### Data Protection
- **GDPR**: EU data protection compliance
- **CCPA**: California privacy compliance
- **HIPAA**: Healthcare data protection (if applicable)
- **SOC 2**: Security controls framework

### Insurance Industry Requirements
- **Data retention**: Configurable retention policies
- **Audit trails**: Comprehensive logging
- **Access controls**: Role-based permissions
- **Encryption**: End-to-end data protection

## 🔧 Security Maintenance

### Regular Tasks
- **Weekly**: Review security logs
- **Monthly**: Update dependencies
- **Quarterly**: Security assessment
- **Annually**: Penetration testing

### Automated Tasks
- Session cleanup (daily)
- Log rotation (weekly)
- Security scans (daily)
- Backup verification (daily)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Insurance Data Security Standards](https://www.naic.org/cipr_topics/topic_cybersecurity.htm)
