export const supabase = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
};

export const jwt = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  expiresIn: '7d',
};

export const ringcentral = {
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  serverUrl: process.env.RINGCENTRAL_SERVER_URL || 'https://platform.devtest.ringcentral.com',
  redirectUri: process.env.RINGCENTRAL_REDIRECT_URI || 'http://localhost:3000/oauth-callback',
};

export const app = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  env: process.env.NODE_ENV || 'development',
};
