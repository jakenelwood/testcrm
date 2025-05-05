import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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
        return handleCall(req, res);
      case 'sms':
        return handleSMS(req, res);
      default:
        return res.status(400).json({ message: `Unsupported action: ${action}` });
    }
  } catch (error) {
    console.error('RingCentral API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

// Handle phone calls using RingCentral
async function handleCall(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ message: 'Missing required parameters: from and to' });
  }

  // Call the Python script that uses RingCentral SDK
  const scriptPath = path.join(process.cwd(), 'pages/api/ringcentral/call.py');
  
  // Create a temporary JSON file with the data
  const tempFilePath = path.join(process.cwd(), 'temp_call_data.json');
  fs.writeFileSync(tempFilePath, JSON.stringify({ from, to }));
  
  try {
    const result = await runPythonScript(scriptPath, tempFilePath);
    return res.status(200).json(JSON.parse(result));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to make call', error: String(error) });
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Handle SMS messages using RingCentral
async function handleSMS(req: NextApiRequest, res: NextApiResponse) {
  const { from, to, text } = req.body;
  
  if (!from || !to || !text) {
    return res.status(400).json({ message: 'Missing required parameters: from, to, and text' });
  }

  // Call the Python script that uses RingCentral SDK
  const scriptPath = path.join(process.cwd(), 'pages/api/ringcentral/sms.py');
  
  // Create a temporary JSON file with the data
  const tempFilePath = path.join(process.cwd(), 'temp_sms_data.json');
  fs.writeFileSync(tempFilePath, JSON.stringify({ from, to, text }));
  
  try {
    const result = await runPythonScript(scriptPath, tempFilePath);
    return res.status(200).json(JSON.parse(result));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send SMS', error: String(error) });
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Helper function to run Python scripts
function runPythonScript(scriptPath: string, dataPath: string): Promise<string> {
  // Use the virtual environment's Python
  const venvPython = path.join(process.cwd(), '../ringcentral-env/bin/python');
  
  return new Promise((resolve, reject) => {
    exec(`${venvPython} ${scriptPath} ${dataPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return reject(error);
      }
      
      if (stderr) {
        console.warn(`Script warnings: ${stderr}`);
      }
      
      resolve(stdout);
    });
  });
} 