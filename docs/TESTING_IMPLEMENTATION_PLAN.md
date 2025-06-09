# 🧪 Testing Infrastructure Implementation Plan
**Priority:** HIGH  
**Timeline:** 2 weeks  
**Based on:** Pragmatic Programming Guidelines & Current Codebase Analysis

---

## 📊 CURRENT TESTING STATE

### What We Have
- Basic ESLint configuration
- TypeScript setup (though not strict)
- Some archived Jest configuration files
- Comprehensive environment validation scripts

### What We Need
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for critical UI
- End-to-end authentication flow tests
- Database operation tests

---

## 🎯 TESTING STRATEGY

### Testing Pyramid Approach
```
    /\     E2E Tests (Few)
   /  \    - Authentication flows
  /____\   - Critical user journeys
 /      \  
/________\  Integration Tests (Some)
           - API endpoints
           - Database operations
           
           Unit Tests (Many)
           - Utility functions
           - Business logic
           - Component logic
```

### Technology Stack
- **Test Runner:** Jest
- **React Testing:** React Testing Library
- **API Testing:** Supertest
- **Mocking:** MSW (Mock Service Worker)
- **Coverage:** Built-in Jest coverage

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Setup & Foundation (Days 1-3)

#### 1.1 Install Testing Dependencies
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest \
  msw
```

#### 1.2 Configure Jest
Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### 1.3 Setup Test Environment
Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))
```

### Phase 2: Critical Business Logic Tests (Days 4-7)

#### 2.1 Environment Configuration Tests
Test file: `lib/config/__tests__/environment.test.ts`
- Environment variable validation
- Security configuration validation
- Database connection configuration

#### 2.2 Authentication Logic Tests
Test file: `contexts/__tests__/auth-context.test.tsx`
- User authentication flows
- Session management
- Error handling

#### 2.3 Validation Middleware Tests
Test file: `lib/middleware/__tests__/validation.test.ts`
- Input sanitization
- Rate limiting
- Security headers

#### 2.4 Database Utility Tests
Test file: `lib/database/__tests__/utils.test.ts`
- Connection handling
- Query building
- Error handling

### Phase 3: API Integration Tests (Days 8-10)

#### 3.1 Setup API Test Environment
Create test database configuration and mock Supabase client

#### 3.2 Authentication API Tests
- Login/logout endpoints
- Token validation
- Session management

#### 3.3 Lead Management API Tests
- CRUD operations
- Data validation
- Error responses

#### 3.4 Pipeline Management API Tests
- Pipeline operations
- Stage management
- Data integrity

### Phase 4: Component Tests (Days 11-14)

#### 4.1 Critical UI Components
- Authentication forms
- Lead creation forms
- Pipeline management interface
- Navigation components

#### 4.2 Form Validation Tests
- Input validation
- Error display
- Submission handling

#### 4.3 Theme and UI Tests
- Theme switching
- Responsive behavior
- Accessibility compliance

---

## 🛠️ SPECIFIC TEST EXAMPLES

### Example 1: Environment Validation Test
```typescript
// lib/config/__tests__/environment.test.ts
import { env, security } from '../environment'

describe('Environment Configuration', () => {
  it('should validate JWT secret strength', () => {
    expect(security.validateJwtSecret('weak')).toBe(false)
    expect(security.validateJwtSecret('a'.repeat(32))).toBe(true)
  })

  it('should require HTTPS in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXTAUTH_URL = 'http://example.com'
    
    expect(() => security.isSecureContext()).toThrow()
  })
})
```

### Example 2: Authentication Context Test
```typescript
// contexts/__tests__/auth-context.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'

const TestComponent = () => {
  const { user, loading } = useAuth()
  return (
    <div>
      {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
    </div>
  )
}

describe('AuthContext', () => {
  it('should handle authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })
})
```

### Example 3: API Integration Test
```typescript
// app/api/__tests__/auth.test.ts
import { POST } from '../auth/login/route'
import { NextRequest } from 'next/server'

describe('/api/auth/login', () => {
  it('should authenticate valid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'validpassword'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBeDefined()
  })

  it('should reject invalid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    })

    const response = await POST(request)
    
    expect(response.status).toBe(401)
  })
})
```

---

## 📊 SUCCESS METRICS

### Coverage Targets
- **Unit Tests:** 80% coverage for utility functions and business logic
- **Integration Tests:** 70% coverage for API endpoints
- **Component Tests:** 60% coverage for critical UI components

### Quality Gates
- All tests must pass before deployment
- No decrease in coverage percentage
- Performance tests for critical paths

### Monitoring
- Test execution time tracking
- Flaky test identification
- Coverage trend analysis

---

## 🚀 GETTING STARTED

### Immediate Next Steps
1. **Install Dependencies:** Run the npm install command above
2. **Create Configuration:** Set up jest.config.js and jest.setup.js
3. **Write First Test:** Start with environment validation tests
4. **Add to CI/CD:** Integrate tests into deployment pipeline

### Package.json Scripts to Add
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

This testing implementation will significantly improve code quality, reduce bugs, and provide confidence for future development and deployments.
