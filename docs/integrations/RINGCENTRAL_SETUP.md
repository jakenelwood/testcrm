# 📞 RingCentral Setup

## Quick Setup

### 1. Create RingCentral App
1. Go to [RingCentral Developer Portal](https://developers.ringcentral.com/)
2. Create new app:
   - **App Type**: Public
   - **Platform Type**: Server/Web
   - **OAuth Redirect URI**:
     - Development: `http://localhost:3000/oauth-callback`
     - Production: `https://crm.twincitiescoverage.com/oauth-callback`
     - Alternative: `https://crm-jakenelwoods-projects.vercel.app/oauth-callback`
     - Alternative: `https://crm-sepia-alpha.vercel.app/oauth-callback`

### 2. Required Scopes
```
SMS ReadCallLog ReadMessages ReadPresence RingOut ReadAccounts
```
**Important**: Space-separated, no commas. Copy exactly as shown.

**Scope Descriptions** (from [official RingCentral documentation](https://developers.ringcentral.com/guide/basics/permissions)):
- `SMS`: Sending and receiving (SMS) text messages
- `ReadCallLog`: Viewing user call logs
- `ReadMessages`: Viewing user messages
- `ReadPresence`: Getting user presence information
- `RingOut`: Performing two-legged ring-out phone calls
- `ReadAccounts`: Viewing user account info (name, business name, address, phone number)

### 3. Environment Variables
Add to `.env.local`:
```env
# ✅ CONFIGURED: RingCentral Developer Portal credentials
RINGCENTRAL_CLIENT_ID=9NGTe08cOAJakQ7ZSuJh01
RINGCENTRAL_CLIENT_SECRET=06cWdA6QEdTdHOavJAKerW2JuXkF4fxnJemMnTsB1U5D

# ✅ CONFIGURED: Server URL (production)
RINGCENTRAL_SERVER_URL=https://platform.ringcentral.com

# OAuth Scopes (space-separated, no commas)
RINGCENTRAL_OAUTH_SCOPES=SMS ReadCallLog ReadMessages ReadPresence RingOut

# ⚠️ REQUIRED: Default phone number for outbound calls (E.164 format)
# Get this from your RingCentral account
RINGCENTRAL_FROM_NUMBER=+1234567890

# ✅ CONFIGURED: Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ✅ CONFIGURED: OAuth redirect URI
RINGCENTRAL_REDIRECT_URI=http://localhost:3000/oauth-callback
```

### 4. Test Integration
1. Start server: `npm run dev`
2. Go to `/dashboard/telephony`
3. Click "Connect RingCentral"
4. Complete OAuth flow

## Troubleshooting

### Common Issues & Solutions

#### **Caller ID Issues**
- **Symptom**: "Invalid Caller ID" error when making calls
- **Solution**: Setting the caller ID for RingOut calls
RingCentral allows users to select which number to use for their caller ID name (CNAM) value when making calls. However, this can only be done through the RingCentral administrative console, and cannot be set at runtime or programmatically. To set the CallerId for the RingOut API, set the "RingOut from Web" value as available in the Online Account Portal. 

#### **Token Revocation Errors**
- **Symptoms**: "Token is revoked" errors, authentication loops
- **Solution**: Use the reset utilities
  ```bash
  # Web interface
  Visit: /ringcentral-reset

  # Command line
  node scripts/reset-ringcentral-tokens.js
  ```

#### **Rate Limiting (429 Errors)**
- **Symptoms**: "Rate limit exceeded" errors
- **Solution**: The system now has enhanced rate limiting with exponential backoff
  - Automatic backoff from 30 seconds to 15 minutes
  - Circuit breaker after 5 consecutive failures
  - Use cleanup endpoint: `/api/ringcentral/auth?action=cleanup`

#### **Timeout Issues (504 Errors)**
- **Symptoms**: Call status checks timing out
- **Solution**: Now fixed with 25-second timeout protection
  - Automatic timeout detection and handling
  - Proper error messages for timeout scenarios

#### **Authentication Loops**
- **Symptoms**: Endless authentication retry loops
- **Solution**: Enhanced error handling with circuit breaker
  - Tracks consecutive failures
  - Prevents cascading failures
  - Automatic recovery on success

### Recovery Tools

#### **Web Interface**
Visit `/ringcentral-reset` for:
- Check authentication status
- Clean up expired tokens
- Reset all tokens
- Force re-authentication
- Full recovery workflow

#### **API Endpoints**
- `GET /api/ringcentral/auth?action=reset` - Force clear all tokens
- `GET /api/ringcentral/auth?action=cleanup` - Remove expired tokens
- `GET /api/ringcentral/auth?action=check` - Check auth status

#### **Emergency Script**
```bash
# Reset all tokens
node scripts/reset-ringcentral-tokens.js

# Specific actions
node scripts/reset-ringcentral-tokens.js reset
node scripts/reset-ringcentral-tokens.js cleanup
```

### Debug Mode
Add to `.env.local`:
```env
RINGCENTRAL_DEBUG=true
```

## Production Setup
1. Update OAuth redirect URI in RingCentral app
2. Set production environment variables in Vercel
3. Test OAuth flow in production
4. Monitor using the diagnostics endpoints

## Recent Improvements (v2.0)

✅ **Enhanced Rate Limiting**: Exponential backoff with circuit breaker
✅ **Token Recovery**: Automatic detection and recovery from revoked tokens
✅ **Timeout Protection**: 25-second timeout for call status checks
✅ **Error Classification**: Specific error types with recovery suggestions
✅ **Reset Utilities**: Web interface and CLI tools for token management
✅ **Multi-User Support**: User-specific rate limiting and token management

The integration now supports multi-user authentication, automatic error recovery, and comprehensive troubleshooting tools.