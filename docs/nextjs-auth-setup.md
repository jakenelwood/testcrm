# Next.js Authentication Setup Guide

This guide covers how to implement authentication in the Next.js frontend for the Quote Request Generator application.

## Overview

Authentication is a critical component of the Quote Request Generator, allowing:
- Secure access to the application
- User-specific data and history
- Role-based permissions (admin, agent, etc.)

We'll implement authentication using Next.js's built-in authentication features, which integrate well with Vercel deployment.

## Implementation Steps

### 1. Install Required Packages

```bash
# Navigate to your frontend directory
cd frontend-next

# Install authentication packages
npm install next-auth @auth/core
```

### 2. Configure Environment Variables

Create or update `.env.local` file in your frontend directory:

```
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_random_secret_here

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://65.21.174.252:8000
```

For production on Vercel, add these environment variables in the Vercel dashboard.

### 3. Set Up API Route for Authentication

Create a file at `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "@/lib/api-config";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return user;
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };
```

### 4. Create Authentication Provider

Create a file at `app/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### 5. Add the Provider to Your Layout

Update your `app/layout.tsx`:

```tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 6. Create Login Page

Create a file at `app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Quote Request Generator
        </h1>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 7. Create Authentication Hooks

Create a file at `lib/auth.ts`:

```typescript
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Hook to protect client components
export function useAuth({ required = true, roles = [] } = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const authenticated = status === "authenticated";

  useEffect(() => {
    if (loading) return;

    if (required && !authenticated) {
      router.push("/login");
      return;
    }

    if (
      roles.length > 0 &&
      authenticated &&
      session?.user?.role &&
      !roles.includes(session.user.role)
    ) {
      router.push("/unauthorized");
    }
  }, [required, roles, authenticated, loading, router, session]);

  return {
    session,
    loading,
    authenticated,
  };
}

// Function to handle logout
export function handleLogout() {
  signOut({ callbackUrl: "/login" });
}
```

### 8. Create Authentication Middleware

Create a file at `middleware.ts` in the project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isAuthenticated && !isPublicPath) {
    // Redirect unauthenticated users to the login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check for role-based permissions
  if (isAuthenticated && request.nextUrl.pathname.startsWith("/admin")) {
    const userRole = token.role as string;
    if (userRole !== "admin") {
      // Redirect non-admin users
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

// Run middleware on paths matching these patterns
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|login|api/auth).*)",
  ],
};
```

### 9. Create Protected Pages

Create a sample protected page at `app/dashboard/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth";
import { handleLogout } from "@/lib/auth";

export default function DashboardPage() {
  const { session, loading } = useAuth({ required: true });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">
        Welcome, {session?.user?.name || session?.user?.email}!
      </p>
      <p className="mt-2">
        Role: {session?.user?.role || "No role assigned"}
      </p>
      <button
        onClick={handleLogout}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  );
}
```

### 10. Create an Unauthorized Page

Create a file at `app/unauthorized/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { handleLogout } from "@/lib/auth";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-4 text-center text-gray-700">
        You don't have permission to access this page.
      </p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
```

## Backend Integration

The frontend authentication relies on a backend login endpoint. Ensure your backend provides:

### 1. Login Endpoint

```javascript
// Example Express.js route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials against your database
    const user = await userRepository.findByEmail(email);
    
    if (!user || !await comparePasswords(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const accessToken = generateToken(user);
    
    // Return user information and token
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      access_token: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 2. User Backend Models

Your backend should have a users table with at least:
- Email
- Password (hashed)
- Role (admin, agent, user, etc.)

## Testing the Authentication Flow

To test your authentication implementation:

1. Start the backend and frontend servers:
   ```bash
   # Start backend
   cd backend
   npm run dev
   
   # Start frontend
   cd frontend-next
   npm run dev
   ```

2. Try accessing a protected page (e.g., `/dashboard`) without logging in:
   - You should be redirected to the login page

3. Log in with valid credentials:
   - You should be redirected to the dashboard page
   - User information should be displayed correctly

4. Test role-based access:
   - Try accessing admin pages with a non-admin account
   - You should be redirected to the unauthorized page

## Vercel Deployment Considerations

When deploying to Vercel:

1. Configure environment variables in the Vercel dashboard:
   - `NEXTAUTH_URL`: Your production URL
   - `NEXTAUTH_SECRET`: A secure random string
   - `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL

2. Ensure CORS is properly configured on your backend:
   ```javascript
   app.use(cors({
     origin: ['https://your-vercel-domain.vercel.app'],
     credentials: true
   }));
   ```

## Security Best Practices

1. **HTTPS Only**: Ensure all production endpoints use HTTPS
2. **Token Rotation**: Implement refresh token rotation for long-lived sessions
3. **Secure Cookies**: Use secure, HTTP-only cookies for session storage
4. **Rate Limiting**: Implement rate limiting for login attempts
5. **Input Validation**: Validate all user inputs on both client and server
6. **Security Headers**: Implement proper security headers (CSP, HSTS, etc.)

## Troubleshooting

### Common Issues and Solutions

1. **Session Not Persisting**:
   - Check NEXTAUTH_URL configuration
   - Ensure cookies are being sent correctly

2. **JWT Verification Errors**:
   - Verify NEXTAUTH_SECRET is consistent across environments
   - Check token expiration settings

3. **Redirect Loops**:
   - Ensure middleware redirect logic is correct
   - Check auth status detection in components

4. **CORS Issues**:
   - Configure backend to allow requests from frontend origin
   - Check credentials handling in fetch requests 