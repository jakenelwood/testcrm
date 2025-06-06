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

# RingCentral credentials - check both naming conventions
RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID') or os.environ.get('CLIENT_ID')
RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET') or os.environ.get('CLIENT_SECRET')
RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER') or os.environ.get('RC_API_BASE', 'https://platform.ringcentral.com')
RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME', '')
RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD', '')
RINGCENTRAL_JWT = os.environ.get('RINGCENTRAL_JWT', '')

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

def send_sms(from_number, to_number, text):
    """Send an SMS via RingCentral"""
    try:
        # Initialize RingCentral
        platform = init_ringcentral()

        print(f"Sending SMS from {from_number} to {to_number}")
        print(f"Message: {text}")

        # Send SMS using the SMS API
        params = {
            'from': {'phoneNumber': from_number},
            'to': [{'phoneNumber': to_number}],
            'text': text
        }

        response = platform.post('/restapi/v1.0/account/~/extension/~/sms', params)
        result = response.json()

        print(f"SMS sent successfully. Message ID: {result.get('id')}")

        return {
            'success': True,
            'message_id': result.get('id'),
            'status': 'sent'
        }

    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
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

        # Extract the from and to phone numbers and text
        from_number = data.get('from')
        to_number = data.get('to')
        text = data.get('text')

        # Validate input
        if not from_number or not to_number or not text:
            print(json.dumps({
                'success': False,
                'error': 'Missing required parameters: from, to, and text'
            }))
            sys.exit(1)

        # Send the SMS
        result = send_sms(from_number, to_number, text)

        # Return the result as JSON
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)
