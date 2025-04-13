import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      
      // Validate required data
      if (!quoteData.client || !quoteData.client.name) {
        return res.status(400).json({ success: false, error: 'Client information is required' });
      }
      
      // Check that at least one insurance type is included
      if (!quoteData.has_auto && !quoteData.has_home && !quoteData.has_specialty) {
        return res.status(400).json({ 
          success: false, 
          error: 'At least one insurance type must be selected'
        });
      }
      
      // Make API call to backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/quotes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You might need to add authentication headers here
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create quote');
      }
      
      const data = await response.json();
      return res.status(201).json({ success: true, data });
    } catch (error) {
      console.error('Error creating quote:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  } else if (req.method === 'GET') {
    try {
      // Make API call to backend to fetch quotes
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/quotes/`, {
        headers: {
          // You might need to add authentication headers here
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch quotes');
      }
      
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }
} 