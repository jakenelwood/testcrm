# 🧪 Authentication Testing Guide

## Overview

This guide provides comprehensive testing procedures for the multi-tenant insurance CRM authentication system, including email/password auth, OAuth providers, role-based access control, and organization management.

## 🚀 Quick Test Setup

### Prerequisites
1. **Local Supabase instance running**:
   ```bash
   npx supabase start
   ```

2. **Environment variables configured**:
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Database migrations applied**:
   ```bash
   npx supabase db reset
   ```

4. **Development server running**:
   ```bash
   npm run dev
   ```

## 📧 Email/Password Authentication Tests

### Test 1: User Registration (Disabled)
**Expected**: Registration should be disabled for security

1. Navigate to `/auth/signup`
2. Try to create an account
3. **Expected Result**: Registration form should be disabled or redirect to login

### Test 2: Email Confirmation Flow
**Setup**: Enable signup temporarily for testing

1. Create test user via Supabase dashboard
2. Check email confirmation is required
3. Verify custom email template is used
4. **Expected Result**: User receives branded confirmation email

### Test 3: Password Reset Flow
1. Navigate to `/auth/reset-password`
2. Enter valid email address
3. Check email for reset link
4. Follow reset link and set new password
5. **Expected Result**: 
   - Custom email template used
   - Password validation enforced
   - Successful password reset

### Test 4: Password Strength Validation
Test these password scenarios:
- ❌ `weak` (too short)
- ❌ `password123` (common password)
- ❌ `PASSWORD123` (no lowercase)
- ❌ `password` (no numbers/symbols)
- ✅ `SecurePass123!` (meets all requirements)

## 🔗 OAuth Provider Tests

### Test 5: Google OAuth
**Prerequisites**: Google OAuth configured in Supabase

1. Navigate to `/auth/login`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. **Expected Result**: 
   - Redirected to Google
   - User created in Supabase
   - Redirected back to app

### Test 6: Microsoft/Azure OAuth
**Prerequisites**: Azure OAuth configured in Supabase

1. Navigate to `/auth/login`
2. Click "Sign in with Microsoft"
3. Complete Microsoft OAuth flow
4. **Expected Result**: 
   - Redirected to Microsoft
   - User created in Supabase
   - Redirected back to app

## 👥 Role-Based Access Control Tests

### Test 7: Default Role Assignment
1. Create new user
2. Check user role in database
3. **Expected Result**: User assigned 'user' role by default

### Test 8: Permission Checking
Test permission functions:
```sql
-- Test user permissions
SELECT public.user_has_permission(
  'user-uuid', 
  'org-uuid', 
  'leads.view'
);

-- Test role retrieval
SELECT public.get_user_organization_role(
  'user-uuid', 
  'org-uuid'
);
```

### Test 9: Route Protection
Test protected routes with different roles:

1. **User Role**: Access `/dashboard/leads`
   - **Expected**: Can view own leads only

2. **Agent Role**: Access `/dashboard/clients`
   - **Expected**: Can view and edit assigned clients

3. **Manager Role**: Access `/dashboard/reports`
   - **Expected**: Can view team reports

4. **Admin Role**: Access `/dashboard/users`
   - **Expected**: Can manage organization users

## 🏢 Multi-Tenant Organization Tests

### Test 10: Organization Creation
1. Create new organization via API or dashboard
2. Check default roles are created
3. **Expected Result**: 
   - Organization created successfully
   - Default roles (Owner, Admin, Manager, Agent, User) created
   - Creator assigned as Owner

### Test 11: User Invitation Flow
1. **Admin invites user**:
   ```typescript
   await inviteUserToOrganization({
     organizationId: 'org-uuid',
     email: 'test@example.com',
     role: 'agent',
     invitedBy: 'admin-uuid'
   });
   ```

2. **Check invitation created**:
   - Invitation record in database
   - Email sent (check logs)
   - Invitation token generated

3. **Accept invitation**:
   - Navigate to invitation URL
   - Complete signup/login
   - **Expected**: User added to organization with correct role

