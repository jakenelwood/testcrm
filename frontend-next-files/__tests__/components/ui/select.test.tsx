import { render, screen } from '../../../test-utils/test-utils';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel
} from '../../../components/ui/select';

// Note: Testing Radix UI's Select is limited in a jsdom environment
// as many interactions require a full browser environment
describe('Select Component', () => {
  it('renders with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('applies custom className to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger-class">
          <SelectValue placeholder="Custom trigger" />
        </SelectTrigger>
      </Select>
    );
    
    const triggerElement = screen.getByText('Custom trigger').closest('button');
    expect(triggerElement).toHaveClass('custom-trigger-class');
  });

  it('renders with groups and labels', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select with groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Select with groups')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
      </Select>
    );
    
    const triggerElement = screen.getByText('Disabled select').closest('button');
    expect(triggerElement).toBeDisabled();
  });

  it('renders disabled items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select with disabled item" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2" disabled>Disabled Option</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Select with disabled item')).toBeInTheDocument();
    // Note: We can't test the disabled item directly without opening the select
  });
}); 