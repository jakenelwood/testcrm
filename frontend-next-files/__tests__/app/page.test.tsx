import { jest } from '@jest/globals';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Import the redirect function from the mocked module
import { redirect } from 'next/navigation';

// Import the component to test
import HomePage from '../../app/page';

describe('HomePage', () => {
  it('redirects to the dashboard', () => {
    // Since HomePage immediately calls redirect, we don't need to render it
    // Just import it so the code runs and the redirect is triggered
    HomePage();
    
    // Verify redirect was called with the correct path
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
}); 