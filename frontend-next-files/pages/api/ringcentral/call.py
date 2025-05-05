from ringcentral import SDK
import os
import json
from http.server import BaseHTTPRequestHandler

# RingCentral credentials - should be stored as environment variables in production
RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID', 'YOUR_CLIENT_ID')
RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET', 'YOUR_CLIENT_SECRET')
RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER', 'https://platform.ringcentral.com')
RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME', '')
RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD', '')
RINGCENTRAL_JWT = os.environ.get('RINGCENTRAL_JWT', '')

def init_ringcentral():
    """Initialize the RingCentral SDK and login"""
    sdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = sdk.platform()
    
    # Login using JWT or password
    if RINGCENTRAL_JWT:
        platform.login(jwt=RINGCENTRAL_JWT)
    else:
        platform.login(RINGCENTRAL_USERNAME, RINGCENTRAL_EXTENSION, RINGCENTRAL_PASSWORD)
    
    return platform

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests to initiate a RingCentral call"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        # Extract the from and to phone numbers
        from_number = data.get('from')
        to_number = data.get('to')
        
        # Validate input
        if not from_number or not to_number:
            self.send_error(400, 'Missing required parameters: from and to')
            return
        
        try:
            # Initialize RingCentral
            platform = init_ringcentral()
            
            # Make the call using RingOut API
            params = {
                'from': {'phoneNumber': from_number},
                'to': {'phoneNumber': to_number},
                'playPrompt': False  # Set to True if you want to play a prompt
            }
            
            response = platform.post('/restapi/v1.0/account/~/extension/~/ring-out', params)
            result = response.json()
            
            # Return success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'call_id': result.get('id'),
                'status': result.get('status', {}).get('callStatus')
            }).encode())
            
        except Exception as e:
            # Return error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode()) 