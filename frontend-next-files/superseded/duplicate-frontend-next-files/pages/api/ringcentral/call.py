#!/usr/bin/env python3
import os
import json
import sys
import subprocess

# Try to import the RingCentral SDK
try:
    from ringcentral import SDK
except ImportError:
    # If the SDK is not installed, try to use the virtual environment
    venv_paths = [
        os.path.join(os.getcwd(), 'rc-venv', 'bin', 'python'),
        os.path.join(os.getcwd(), 'ringcentral-env', 'bin', 'python')
    ]

    for venv_path in venv_paths:
        if os.path.exists(venv_path):
            print(f"Using Python from virtual environment: {venv_path}")
            # Re-execute this script using the virtual environment Python
            os.execv(venv_path, [venv_path] + sys.argv)

    print("RingCentral SDK not found and no virtual environment available.")
    sys.exit(1)

# Load environment variables from .env.local
def load_env_from_file(file_path='.env.local'):
    """Load environment variables from a .env file"""
    try:
        # Try different paths for the .env.local file
        possible_paths = [
            file_path,
            os.path.join(os.getcwd(), file_path),
            os.path.join(os.path.dirname(os.getcwd()), file_path),
            os.path.join(os.path.dirname(os.path.dirname(os.getcwd())), file_path)
        ]

        for path in possible_paths:
            if os.path.exists(path):
                print(f"Found .env.local at: {path}")
                with open(path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            key, value = line.split('=', 1)
                            os.environ[key] = value
                print(f"Environment variables loaded from {path}")
                return True

        print(f"Could not find .env.local file. Tried paths: {possible_paths}")
        return False
    except Exception as e:
        print(f"Error loading environment variables: {e}")
        return False

# Load environment variables
load_env_from_file()

# RingCentral credentials - check both naming conventions
RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID') or os.environ.get('CLIENT_ID')
RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET') or os.environ.get('CLIENT_SECRET')
RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER') or os.environ.get('RC_API_BASE', 'https://platform.ringcentral.com')
RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME', '')
RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD', '')
RINGCENTRAL_JWT = os.environ.get('RINGCENTRAL_JWT', '')

# Print environment variables for debugging
print("Environment variables:")
print(f"RINGCENTRAL_CLIENT_ID: {RINGCENTRAL_CLIENT_ID[:4] + '...' if RINGCENTRAL_CLIENT_ID else 'Not set'}")
print(f"RINGCENTRAL_SERVER: {RINGCENTRAL_SERVER}")
print(f"RINGCENTRAL_USERNAME: {RINGCENTRAL_USERNAME or 'Not set'}")

def init_ringcentral():
    """Initialize the RingCentral SDK and login"""
    print(f"Connecting to RingCentral with client ID: {RINGCENTRAL_CLIENT_ID}")
    print(f"Server URL: {RINGCENTRAL_SERVER}")

    if not RINGCENTRAL_CLIENT_ID:
        raise ValueError("RINGCENTRAL_CLIENT_ID not configured")

    sdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = sdk.platform()

    # Login using JWT or password
    if RINGCENTRAL_JWT:
        print("Authenticating with JWT...")
        platform.login(jwt=RINGCENTRAL_JWT)
    else:
        if not RINGCENTRAL_USERNAME or not RINGCENTRAL_PASSWORD:
            raise ValueError("RingCentral credentials not configured. Set RINGCENTRAL_USERNAME and RINGCENTRAL_PASSWORD")

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
    # Check if a data file path was provided
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No data file provided'
        }))
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
        sys.exit(1)
