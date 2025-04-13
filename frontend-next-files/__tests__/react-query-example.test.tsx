import { render, screen, waitFor } from '../test-utils/test-utils';
import { useQuery } from '@tanstack/react-query';
import * as ReactQuery from '@tanstack/react-query';

// Mock the useQuery hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

// A simple component that uses React Query
function TestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test-data'],
    queryFn: async () => {
      return { message: 'Hello from React Query' };
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>{data?.message}</div>;
}

describe('React Query Test', () => {
  it('shows loading state initially', async () => {
    // Mock the implementation for this test case
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    render(<TestComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders data when query completes', async () => {
    // Mock the implementation for this test case
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { message: 'Hello from React Query' },
    });

    render(<TestComponent />);
    expect(screen.getByText('Hello from React Query')).toBeInTheDocument();
  });
}); 