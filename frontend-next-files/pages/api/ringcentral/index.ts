import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// RingCentral API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Extract action from the URL
  const action = req.query.action as string;
  if (!action) {
    return res.status(400).json({ message: 'Missing action parameter' });
  }

  try {
    switch (action) {
      case 'call':
        return await handleCall(req, res);
      case 'sms':
        return await handleSMS(req, res);
      default:
        return res.status(400).json({ message: `Unsupported action: ${action}` });
    }
  } catch (error) {
    console.error('RingCentral API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

// Get the access token from the auth endpoint
async function getAccessToken() {
  try {
    // In a real implementation, this would retrieve the token from storage/session
    const tokenResponse = await axios.get('/api/ringcentral/auth?action=token');
    
    if (!tokenResponse.data.authenticated) {
      throw new Error('Not authenticated with RingCentral');
    }
    
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// Handle phone calls using RingCentral
async function handleCall(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ message: 'Missing required parameters: from and to' });
  }

  console.log(`Initiating call from ${from} to ${to}`);

  try {
    // Get access token using OAuth
    const accessToken = await getAccessToken();
    const server = process.env.RINGCENTRAL_SERVER || process.env.RC_API_BASE || 'https://platform.ringcentral.com';

    // Make the call using RingOut API
    const response = await axios({
      method: 'POST',
      url: `${server}/restapi/v1.0/account/~/extension/~/ring-out`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      data: {
        from: { phoneNumber: from },
        to: { phoneNumber: to },
        playPrompt: false
      }
    });

    console.log('Call initiated successfully:', response.data);
    return res.status(200).json({
      success: true,
      call_id: response.data.id,
      status: response.data.status?.callStatus
    });
  } catch (error: any) {
    // If unauthorized (401), redirect to authentication
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        redirect: '/api/ringcentral/auth?action=authorize'
      });
    }

    console.error('Error making call:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ 
      success: false, 
      error: error.response?.data?.message || error.message 
    });
  }
}

// Handle SMS messages using RingCentral
async function handleSMS(req: NextApiRequest, res: NextApiResponse) {
  const { from, to, text } = req.body;
  
  if (!from || !to || !text) {
    return res.status(400).json({ message: 'Missing required parameters: from, to, and text' });
  }

  console.log(`Sending SMS from ${from} to ${to}`);

  try {
    // Get access token using OAuth
    const accessToken = await getAccessToken();
    const server = process.env.RINGCENTRAL_SERVER || process.env.RC_API_BASE || 'https://platform.ringcentral.com';

    // Send SMS using the SMS API
    const response = await axios({
      method: 'POST',
      url: `${server}/restapi/v1.0/account/~/extension/~/sms`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      data: {
        from: { phoneNumber: from },
        to: [{ phoneNumber: to }],
        text: text
      }
    });

    console.log('SMS sent successfully:', response.data);
    return res.status(200).json({
      success: true,
      message_id: response.data.id,
      status: 'sent'
    });
  } catch (error: any) {
    // If unauthorized (401), redirect to authentication
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        redirect: '/api/ringcentral/auth?action=authorize'
      });
    }

    console.error('Error sending SMS:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ 
      success: false, 
      error: error.response?.data?.message || error.message 
    });
  }
} 