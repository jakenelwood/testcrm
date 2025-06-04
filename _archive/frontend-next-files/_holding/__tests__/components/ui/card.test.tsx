import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';

describe('Card Components', () => {
  it('renders Card component with children', () => {
    const { container } = render(<Card>Card Content</Card>);
    expect(container.firstChild).toHaveClass('rounded-lg border bg-card text-card-foreground shadow-sm');
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders CardHeader component with children', () => {
    const { container } = render(<CardHeader>Header Content</CardHeader>);
    expect(container.firstChild).toHaveClass('flex flex-col space-y-1.5 p-6');
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('renders CardTitle component with children', () => {
    const { container } = render(<CardTitle>Title Content</CardTitle>);
    expect(container.firstChild).toHaveClass('text-2xl font-semibold leading-none tracking-tight');
    expect(screen.getByText('Title Content')).toBeInTheDocument();
  });

  it('renders CardDescription component with children', () => {
    const { container } = render(<CardDescription>Description Content</CardDescription>);
    expect(container.firstChild).toHaveClass('text-sm text-muted-foreground');
    expect(screen.getByText('Description Content')).toBeInTheDocument();
  });

  it('renders CardContent component with children', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('p-6 pt-0');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders CardFooter component with children', () => {
    const { container } = render(<CardFooter>Footer Content</CardFooter>);
    expect(container.firstChild).toHaveClass('flex items-center p-6 pt-0');
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('renders a complete card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('applies custom className to Card component', () => {
    const { container } = render(<Card className="custom-class">Card Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('rounded-lg border bg-card text-card-foreground shadow-sm');
  });
}); 