import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock React Query (conditionally)
try {
  // Check if the module exists before mocking it
  jest.requireActual('@tanstack/react-query');
  
  jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    useQuery: jest.fn().mockReturnValue({ 
      isLoading: false, 
      error: null, 
      data: null, 
      refetch: jest.fn() 
    }),
    useMutation: jest.fn().mockReturnValue({
      isLoading: false,
      error: null,
      data: null,
      mutate: jest.fn(),
      reset: jest.fn(),
    }),
    useQueryClient: jest.fn().mockReturnValue({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
    }),
  }));
} catch (e) {
  // Module not found, skip mocking
  console.log('React Query not installed, skipping mocks');
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
})); 