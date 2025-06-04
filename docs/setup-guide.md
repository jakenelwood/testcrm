# 🛠️ Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL access (provided via Hetzner)
- RingCentral developer account (optional)

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.local.template .env.local
```

Edit `.env.local` with your values:

```env
# Database (Hetzner PostgreSQL)
DATABASE_URL=postgresql://crm_user:dbD1HZ1DSuO9og0JgMNNwTEnEcQ9fv9khwLoUXYZEvE=@5.161.110.205:5432/crm

# Authentication (Supabase - can be migrated later)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# RingCentral Integration (Optional)
RINGCENTRAL_CLIENT_ID=your_client_id
RINGCENTRAL_CLIENT_SECRET=your_client_secret
RINGCENTRAL_SERVER=https://platform.ringcentral.com
RINGCENTRAL_FROM_NUMBER=your_phone_number

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3000/oauth-callback
```

### 3. Test Database Connection
```bash
node database/migrations/test_hetzner_connection.js
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## RingCentral Setup (Optional)

### 1. Create RingCentral App
1. Go to [RingCentral Developer Portal](https://developers.ringcentral.com/)
2. Create a new app with these settings:
   - **App Type**: Public
   - **Platform Type**: Server/Web
   - **OAuth Redirect URI**: `https://your-domain.com/oauth-callback`

### 2. Required Scopes
```
SMS ReadCallLog ReadMessages ReadPresence RingOut
```

### 3. Environment Variables
Add to `.env.local`:
```env
RINGCENTRAL_CLIENT_ID=your_client_id
RINGCENTRAL_CLIENT_SECRET=your_client_secret
RINGCENTRAL_FROM_NUMBER=your_phone_number
```

### 4. Test Integration
Visit `/dashboard/telephony` to test RingCentral integration.

## Authentication Setup

The application currently uses Supabase for authentication but can be migrated to any auth provider.

### Current Setup (Supabase)
1. Create a Supabase project
2. Add environment variables to `.env.local`
3. Configure authentication providers as needed

### Future Migration Options
- Auth0
- Firebase Auth
- NextAuth.js
- Custom authentication

## Production Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production
```env
DATABASE_URL=postgresql://crm_user:password@5.161.110.205:5432/crm
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
RINGCENTRAL_CLIENT_ID=your_production_client_id
RINGCENTRAL_CLIENT_SECRET=your_production_client_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
REDIRECT_URI=https://your-domain.com/oauth-callback
```

### Build Commands
```bash
# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Troubleshooting

### Database Connection Issues
1. Check if your IP is whitelisted on Hetzner
2. Verify DATABASE_URL format
3. Test connection: `node database/migrations/test_hetzner_connection.js`

### RingCentral Issues
1. Verify OAuth redirect URI matches exactly
2. Check scopes are correctly formatted
3. Ensure phone number format is correct (+1XXXXXXXXXX)

### Build Issues
1. Run `npm run lint` to check for errors
2. Verify all environment variables are set
3. Check TypeScript errors: `npx tsc --noEmit`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

## Support

- Database issues: Check `database/README.md`
- RingCentral issues: See RingCentral documentation
- General setup: Review this guide and environment template

The application is designed to be simple to set up while providing enterprise-level capabilities.
