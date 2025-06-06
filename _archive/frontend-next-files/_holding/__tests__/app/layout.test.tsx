import { render, screen } from '../../test-utils/test-utils';
import RootLayout from '../../app/layout';

// Mock the Inter font to avoid issues with Next.js font loading in tests
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-font',
    variable: 'mocked-variable',
    style: { fontFamily: 'mocked-font' },
  }),
}));

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies font classes to body', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    const body = document.querySelector('body');
    expect(body).toHaveClass('bg-background');
    expect(body).toHaveClass('font-sans');
    expect(body).toHaveClass('antialiased');
  });

  it('includes Toaster component', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    // Toaster has a [role="region"] attribute
    const toaster = document.querySelector('[role="region"]');
    expect(toaster).toBeInTheDocument();
  });

  it('sets correct html attributes', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    const html = document.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
    expect(html).toHaveAttribute('suppressHydrationWarning');
  });
}); 