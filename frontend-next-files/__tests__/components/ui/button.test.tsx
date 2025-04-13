import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Button variant="destructive">Destructive Button</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain('bg-destructive');
  });

  it('applies the correct size class', () => {
    const { container } = render(<Button size="sm">Small Button</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain('h-9');
  });

  it('handles the disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:opacity-50');
  });

  it('can be used as a link with asChild', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    const link = screen.getByText('Link Button');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });
}); 