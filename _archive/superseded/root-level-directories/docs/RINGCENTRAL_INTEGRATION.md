# RingCentral Integration

This document provides information about the RingCentral integration in the Gonzigo CRM application.

## Overview

The RingCentral integration allows users to make phone calls and send SMS messages directly from the CRM application. It uses the RingCentral API to initiate calls and send messages.

## Setup

### 1. Create a RingCentral Developer Account

1. Go to [RingCentral Developer Portal](https://developers.ringcentral.com/) and sign up for an account
2. Create a new application with the following settings:
   - Application Type: Web Server (OAuth)
   - Platform Type: Server-only (No UI)
   - Permissions: RingOut, SMS, ReadAccounts, CallControl
   - Redirect URI: `http://localhost:3000/api/ringcentral/auth?action=callback` (for development)
   - Redirect URI: `https://yourdomain.com/api/ringcentral/auth?action=callback` (for production)

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```
# RingCentral API credentials
RINGCENTRAL_CLIENT_ID=your_client_id
RINGCENTRAL_CLIENT_SECRET=your_client_secret
RINGCENTRAL_SERVER=https://platform.ringcentral.com
NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER=+15551234567
REDIRECT_URI=http://localhost:3000/api/ringcentral/auth?action=callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create the Supabase Table

Run the migration script to create the `ringcentral_tokens` table in your Supabase database:

```bash
npx supabase migration up
```

## Usage

### Making Phone Calls

To add a phone call button to your application, import the `PhoneCall` component:

```tsx
import { PhoneCall } from '@/components/ui/PhoneCall';

export default function ContactDetails({ contact }) {
  return (
    <div>
      <h1>{contact.name}</h1>
      <p>Phone: {contact.phone}</p>
      <PhoneCall phoneNumber={contact.phone} />
    </div>
  );
}
```

### Sending SMS Messages

To add an SMS button to your application, import the `SendSMS` component:

```tsx
import { SendSMS } from '@/components/ui/SendSMS';

export default function ContactDetails({ contact }) {
  return (
    <div>
      <h1>{contact.name}</h1>
      <p>Phone: {contact.phone}</p>
      <SendSMS phoneNumber={contact.phone} />
    </div>
  );
}
```

## Authentication Flow

The RingCentral integration uses the OAuth 2.0 Authorization Code Flow for authentication:

1. User clicks on a phone call or SMS button
2. If the user is not authenticated with RingCentral, they are redirected to the RingCentral authorization page
3. User logs in to RingCentral and authorizes the application
4. RingCentral redirects back to the application with an authorization code
5. The application exchanges the authorization code for access and refresh tokens
6. The tokens are stored in the Supabase database
7. The application uses the access token to make API calls to RingCentral
8. When the access token expires, the application automatically refreshes it using the refresh token

## API Routes

The RingCentral integration includes the following API routes:

- `/api/ringcentral/auth?action=authorize`: Redirects the user to the RingCentral authorization page
- `/api/ringcentral/auth?action=callback`: Handles the callback from RingCentral after authorization
- `/api/ringcentral/auth?action=logout`: Logs the user out of RingCentral
- `/api/ringcentral?action=call`: Makes a phone call
- `/api/ringcentral?action=sms`: Sends an SMS message

## Troubleshooting

### Authentication Issues

If you're having trouble authenticating with RingCentral, check the following:

1. Make sure your RingCentral application has the correct permissions
2. Make sure your redirect URI is correctly configured in the RingCentral Developer Portal
3. Make sure your environment variables are correctly set

### Call or SMS Issues

If you're having trouble making calls or sending SMS messages, check the following:

1. Make sure the user is authenticated with RingCentral
2. Make sure the phone numbers are in the correct format (E.164 format, e.g., +15551234567)
3. Make sure the RingCentral account has calling and SMS capabilities

## Resources

- [RingCentral API Reference](https://developers.ringcentral.com/api-reference)
- [RingCentral Developer Guide](https://developers.ringcentral.com/guide)
- [RingCentral OAuth Flow](https://developers.ringcentral.com/guide/authentication/auth-code-flow)
