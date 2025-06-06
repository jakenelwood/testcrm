import { render, screen } from '../../../test-utils/test-utils';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';

describe('Alert Component', () => {
  it('renders correctly with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert Description')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
      </Alert>
    );
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('bg-background');
  });

  it('renders with destructive variant', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error Alert</AlertTitle>
      </Alert>
    );
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('border-destructive/50');
    expect(alertElement).toHaveClass('text-destructive');
  });

  it('applies custom className to Alert', () => {
    render(
      <Alert className="custom-alert-class">
        <AlertTitle>Custom Alert</AlertTitle>
      </Alert>
    );
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('custom-alert-class');
  });

  it('applies custom className to AlertTitle', () => {
    render(
      <Alert>
        <AlertTitle className="custom-title-class">Custom Title</AlertTitle>
      </Alert>
    );
    
    const titleElement = screen.getByText('Custom Title');
    expect(titleElement).toHaveClass('custom-title-class');
  });

  it('applies custom className to AlertDescription', () => {
    render(
      <Alert>
        <AlertDescription className="custom-desc-class">Custom Description</AlertDescription>
      </Alert>
    );
    
    const descElement = screen.getByText('Custom Description');
    expect(descElement).toHaveClass('custom-desc-class');
  });
}); 