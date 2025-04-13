import { render, screen } from '@testing-library/react';

describe('Testing setup verification', () => {
  it('should render a component correctly', () => {
    // Arrange
    render(<div data-testid="test-element">Test Component</div>);
    
    // Act & Assert
    const element = screen.getByTestId('test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test Component');
  });
}); 