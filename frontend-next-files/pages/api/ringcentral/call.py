from ringcentral import SDK
import os
import json
import sys

# RingCentral credentials - check both naming conventions
RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID') or os.environ.get('CLIENT_ID', 'YOUR_CLIENT_ID')
RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET') or os.environ.get('CLIENT_SECRET', 'YOUR_CLIENT_SECRET')
RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER') or os.environ.get('RC_API_BASE', 'https://platform.ringcentral.com')
RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME', '')
RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD', '')
RINGCENTRAL_JWT = os.environ.get('RINGCENTRAL_JWT', '')

def init_ringcentral():
    """Initialize the RingCentral SDK and login"""
    print(f"Connecting to RingCentral with client ID: {RINGCENTRAL_CLIENT_ID[:4]}...")
    print(f"Server URL: {RINGCENTRAL_SERVER}")
    
    sdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = sdk.platform()
    
    # Login using JWT or password
    if RINGCENTRAL_JWT:
        print("Authenticating with JWT...")
        platform.login(jwt=RINGCENTRAL_JWT)
    else:
        print(f"Authenticating with username: {RINGCENTRAL_USERNAME} and extension: {RINGCENTRAL_EXTENSION}")
        platform.login(RINGCENTRAL_USERNAME, RINGCENTRAL_EXTENSION, RINGCENTRAL_PASSWORD)
    
    return platform

def make_call(from_number, to_number):
    """Make a RingCentral call"""
    try:
        # Initialize RingCentral
        platform = init_ringcentral()
        
        print(f"Initiating call from {from_number} to {to_number}")
        
        # Make the call using RingOut API
        params = {
            'from': {'phoneNumber': from_number},
            'to': {'phoneNumber': to_number},
            'playPrompt': False  # Set to True if you want to play a prompt
        }
        
        response = platform.post('/restapi/v1.0/account/~/extension/~/ring-out', params)
        result = response.json()
        
        print(f"Call initiated successfully. Call ID: {result.get('id')}")
        
        return {
            'success': True,
            'call_id': result.get('id'),
            'status': result.get('status', {}).get('callStatus')
        }
        
    except Exception as e:
        print(f"Error making call: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    # Print environment variables for debugging
    print("Environment variables:")
    print(f"RINGCENTRAL_CLIENT_ID: {RINGCENTRAL_CLIENT_ID}")
    print(f"RINGCENTRAL_SERVER: {RINGCENTRAL_SERVER}")
    print(f"RINGCENTRAL_USERNAME: {'Set' if RINGCENTRAL_USERNAME else 'Not set'}")
    
    # Check if a data file path was provided
    if len(sys.argv) < 2:
        print("Error: Missing data file path")
        print("Usage: python call.py <data_file_path>")
        sys.exit(1)
    
    data_file_path = sys.argv[1]
    
    try:
        # Read the data from the file
        with open(data_file_path, 'r') as file:
            data = json.load(file)
        
        # Extract the from and to phone numbers
        from_number = data.get('from')
        to_number = data.get('to')
        
        # Validate input
        if not from_number or not to_number:
            print(json.dumps({
                'success': False,
                'error': 'Missing required parameters: from and to'
            }))
            sys.exit(1)
        
        # Make the call
        result = make_call(from_number, to_number)
        
        # Return the result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        })) 