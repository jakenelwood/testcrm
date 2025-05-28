# Production Deployment Guide

This guide covers the steps needed to deploy the CRM system to production on Vercel.

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables for Vercel

Set these environment variables in your Vercel dashboard:

#### **RingCentral Configuration**
```bash
RINGCENTRAL_CLIENT_ID=your_production_client_id
RINGCENTRAL_CLIENT_SECRET=your_production_client_secret
RINGCENTRAL_SERVER=https://platform.ringcentral.com
RINGCENTRAL_OAUTH_SCOPES=ReadAccounts ReadCallLog RingOut SMS
```

#### **OAuth Configuration**
```bash
REDIRECT_URI=https://crm-jakenelwoods-projects.vercel.app/oauth-callback
NEXT_PUBLIC_APP_URL=https://crm-jakenelwoods-projects.vercel.app
```

#### **Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vpwvdfrxvvuxojejnegm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **Application Settings**
```bash
NODE_ENV=production
NEXT_PUBLIC_DISABLE_DEV_MODE_BANNER=true
```

### 2. RingCentral App Configuration

Update your RingCentral app settings:

1. **OAuth Redirect URI**: `https://crm-jakenelwoods-projects.vercel.app/oauth-callback`
2. **App Type**: Public
3. **Scopes**: ReadAccounts, ReadCallLog, RingOut, SMS

### 3. Deployment Steps

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "feat: update production configuration and remove hardcoded phone numbers"
   git push origin main
   ```

2. **Verify Vercel Environment Variables**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Ensure all required variables are set
   - Deploy from the dashboard or push will auto-deploy

3. **Test Production Deployment**:
   - Visit `https://crm-jakenelwoods-projects.vercel.app`
   - Test RingCentral authentication
   - Verify phone number selection works
   - Test making calls/sending SMS

## 🔧 Key Changes Made

### ✅ **Removed Hardcoded Phone Numbers**
- Eliminated `RINGCENTRAL_FROM_NUMBER=+15551234567` from all configurations
- System now uses user preferences for phone number selection

### ✅ **Updated Production URLs**
- Changed from `crm-sepia-alpha.vercel.app` to `crm-jakenelwoods-projects.vercel.app`
- Updated all documentation and configuration files

### ✅ **Cleaned Up Configuration**
- Removed explicit environment variable exposure from `next.config.js`
- Next.js automatically handles `NEXT_PUBLIC_*` variables

### ✅ **Multi-User Ready**
- No hardcoded personal information
- User-preference based phone number selection
- Clean, scalable architecture

## 🎯 Post-Deployment Verification

1. **Authentication Flow**:
   - [ ] RingCentral OAuth works
   - [ ] User can authenticate successfully
   - [ ] Tokens are stored and refreshed properly

2. **Phone Number Management**:
   - [ ] User can see their available RingCentral numbers
   - [ ] User can select a preferred number
   - [ ] System uses selected number for calls/SMS

3. **Core Functionality**:
   - [ ] Making phone calls works
   - [ ] Sending SMS works
   - [ ] Lead management works
   - [ ] Database operations work

## 🚨 Troubleshooting

### Common Issues:

1. **RingCentral Authentication Fails**:
   - Check REDIRECT_URI matches exactly in RingCentral app settings
   - Verify CLIENT_ID and CLIENT_SECRET are correct
   - Ensure app is set to "Public" not "Private"

2. **Environment Variables Not Loading**:
   - Verify variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding new variables

3. **Phone Number Issues**:
   - User should set preferred number in Settings → Integrations
   - No fallback phone number is configured (by design)
   - Check user has proper RingCentral permissions for their numbers

## 📝 Notes

- The system is now completely multi-user ready
- No personal phone numbers or credentials are hardcoded
- Users must configure their own phone preferences
- All OAuth redirects use the production URL automatically
