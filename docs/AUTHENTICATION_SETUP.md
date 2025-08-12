# 🔐 Authentication Setup Guide

## Overview

This guide covers the complete authentication setup for the multi-tenant Insurance CRM, including email/password authentication, OAuth providers (Google, Microsoft/Azure), and role-based access control.

## 🚀 Quick Start

1. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase credentials** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

3. **Set up OAuth providers** (optional but recommended)

## 📧 Email/Password Authentication

### Features Configured
- ✅ Email confirmation required for new accounts
- ✅ Password reset functionality
- ✅ Custom branded email templates
- ✅ Strong password requirements (min 8 characters)
- ✅ Rate limiting (max 5 emails per hour)
- ✅ Controlled signup (admin invitations only)

### Email Templates
Custom templates are located in `supabase/templates/`:
- `confirmation.html` - Email confirmation
- `recovery.html` - Password reset
- `invite.html` - User invitations

### Configuration
Email authentication is configured in `supabase/config.toml`:
```toml
[auth.email]
enable_signup = false          # Controlled via invitations
enable_confirmations = true    # Email confirmation required
double_confirm_changes = true  # Confirm both old and new email
max_frequency = 5             # Max 5 emails per hour
```

## 🔗 OAuth Providers

### Google OAuth Setup

1. **Create Google OAuth App**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"

2. **Configure Redirect URIs**:
   ```
   Development: http://localhost:54321/auth/v1/callback
   Production: https://your-project.supabase.co/auth/v1/callback
   ```

3. **Add credentials to `.env.local`**:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
   ```

### Microsoft/Azure OAuth Setup

1. **Create Azure App Registration**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: "Insurance CRM"
   - Supported account types: Choose based on your needs
     - Single tenant: Your organization only
     - Multi-tenant: Any Azure AD directory

2. **Configure Redirect URIs**:
   - Platform: "Web"
   - Redirect URIs:
     ```
     Development: http://localhost:54321/auth/v1/callback
     Production: https://your-project.supabase.co/auth/v1/callback
     ```

3. **Create Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value (you won't see it again!)

4. **Add credentials to `.env.local`**:
   ```env
   AZURE_OAUTH_CLIENT_ID=your_azure_client_id
   AZURE_OAUTH_CLIENT_SECRET=your_azure_client_secret
   ```

## 👥 User Roles & Permissions

### Role Hierarchy
1. **Admin** - Full system access, can manage organizations
2. **Manager** - Organization-wide access, can manage users
3. **Agent** - Can manage assigned leads and clients
4. **User** - Basic access, view-only for most data

### Role Assignment
- New users are assigned the "user" role by default
- Admins can promote users through the dashboard
- Role changes are logged for audit purposes

## 🏢 Multi-Tenant Architecture

### Organization Management
- Each user belongs to one organization
- Data is isolated by organization
- Row Level Security (RLS) enforces access control
- Admins can invite users to their organization

### User Invitation Flow
1. Admin sends invitation via dashboard
2. Invited user receives branded email
3. User clicks invitation link
4. User sets password and confirms email
5. User gains access to organization data

## 🔒 Security Features

### Password Policies
- Minimum 8 characters
- Must include uppercase, lowercase, numbers
- No common passwords allowed
- Password history tracking (prevents reuse)

### Session Management
- JWT tokens expire after 24 hours
- Refresh token rotation enabled
- Automatic session refresh
- Secure cookie settings

### Rate Limiting
- Email sending: 5 per hour per user
- Login attempts: 10 per hour per IP
- API requests: Configured per endpoint

## 🛠️ Development Setup

### Local Development
1. Start Supabase locally:
   ```bash
   npx supabase start
   ```

2. Apply migrations:
   ```bash
   npx supabase db reset
   ```

3. Start Next.js development server:
   ```bash
   npm run dev
   ```

### Testing Authentication
1. **Email/Password**: Use the signup form with email confirmation
2. **Google OAuth**: Click "Sign in with Google" button
3. **Microsoft OAuth**: Click "Sign in with Microsoft" button

## 📝 Environment Variables Reference

### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# OAuth (Optional)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
AZURE_OAUTH_CLIENT_ID=
AZURE_OAUTH_CLIENT_SECRET=
```

## 🚨 Production Checklist

- [ ] Strong secrets generated for all environments
- [ ] OAuth redirect URIs updated for production domain
- [ ] Email templates tested and branded
- [ ] Rate limiting configured appropriately
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery procedures tested

## 🆘 Troubleshooting

### Common Issues

1. **OAuth redirect mismatch**:
   - Verify redirect URIs in OAuth provider settings
   - Check Supabase project URL is correct

2. **Email not sending**:
   - Check SMTP configuration in Supabase dashboard
   - Verify email templates are valid HTML

3. **Permission denied errors**:
   - Check RLS policies are correctly configured
   - Verify user roles are assigned properly

### Support
For additional help, check the Supabase documentation or contact the development team.
