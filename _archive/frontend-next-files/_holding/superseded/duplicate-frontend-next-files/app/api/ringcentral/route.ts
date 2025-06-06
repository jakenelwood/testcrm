import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle POST requests to the RingCentral API endpoint
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json({ message: 'Missing action parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    switch (action) {
      case 'call':
        return await handleCall(body);
      case 'sms':
        return await handleSMS(body);
      default:
        return NextResponse.json({ message: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('RingCentral API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: String(error) 
    }, { status: 500 });
  }
}

/**
 * Handle phone calls using RingCentral Python SDK
 */
async function handleCall(body: any) {
  const { from, to } = body;
  
  if (!from || !to) {
    return NextResponse.json({ message: 'Missing required parameters: from and to' }, { status: 400 });
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
            return resolve(NextResponse.json({ 
              success: false, 
              error: 'Authentication required',
              redirect: '/api/ringcentral/auth?action=authorize'
            }, { status: 401 }));
          }
          
          return resolve(NextResponse.json({ 
            success: false, 
            error: error || 'Unknown error occurred'
          }, { status: 500 }));
        }
        
        try {
          const jsonResult = JSON.parse(result);
          return resolve(NextResponse.json(jsonResult, { 
            status: jsonResult.success ? 200 : 500 
          }));
        } catch (e) {
          console.error('Failed to parse Python output:', e);
          return resolve(NextResponse.json({ 
            success: false, 
            error: 'Failed to parse response',
            raw: result
          }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    console.error('Error making call:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Handle SMS messages using RingCentral Python SDK
 */
async function handleSMS(body: any) {
  const { from, to, text } = body;
  
  if (!from || !to || !text) {
    return NextResponse.json({ message: 'Missing required parameters: from, to, and text' }, { status: 400 });
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
            return resolve(NextResponse.json({ 
              success: false, 
              error: 'Authentication required',
              redirect: '/api/ringcentral/auth?action=authorize'
            }, { status: 401 }));
          }
          
          return resolve(NextResponse.json({ 
            success: false, 
            error: error || 'Unknown error occurred'
          }, { status: 500 }));
        }
        
        try {
          const jsonResult = JSON.parse(result);
          return resolve(NextResponse.json(jsonResult, { 
            status: jsonResult.success ? 200 : 500 
          }));
        } catch (e) {
          console.error('Failed to parse Python output:', e);
          return resolve(NextResponse.json({ 
            success: false, 
            error: 'Failed to parse response',
            raw: result
          }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
