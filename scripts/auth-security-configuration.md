# Auth Security Configuration Guide

## Overview
This guide addresses the auth-related security warnings identified in the Supabase security audit.

## Issues to Fix

### 1. OTP Expiry Too Long (WARN)
**Current Issue**: OTP expiry is set to more than 1 hour
**Risk**: Extended OTP validity increases security risk
**Recommended**: Set to 1 hour or less

### 2. Leaked Password Protection Disabled (WARN)
**Current Issue**: Password breach protection is disabled
**Risk**: Users can use compromised passwords
**Recommended**: Enable HaveIBeenPwned integration

## Manual Configuration Steps

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**

### Step 2: Configure OTP Expiry
1. In the Authentication Settings, find **Email** section
2. Locate **OTP Expiry** setting
3. Set the value to **3600** seconds (1 hour) or less
4. Recommended value: **1800** seconds (30 minutes)
5. Click **Save**

### Step 3: Enable Leaked Password Protection
1. In Authentication Settings, find **Password Security** section
2. Enable **"Check against HaveIBeenPwned"**
3. This will prevent users from using known compromised passwords
4. Click **Save**

### Step 4: Additional Security Recommendations

#### Email Configuration
- Ensure **Email Confirmations** are enabled
- Set **Max Frequency** to reasonable limit (current: 5 emails/hour)
- Enable **Double Confirm Changes** for email updates

#### Session Security
- Review **JWT Expiry** (currently 24 hours for UX)
- Consider enabling **Refresh Token Rotation**
- Monitor **Session Timeout** settings

#### Password Policies
Consider implementing additional password requirements:
- Minimum length: 12 characters
- Require uppercase, lowercase, numbers, symbols
- Prevent password reuse (last 5 passwords)

## Verification Steps

### 1. Test OTP Functionality
```bash
# Test password reset flow
curl -X POST 'https://your-project.supabase.co/auth/v1/recover' \
  -H 'apikey: your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com"}'
```

### 2. Test Password Validation
```bash
# Test with known compromised password
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H 'apikey: your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 3. Monitor Auth Logs
- Check Authentication → Logs for any errors
- Verify OTP emails are being sent with correct expiry
- Confirm password validation is working

## Environment Variables Update

Update your production environment with secure auth settings:

```bash
# .env.production
SUPABASE_AUTH_OTP_EXPIRY=1800  # 30 minutes
SUPABASE_AUTH_PASSWORD_PROTECTION=true
SUPABASE_AUTH_EMAIL_CONFIRMATIONS=true
```

## Security Checklist

- [ ] OTP expiry set to 1 hour or less
- [ ] Leaked password protection enabled
- [ ] Email confirmations enabled
- [ ] Double confirm email changes enabled
- [ ] JWT expiry reviewed and appropriate
- [ ] Refresh token rotation enabled
- [ ] Password policies documented
- [ ] Auth logs monitored
- [ ] Production environment variables updated
- [ ] Security audit re-run to verify fixes

## Monitoring and Maintenance

### Regular Tasks
1. **Weekly**: Review auth logs for suspicious activity
2. **Monthly**: Check for new security recommendations
3. **Quarterly**: Review and update password policies
4. **Annually**: Audit all auth configurations

### Alerts to Set Up
- Failed login attempts (threshold: 5 in 5 minutes)
- Password reset requests (threshold: 10 in 1 hour)
- New user registrations (if unexpected)
- JWT token validation failures

## Troubleshooting

### Common Issues
1. **OTP not received**: Check email provider settings
2. **Password rejected**: Verify HaveIBeenPwned integration
3. **Session expired**: Review JWT expiry settings
4. **Email confirmation failed**: Check redirect URLs

### Support Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Password Security Guide](https://supabase.com/docs/guides/auth/password-security)

## Implementation Timeline

1. **Immediate** (< 1 hour): Apply OTP and password protection settings
2. **Short-term** (< 1 week): Implement monitoring and alerts
3. **Medium-term** (< 1 month): Review and enhance password policies
4. **Long-term** (ongoing): Regular security audits and updates
