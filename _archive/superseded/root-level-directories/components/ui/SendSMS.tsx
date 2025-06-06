'use client';

import { useState } from 'react';
import { sendSMS } from '@/utils/ringcentral';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';

interface SendSMSProps {
  phoneNumber: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SendSMS({ 
  phoneNumber, 
  className = '',
  variant = 'default',
  size = 'default'
}: SendSMSProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const handleSendSMS = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const smsResult = await sendSMS(phoneNumber, message);
      setResult(smsResult);
      
      if (smsResult.success) {
        setMessage('');
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-start">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={className}
          variant={variant}
          size={size}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Send SMS
        </Button>
      ) : (
        <div className="w-full max-w-md border rounded-md p-4 shadow-sm">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mb-2"
            rows={3}
          />
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setMessage('');
                setResult(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSendSMS}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-2 text-sm">
              {result.success ? (
                <p className="text-green-600">Message sent successfully!</p>
              ) : (
                <p className="text-red-600">Failed to send message: {result.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
