import { render, screen } from '../../../test-utils/test-utils';
import { Label } from '../../../components/ui/label';

describe('Label Component', () => {
  it('renders correctly with text', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    const label = screen.getByText('Test Label');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    render(<Label className="custom-class">Test Label</Label>);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Label onClick={handleClick}>Clickable Label</Label>);
    const label = screen.getByText('Clickable Label');
    label.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('works with form controls', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" placeholder="Input field" />
      </>
    );
    const label = screen.getByText('Test Label');
    const input = screen.getByPlaceholderText('Input field');
    expect(label).toHaveAttribute('for', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');
  });
}); 