# Testing Guide

This document describes the testing setup for the Quote Request Generator frontend application.

## Testing Stack

- **Jest**: Test runner
- **React Testing Library**: Testing React components
- **MSW (Mock Service Worker)**: API mocking

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (good for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Testing Structure

- `__tests__/`: Contains all test files
  - Files should be named `*.test.tsx` or `*.test.ts`
  - Folder structure mirrors the application structure
- `test-utils/`: Contains test utilities
  - `test-utils.tsx`: Custom render method with providers
- `mocks/`: Contains API mocks
  - `handlers.ts`: API request handlers
  - `server.ts`: Mock server setup

## Writing Tests

### Component Tests

```tsx
// Example component test
import { render, screen } from '../test-utils/test-utils';
import { Button } from '../components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### API Tests

The application uses MSW to mock API requests. Add your mock handlers in `mocks/handlers.ts`.

### Testing with React Query

The test setup includes React Query mocking. Use the provided helpers to test components that use React Query.

```tsx
// Example React Query test
import { render, screen } from '../test-utils/test-utils';
import { useQuery } from '@tanstack/react-query';

// Mock useQuery hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

function DataComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => Promise.resolve({ name: 'Test Data' }),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}

test('shows loading state', () => {
  (useQuery as jest.Mock).mockReturnValue({
    isLoading: true,
    data: undefined,
  });
  
  render(<DataComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## Test Coverage

Test coverage is set to a minimum threshold of 10% for the initial setup. As the project develops, coverage requirements should be increased.

## Best Practices

1. Test component behavior, not implementation details
2. Use user-centric queries (`getByRole`, `getByLabelText`, etc.)
3. Mock external dependencies
4. Keep tests isolated and independent
5. Use the custom `render` function from `test-utils` to ensure components are wrapped with required providers
6. Write tests that verify business requirements 