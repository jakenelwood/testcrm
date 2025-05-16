'use client';

import { useState } from 'react';
import { makeCall } from '@/utils/ringcentral';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

interface PhoneCallProps {
  phoneNumber: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PhoneCall({ 
  phoneNumber, 
  className = '',
  variant = 'default',
  size = 'default'
}: PhoneCallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleCall = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const callResult = await makeCall(phoneNumber);
      setResult(callResult);
    } catch (error) {
      console.error('Error making call:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-start">
      <Button
        onClick={handleCall}
        disabled={isLoading}
        className={className}
        variant={variant}
        size={size}
      >
        <Phone className="mr-2 h-4 w-4" />
        {isLoading ? 'Calling...' : 'Call'}
      </Button>
      
      {result && (
        <div className="mt-2 text-sm">
          {result.success ? (
            <p className="text-green-600">Call initiated successfully!</p>
          ) : (
            <p className="text-red-600">Call failed: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
