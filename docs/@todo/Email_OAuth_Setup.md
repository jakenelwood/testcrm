OAuth Provider Credentials Setup
You need to create OAuth applications with Google and Microsoft to get the required credentials. Here's exactly what you need and how to get them:

🔵 Google OAuth Setup
What You Need:
GOOGLE_OAUTH_CLIENT_ID - Public identifier for your app
GOOGLE_OAUTH_CLIENT_SECRET - Private key for authentication
How to Get Them:
Go to Google Cloud Console
Visit: https://console.cloud.google.com/
Sign in with your Google account
Create or Select a Project
Click "Select a project" → "New Project"
Name: "Insurance CRM" (or your preferred name)
Click "Create"
Enable Google+ API
Go to "APIs & Services" → "Library"
Search for "Google+ API"
Click "Enable"
Create OAuth Credentials
Go to "APIs & Services" → "Credentials"
Click "Create Credentials" → "OAuth 2.0 Client ID"
Application type: "Web application"
Name: "Insurance CRM Web Client"
Configure Redirect URIs
Development: http://localhost:3000/auth/callback
Production: https://your-domain.com/auth/callback
Note: Replace with your actual domain for production
Get Your Credentials
Copy the Client ID (looks like: 123456789-abc123.apps.googleusercontent.com)
Copy the Client Secret (looks like: GOCSPX-abc123def456)
🔷 Microsoft/Azure OAuth Setup
What You Need:
AZURE_OAUTH_CLIENT_ID - Application (client) ID
AZURE_OAUTH_CLIENT_SECRET - Client secret value
How to Get Them:
Go to Azure Portal
Visit: https://portal.azure.com/
Sign in with your Microsoft account
Navigate to App Registrations
Search for "App registrations" in the top search bar
Click "App registrations"
Create New Registration
Click "New registration"
Name: "Insurance CRM"
Supported account types: Choose based on your needs:
Single tenant: Your organization only
Multi-tenant: Any Azure AD directory
Personal accounts: Include personal Microsoft accounts
Configure Redirect URIs
Platform: "Web"
Redirect URIs:
Get Application ID
On the app overview page, copy the Application (client) ID
This is your AZURE_OAUTH_CLIENT_ID
Create Client Secret
Go to "Certificates & secrets"
Click "New client secret"
Description: "Insurance CRM Secret"
Expires: Choose duration (24 months recommended)
Click "Add"
Copy the secret VALUE immediately (you won't see it again!)
This is your AZURE_OAUTH_CLIENT_SECRET
📝 Add to Environment Variables
Once you have the credentials, add them to your  .env.local file:

⚠️ Important Security Notes
🔒 Keep Secrets Secure:
Never commit  .env.local to version control
Use different credentials for development and production
Rotate secrets regularly (every 6-12 months)
Limit redirect URIs to only your domains
🌐 Production Setup:
Update redirect URIs to your production domain
Use environment variables in your hosting platform
Enable additional security features in OAuth providers
🧪 Testing OAuth
After adding credentials:

Restart your development server:
Test the OAuth flow:
Go to http://localhost:3000/auth/login
Click "Sign in with Google" or "Sign in with Microsoft"
Complete the OAuth flow
Verify user is created in Supabase
Check for errors:
Browser console for client-side errors
Supabase logs for authentication errors
Network tab for failed requests
🔧 Troubleshooting
Common Issues:
"Redirect URI mismatch"

Verify redirect URIs match exactly in OAuth provider settings
Check for trailing slashes or http vs https
"Invalid client"

Double-check client ID and secret are correct
Ensure no extra spaces or characters
"Scope errors"

Google: Ensure Google+ API is enabled
Azure: Check app permissions and consent
📚 Additional Resources
Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
Microsoft OAuth Documentation: https://docs.microsoft.com/en-us/azure/active-directory/develop/
Supabase Auth Documentation: https://supabase.com/docs/guides/auth/social-login
Once you have these credentials configured, your users will be able to sign in with their Google or Microsoft accounts, making the registration process much smoother! 🚀

