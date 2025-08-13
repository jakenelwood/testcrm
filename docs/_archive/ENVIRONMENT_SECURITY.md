# Environment Variables Security Guide

## 🔒 Security Best Practices

### 1. Environment File Management

**DO:**
- ✅ Use `.env.local` for local development
- ✅ Use `.env.production` for production (but don't commit it)
- ✅ Copy from `.env.example` and fill in real values
- ✅ Use different secrets for each environment
- ✅ Generate strong secrets: `openssl rand -base64 32`
- ✅ Set production variables in your deployment platform (Vercel, etc.)

**DON'T:**
- ❌ Never commit `.env.local` or `.env.production` to version control
- ❌ Never expose service role keys in client-side code
- ❌ Never use the same secrets across environments
- ❌ Never hardcode secrets in your source code

### 2. Secret Generation

Generate secure secrets for production:

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64

# Generate API keys (if needed)
openssl rand -hex 32
```

### 3. Environment-Specific Configuration

#### Development (.env.local)
- Use sandbox/test APIs (RingCentral devtest)
- Use localhost URLs
- Enable debug logging
- Use development database

#### Production (.env.production)
- Use production APIs (RingCentral platform)
- Use production domain URLs
- Disable debug logging
- Use production database

### 4. Supabase Security

#### Public Keys (Safe for Client-Side)
- `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous access key

#### Private Keys (Server-Side Only)
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, never expose!
- `SUPABASE_JWT_SECRET` - For token verification

#### Row Level Security (RLS)
Ensure RLS is enabled on all tables:
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Users can only see their own data" ON your_table
FOR ALL USING (auth.uid() = user_id);
```

### 5. Deployment Security

#### Vercel Environment Variables
Set these in your Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate environment scope:
   - Development: For preview deployments
   - Preview: For branch deployments  
   - Production: For main branch only

#### Critical Variables for Production
```bash
NEXTAUTH_SECRET=your_production_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RINGCENTRAL_CLIENT_SECRET=your_production_secret
```

### 6. Monitoring & Alerts

#### Environment Variable Validation
Add runtime checks in your application:

```typescript
// lib/config/env-validation.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

#### Security Headers
Ensure proper security headers in production:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### 7. Secret Rotation

#### Regular Rotation Schedule
- NextAuth secrets: Every 90 days
- API keys: Every 180 days
- Database passwords: Every 365 days

#### Emergency Rotation
If a secret is compromised:
1. Generate new secret immediately
2. Update in deployment platform
3. Deploy new version
4. Revoke old secret
5. Monitor for unauthorized access

### 8. Troubleshooting

#### Common Issues
1. **"Invalid JWT"** - Check SUPABASE_JWT_SECRET matches your project
2. **"Unauthorized"** - Verify service role key is correct
3. **"CORS Error"** - Check CORS_ORIGINS includes your domain
4. **"Auth Error"** - Verify NEXTAUTH_URL matches your deployment URL

#### Debug Commands
```bash
# Check Supabase connection
supabase projects list

# Verify environment variables (without exposing values)
node -e "console.log(Object.keys(process.env).filter(k => k.includes('SUPABASE')))"

# Test API endpoints
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/your_table"
```

## 🚨 Emergency Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Rotate all secrets
   - Check access logs
   - Disable compromised accounts

2. **Investigation:**
   - Review recent deployments
   - Check for unauthorized API calls
   - Audit user access patterns

3. **Recovery:**
   - Deploy with new secrets
   - Notify affected users
   - Document incident for future prevention

## 📞 Support

- Supabase: [Dashboard](https://supabase.com/dashboard)
- Vercel: [Dashboard](https://vercel.com/dashboard)
- RingCentral: [Developer Console](https://developers.ringcentral.com/)
