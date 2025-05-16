#!/usr/bin/env python3
from ringcentral import SDK
import os
import sys

# RingCentral credentials
RINGCENTRAL_CLIENT_ID = "9NGTe08cOAJakQ7ZSuJh01"
RINGCENTRAL_CLIENT_SECRET = "06cWdA6QEdTdHOavJAKerW2JuXkF4fxnJemMnTsB1U5D"
RINGCENTRAL_SERVER = "https://platform.ringcentral.com"
RINGCENTRAL_USERNAME = "brian@twincitiescoverage.com"
RINGCENTRAL_EXTENSION = "101"
RINGCENTRAL_PASSWORD = "1Forrest1!"
FROM_NUMBER = "+16127786178"
TO_NUMBER = "+16127996380"

def make_call(from_number, to_number):
    """Make a RingCentral call"""
    try:
        print(f"Connecting to RingCentral with client ID: {RINGCENTRAL_CLIENT_ID}")
        print(f"Server URL: {RINGCENTRAL_SERVER}")
        
        # Initialize the SDK
        sdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
        platform = sdk.platform()
        
        # Login
        print(f"Authenticating with username: {RINGCENTRAL_USERNAME} and extension: {RINGCENTRAL_EXTENSION}")
        platform.login(RINGCENTRAL_USERNAME, RINGCENTRAL_EXTENSION, RINGCENTRAL_PASSWORD)
        
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
    print("Simple RingCentral Call Test")
    print("===========================")
    
    result = make_call(FROM_NUMBER, TO_NUMBER)
    
    if result['success']:
        print(f"Call initiated successfully! Call ID: {result['call_id']}")
    else:
        print(f"Call failed: {result.get('error')}")
    
    print("\nTest completed")