### Test 12: Data Isolation
1. Create two organizations with test data
2. Login as user from Organization A
3. Try to access Organization B's data
4. **Expected Result**: Access denied, data properly isolated

## 🔒 Security Tests

### Test 13: Rate Limiting
1. **Login attempts**: Try 15 failed logins in 1 hour
   - **Expected**: Rate limited after 10 attempts

2. **Password reset**: Request 10 password resets in 1 hour
   - **Expected**: Rate limited after 5 requests

### Test 14: Session Management
1. Login from multiple devices
2. Check active sessions in database
3. Revoke session from one device
4. **Expected**: Session invalidated, user logged out

### Test 15: Audit Logging
1. Perform various actions (login, create lead, update client)
2. Check audit logs:
   ```sql
   SELECT * FROM public.audit_logs 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC;
   ```
3. **Expected**: All actions logged with proper context

## 🛠️ API Endpoint Tests

### Test 16: Protected API Routes
Test API authentication:

```bash
# Without authentication (should fail)
curl -X GET http://localhost:3000/api/leads

# With valid JWT (should succeed)
curl -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer <jwt-token>"
```

### Test 17: Permission-Based API Access
Test different permission levels:

```bash
# User trying to access admin endpoint (should fail)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <user-jwt>"

# Admin accessing same endpoint (should succeed)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin-jwt>"
```

## 🧪 Automated Test Suite

### Test 18: Run Jest Tests
```bash
npm run test:auth
```

### Test 19: Run E2E Tests
```bash
npm run test:e2e:auth
```

## 📊 Test Results Checklist

### Email/Password Authentication
- [ ] Registration properly disabled
- [ ] Email confirmation working
- [ ] Password reset functional
- [ ] Password validation enforced
- [ ] Custom email templates used

### OAuth Providers
- [ ] Google OAuth working
- [ ] Microsoft OAuth working
- [ ] User creation on OAuth login
- [ ] Proper redirect handling

### Role-Based Access Control
- [ ] Default roles assigned
- [ ] Permission checking functional
- [ ] Route protection working
- [ ] API endpoint protection working

### Multi-Tenant Features
- [ ] Organization creation working
- [ ] User invitations functional
- [ ] Data isolation enforced
- [ ] Cross-tenant access blocked

### Security Features
- [ ] Rate limiting active
- [ ] Session management working
- [ ] Audit logging comprehensive
- [ ] Password policies enforced

## 🚨 Common Issues & Solutions

### Issue 1: OAuth Redirect Mismatch
**Symptoms**: OAuth fails with redirect URI error
**Solution**: 
1. Check OAuth provider settings
2. Verify Supabase redirect URIs
3. Ensure URLs match exactly

### Issue 2: Permission Denied Errors
**Symptoms**: Users can't access expected resources
**Solution**:
1. Check RLS policies
2. Verify role assignments
3. Test permission functions

### Issue 3: Email Not Sending
**Symptoms**: Confirmation/reset emails not received
**Solution**:
1. Check SMTP configuration
2. Verify email templates
3. Check spam folder

### Issue 4: Session Issues
**Symptoms**: Users logged out unexpectedly
**Solution**:
1. Check JWT expiration settings
2. Verify cookie configuration
3. Check session cleanup functions

## 📝 Test Documentation

### Recording Test Results
Document test results in this format:

```markdown
## Test Run: [Date]
**Environment**: Development/Staging/Production
**Tester**: [Name]

### Results Summary
- ✅ Email/Password Auth: 4/4 tests passed
- ✅ OAuth Providers: 2/2 tests passed
- ✅ RBAC: 3/3 tests passed
- ✅ Multi-Tenant: 3/3 tests passed
- ✅ Security: 3/3 tests passed

### Issues Found
- None

### Recommendations
- All authentication features working as expected
- Ready for production deployment
```

## 🔄 Continuous Testing

### Automated Testing Schedule
- **Daily**: Basic auth flow tests
- **Weekly**: Full security audit
- **Monthly**: Penetration testing
- **Quarterly**: Compliance review

### Monitoring & Alerts
Set up monitoring for:
- Failed login attempts
- Permission errors
- Session anomalies
- Audit log gaps
