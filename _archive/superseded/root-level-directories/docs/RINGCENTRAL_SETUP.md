# RingCentral Integration Setup

This document provides instructions for setting up RingCentral integration with Gonzigo CRM to enable making calls and sending SMS directly from the application.

## Prerequisites

1. A RingCentral account with API access
2. Python 3.7 or newer installed
3. Node.js and npm

## Setup Steps

### 1. Create a RingCentral Application

1. Log in to the [RingCentral Developer Console](https://developers.ringcentral.com/login.html)
2. Create a new application:
   - Select "Server-only (No UI)" application type
   - Enable the following permissions:
     - Read Accounts
     - Read/Write Call Control
     - Read/Write SMS

### 2. Set Up Environment Variables

Update the `.env.local` file in the root directory with the following variables:

```
# RingCentral credentials
RINGCENTRAL_CLIENT_ID=YOUR_CLIENT_ID
RINGCENTRAL_CLIENT_SECRET=YOUR_CLIENT_SECRET
RINGCENTRAL_SERVER=https://platform.ringcentral.com
RINGCENTRAL_USERNAME=YOUR_USERNAME
RINGCENTRAL_EXTENSION=YOUR_EXTENSION
RINGCENTRAL_PASSWORD=YOUR_PASSWORD
# You can use JWT instead of username/password
# RINGCENTRAL_JWT=YOUR_JWT

# This is the phone number that will be used as the "from" number when making calls/sending texts
NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER=+15551234567

# Next.js public URL for OAuth redirect
NEXT_PUBLIC_APP_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3000/api/ringcentral/auth?action=callback
```

### 3. Install RingCentral SDK

We've already set up a Python virtual environment with the RingCentral SDK. If you need to reinstall:

```bash
# Create a virtual environment
python3 -m venv ringcentral-env

# Activate the virtual environment
source ringcentral-env/bin/activate  # On Windows: ringcentral-env\Scripts\activate

# Install the RingCentral SDK
pip install ringcentral
```

### 4. Testing the Integration

1. Make sure the CRM application is running (`npm run dev`)
2. Navigate to a lead's details
3. Click on the phone icon to make a call
4. Click on the message icon to send an SMS

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify your RingCentral credentials in the `.env.local` file.
2. **Missing Permissions**: Ensure your RingCentral application has the necessary permissions enabled.
3. **Python Path Issues**: If you get errors about not finding the Python virtual environment, check the path in `pages/api/ringcentral/index.ts`.
4. **RINGCENTRAL_CLIENT_ID not configured**: This error occurs when the environment variables are not properly loaded. Make sure your `.env.local` file is in the root directory and contains the correct RingCentral credentials.

### Logging

Check the console logs in your browser's developer tools and the terminal where the Next.js server is running for detailed error messages.

## Additional Resources

- [RingCentral Developer Guide](https://developers.ringcentral.com/guide)
- [RingCentral Python SDK Documentation](https://github.com/ringcentral/ringcentral-python)
- [RingCentral API Reference](https://developers.ringcentral.com/api-reference)

## Security Considerations

- Never expose your RingCentral credentials in client-side code
- Keep your `.env.local` file secure and do not commit it to version control
- Consider using environment variables in production deployments
