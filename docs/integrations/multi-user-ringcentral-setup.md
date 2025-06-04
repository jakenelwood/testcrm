# 🏢 Multi-User RingCentral Setup Options

## Current Architecture (Recommended)

### **Shared App, Individual Accounts** ✅
**How it works**: One RingCentral app registration, multiple user accounts

```
CRM App Registration (Shared)
├── User 1 → Personal RingCentral Account
├── User 2 → Personal RingCentral Account  
└── User 3 → Personal RingCentral Account
```

**Benefits**:
- ✅ Simple setup and maintenance
- ✅ Each user uses their own RingCentral account
- ✅ Individual phone numbers and permissions
- ✅ Separate token management per user
- ✅ Individual rate limiting
- ✅ Standard OAuth flow

**Setup**:
1. Admin creates one RingCentral app in developer portal
2. Each user authenticates with their own RingCentral login
3. Each user selects from their own phone numbers
4. Tokens stored separately per user

## Alternative: Individual App Credentials

### **Separate Apps per User** 🔧
**How it works**: Each user has their own RingCentral app registration

```
User 1 App Registration → User 1 RingCentral Account
User 2 App Registration → User 2 RingCentral Account
User 3 App Registration → User 3 RingCentral Account
```

**Benefits**:
- ✅ Complete isolation between users
- ✅ Individual app-level rate limits
- ✅ Custom scopes per user
- ✅ Independent app management

**Drawbacks**:
- ❌ Complex setup (each user needs developer account)
- ❌ More maintenance overhead
- ❌ Requires database schema changes
- ❌ More complex authentication flow

## Implementation for Individual Credentials

If you need separate app credentials per user, here's the approach:

### **Database Changes Required**
```sql
-- Add app credentials to user profile or separate table
ALTER TABLE users ADD COLUMN ringcentral_client_id TEXT;
ALTER TABLE users ADD COLUMN ringcentral_client_secret TEXT;

-- Or create separate table
CREATE TABLE user_ringcentral_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  app_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

### **Configuration Changes**
```typescript
// lib/ringcentral/user-config.ts
export async function getUserRingCentralConfig(userId: string) {
  // Get user-specific credentials from database
  const { data } = await supabase
    .from('user_ringcentral_apps')
    .select('client_id, client_secret')
    .eq('user_id', userId)
    .single();
    
  return {
    clientId: data?.client_id || process.env.RINGCENTRAL_CLIENT_ID,
    clientSecret: data?.client_secret || process.env.RINGCENTRAL_CLIENT_SECRET,
    server: process.env.RINGCENTRAL_SERVER
  };
}
```

### **Authentication Flow Changes**
```typescript
// Modified auth endpoint to use user-specific credentials
async function handleAuthorize(userId: string) {
  const config = await getUserRingCentralConfig(userId);
  
  const authUrl = `${config.server}/restapi/oauth/authorize?` +
    `client_id=${config.clientId}&` +
    `response_type=code&` +
    // ... rest of OAuth params
}
```

## Recommendation

**Use the current shared app approach** unless you have specific requirements for:
- Complete user isolation at the app level
- Different OAuth scopes per user
- Separate rate limiting pools per user
- Compliance requirements for credential separation

The current architecture provides excellent multi-user support while maintaining simplicity and ease of management.

## Current Multi-User Features

✅ **Individual Authentication**: Each user logs in with their own RingCentral account  
✅ **Personal Phone Numbers**: Users select from their own available numbers  
✅ **Separate Token Storage**: Each user's tokens are isolated in the database  
✅ **Individual Rate Limiting**: Per-user rate limiting and circuit breaker  
✅ **Personal Permissions**: Access limited to user's RingCentral account scope  
✅ **Independent Recovery**: Each user can reset their own tokens  

The system is already designed for multi-user scenarios with proper isolation and security!
