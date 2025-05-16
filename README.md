# Gonzigo CRM

## Project Structure

This project has a specific directory structure that's important to understand:

### Directory Structure

- `/frontend-next-files/` - **Primary Source Directory**
  - This is where the Next.js application is running from
  - All development should happen in this directory
  - The npm scripts are configured to run from this directory

- `/app/` - **Legacy Directory**
  - This directory contains older versions of some files
  - These files are not used by the running application
  - This directory should be considered deprecated

### Development Workflow

When running the application with `npm run dev`, the script changes to the `frontend-next-files` directory before starting Next.js:

```
"dev": "cd frontend-next-files && next dev"
```

This means that only the files in the `frontend-next-files` directory are being used by the application.

### Important Note

To avoid confusion and maintain DRY (Don't Repeat Yourself) principles:

1. Always make changes in the `frontend-next-files` directory
2. Do not duplicate code between the two directories
3. Consider removing or archiving the files in the `/app` directory that are duplicated in `frontend-next-files`

## RingCentral Integration

The RingCentral integration uses OAuth 2.0 for authentication. The key files are:

- `/frontend-next-files/app/api/ringcentral/auth/route.ts` - Handles authentication, token management, and API calls
- `/frontend-next-files/app/api/ringcentral/auth/exchange-code/route.ts` - Exchanges the authorization code for tokens
- `/frontend-next-files/app/oauth-callback/page.tsx` - Handles the OAuth callback from RingCentral
- `/frontend-next-files/app/test/ringcentral/page.tsx` - Test page for RingCentral integration

### RingCentral Scopes

The RingCentral API requires specific scopes to be requested during authentication. The correct format for these scopes is:

```
SMS ReadCallLog ReadMessages ReadPresence RingOut
```

## Environment Variables

The application requires several environment variables to be set in `.env.local`:

```
# RingCentral API credentials
RINGCENTRAL_CLIENT_ID=your_client_id
RINGCENTRAL_CLIENT_SECRET=your_client_secret
RINGCENTRAL_SERVER=https://platform.ringcentral.com
RINGCENTRAL_USERNAME=your_username
RINGCENTRAL_EXTENSION=your_extension
RINGCENTRAL_PASSWORD=your_password
NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER=your_phone_number

# Next.js public URL for OAuth redirect
NEXT_PUBLIC_APP_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3000/oauth-callback
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Start the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser
