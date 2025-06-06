import { render, screen } from '../../../test-utils/test-utils';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '../../../components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Create a simple test component using the Form components
const TestForm = () => {
  // Define a simple schema
  const formSchema = z.object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
  });
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });
  
  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...field} placeholder="Enter username" />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  it('renders form elements correctly', () => {
    render(<TestForm />);
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
  });

  it('applies correct aria attributes', () => {
    render(<TestForm />);
    
    const input = screen.getByPlaceholderText('Enter username');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    
    // The input should have an aria-describedby attribute linking to the description
    expect(input).toHaveAttribute('aria-describedby');
    
    // Description element should have an id that matches the aria-describedby
    const descriptionId = input.getAttribute('aria-describedby');
    const description = screen.getByText('This is your public display name.');
    expect(description.id).toBe(descriptionId);
  });
  
  it('renders with custom class names', () => {
    // Define a custom form component with class names
    const CustomForm = () => {
      const form = useForm();
      return (
        <Form {...form}>
          <form>
            <FormItem className="custom-form-item">
              <FormLabel className="custom-form-label">Custom Label</FormLabel>
              <FormDescription className="custom-form-description">Custom Description</FormDescription>
            </FormItem>
          </form>
        </Form>
      );
    };
    
    render(<CustomForm />);
    
    // Test that class names are applied correctly
    expect(screen.getByText('Custom Label')).toHaveClass('custom-form-label');
    expect(screen.getByText('Custom Description')).toHaveClass('custom-form-description');
    
    // Check the FormItem container
    const formItem = screen.getByText('Custom Label').closest('div');
    expect(formItem).toHaveClass('custom-form-item');
  });
}); 