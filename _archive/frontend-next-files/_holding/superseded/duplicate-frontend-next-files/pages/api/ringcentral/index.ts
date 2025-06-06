import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

// Handle phone calls using RingCentral Python SDK
async function handleCall(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ message: 'Missing required parameters: from and to' });
  }

  console.log(`Initiating call from ${from} to ${to}`);

  try {
    // Create a temporary JSON file with the call data
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `call-${uuidv4()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify({ from, to }));
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'frontend-next-files', 'pages', 'api', 'ringcentral', 'call.py');
    
    // Execute the Python script
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [scriptPath, tempFile], {
        env: { ...process.env }
      });
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`Python error: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        // Clean up the temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('Failed to delete temp file:', e);
        }
        
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error: ${error}`);
          
          // If there's an authentication error, redirect to auth
          if (error.includes('authentication') || error.includes('401')) {
            return res.status(401).json({ 
              success: false, 
              error: 'Authentication required',
              redirect: '/api/ringcentral/auth?action=authorize'
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            error: error || 'Unknown error occurred'
          });
        }
        
        try {
          const jsonResult = JSON.parse(result);
          return res.status(jsonResult.success ? 200 : 500).json(jsonResult);
        } catch (e) {
          console.error('Failed to parse Python output:', e);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to parse response',
            raw: result
          });
        }
      });
    });
  } catch (error: any) {
    console.error('Error making call:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    });
  }
}

// Handle SMS messages using RingCentral Python SDK
async function handleSMS(req: NextApiRequest, res: NextApiResponse) {
  const { from, to, text } = req.body;
  
  if (!from || !to || !text) {
    return res.status(400).json({ message: 'Missing required parameters: from, to, and text' });
  }

  console.log(`Sending SMS from ${from} to ${to}`);

  try {
    // Create a temporary JSON file with the SMS data
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `sms-${uuidv4()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify({ from, to, text }));
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'frontend-next-files', 'pages', 'api', 'ringcentral', 'sms.py');
    
    // Execute the Python script
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [scriptPath, tempFile], {
        env: { ...process.env }
      });
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`Python error: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        // Clean up the temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('Failed to delete temp file:', e);
        }
        
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error: ${error}`);
          
          // If there's an authentication error, redirect to auth
          if (error.includes('authentication') || error.includes('401')) {
            return res.status(401).json({ 
              success: false, 
              error: 'Authentication required',
              redirect: '/api/ringcentral/auth?action=authorize'
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            error: error || 'Unknown error occurred'
          });
        }
        
        try {
          const jsonResult = JSON.parse(result);
          return res.status(jsonResult.success ? 200 : 500).json(jsonResult);
        } catch (e) {
          console.error('Failed to parse Python output:', e);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to parse response',
            raw: result
          });
        }
      });
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    });
  }
}
