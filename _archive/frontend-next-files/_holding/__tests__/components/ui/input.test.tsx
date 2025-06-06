import { render, screen } from '../../../test-utils/test-utils';
import { Input } from '../../../components/ui/input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Test input" />);
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Custom input" />);
    const input = screen.getByPlaceholderText('Custom input');
    expect(input).toHaveClass('custom-class');
  });

  it('handles different input types', () => {
    render(<Input type="password" placeholder="Password field" />);
    const input = screen.getByPlaceholderText('Password field');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('supports required attribute', () => {
    render(<Input required placeholder="Required field" />);
    const input = screen.getByPlaceholderText('Required field');
    expect(input).toBeRequired();
  });
}); 