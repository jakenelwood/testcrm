# Security Fix Execution Guide

## Overview
This guide provides step-by-step instructions to fix all security issues identified in the Supabase security audit.

## Security Issues Summary

| Issue | Level | Status | Fix Method |
|-------|-------|--------|------------|
| Security Definer Views | ERROR | ✅ SQL Script | `comprehensive-security-fix.sql` |
| Function Search Path Mutable | WARN | ✅ SQL Script | `comprehensive-security-fix.sql` |
| Extension in Public Schema | WARN | ⚠️ Manual | `fix-vector-extension-schema.sql` |
| Auth OTP Long Expiry | WARN | ⚠️ Dashboard | `auth-security-configuration.md` |
| Leaked Password Protection | WARN | ⚠️ Dashboard | `auth-security-configuration.md` |

## Execution Order

### Phase 1: Database Security Fixes (Immediate)
Execute the main SQL security fixes that can be automated.

### Phase 2: Extension Schema Fix (Manual)
Move vector extension to proper schema (requires superuser or support).

### Phase 3: Auth Configuration (Dashboard)
Update authentication settings in Supabase dashboard.

### Phase 4: Verification
Confirm all issues are resolved.

## Phase 1: Database Security Fixes

### Step 1.1: Backup Current State
```bash
# Create a backup before making changes
pg_dump -h your-db-host -U postgres -d your-db > backup_before_security_fix.sql
```

### Step 1.2: Execute Main Security Fix
1. Open Supabase SQL Editor
2. Copy and paste the entire content of `scripts/comprehensive-security-fix.sql`
3. Execute the script
4. Review the output for any errors

**Expected Results:**
- ✅ Security definer views recreated without SECURITY DEFINER
- ✅ Function search paths secured for 30+ functions
- ✅ Verification queries show improvements

### Step 1.3: Verify Phase 1 Results
```sql
-- Check views are working
SELECT 'lead_conversion_summary' as view_name, COUNT(*) as record_count 
FROM public.lead_conversion_summary;

-- Check functions with mutable search_path (should be minimal)
SELECT COUNT(*) as remaining_mutable_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)));
```

## Phase 2: Extension Schema Fix

### Step 2.1: Check Current Extension Status
```sql
SELECT 
    e.extname as extension_name,
    n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';
```

### Step 2.2: Execute Extension Fix
1. Open Supabase SQL Editor
2. Copy and paste content from `scripts/fix-vector-extension-schema.sql`
3. Execute the script
4. If you get permission errors, contact Supabase support

### Step 2.3: Manual Superuser Command (If Needed)
If you have superuser access or Supabase support assistance:
```sql
ALTER EXTENSION vector SET SCHEMA extensions;
```

## Phase 3: Auth Configuration

### Step 3.1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**

### Step 3.2: Fix OTP Expiry
1. Find **Email** section
2. Set **OTP Expiry** to `1800` (30 minutes) or `3600` (1 hour)
3. Click **Save**

### Step 3.3: Enable Password Protection
1. Find **Password Security** section
2. Enable **"Check against HaveIBeenPwned"**
3. Click **Save**

### Step 3.4: Review Additional Settings
Follow the detailed guide in `scripts/auth-security-configuration.md`

## Phase 4: Verification

### Step 4.1: Run Security Audit Again
```bash
# If you have access to Supabase CLI
supabase db lint

# Or check manually in dashboard under Database → Advisors
```

### Step 4.2: Test Application Functionality
1. **Views**: Test lead conversion and client history reports
2. **Functions**: Test AI features, lead scoring, and automation
3. **Auth**: Test login, password reset, and user registration
4. **Vector**: Test any AI/ML features that use embeddings

### Step 4.3: Monitor for Issues
```sql
-- Check for any function errors
SELECT * FROM pg_stat_user_functions 
WHERE calls > 0 AND total_time > 0
ORDER BY total_time DESC;

-- Check view performance
EXPLAIN ANALYZE SELECT * FROM public.lead_conversion_summary LIMIT 10;
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Function Not Found Errors
```sql
-- Check if function exists with different signature
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc 
WHERE proname = 'your_function_name';
```

#### 2. View Permission Errors
```sql
-- Check RLS policies on underlying tables
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('leads', 'clients');
```

#### 3. Vector Extension Issues
```sql
-- Check if vector types are accessible
SELECT typname, nspname 
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE typname = 'vector';
```

#### 4. Auth Configuration Not Saving
- Clear browser cache and try again
- Check for browser console errors
- Verify you have admin permissions

## Rollback Plan

If any issues occur, you can rollback changes:

### Database Changes
```sql
-- Restore from backup
psql -h your-db-host -U postgres -d your-db < backup_before_security_fix.sql
```

### Auth Settings
- Revert OTP expiry to previous value
- Disable password protection if it causes issues

### Extension Schema
```sql
-- Move vector back to public if needed
ALTER EXTENSION vector SET SCHEMA public;
```

## Success Criteria

✅ **All security issues resolved:**
- [ ] No ERROR level security issues
- [ ] WARN level issues addressed or documented
- [ ] Application functionality verified
- [ ] Performance impact minimal
- [ ] Monitoring in place

✅ **Documentation updated:**
- [ ] Security fixes documented
- [ ] Team notified of changes
- [ ] Monitoring procedures updated
- [ ] Rollback procedures tested

## Next Steps

1. **Schedule regular security audits** (monthly)
2. **Implement automated security testing** in CI/CD
3. **Review and update security policies** quarterly
4. **Train team on security best practices**
5. **Monitor security advisories** from Supabase

## Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Security Best Practices**: https://supabase.com/docs/guides/platform/going-into-prod#security
- **Community Support**: https://github.com/supabase/supabase/discussions
- **Enterprise Support**: Contact your Supabase account manager

---

**⚠️ Important Notes:**
- Always test in development environment first
- Have a rollback plan ready
- Monitor application after changes
- Document any custom modifications needed
