#!/usr/bin/env python3
import os
import sys
import json

def load_env_from_file(file_path='.env.local'):
    """Load environment variables from a .env file"""
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
        print(f"Environment variables loaded from {file_path}")
        return True
    except Exception as e:
        print(f"Error loading environment variables: {e}")
        return False

# Load environment variables
load_env_from_file()

# Print environment variables for debugging
print("\nRingCentral Environment Variables:")
env_vars = [
    'RINGCENTRAL_CLIENT_ID',
    'RINGCENTRAL_CLIENT_SECRET',
    'RINGCENTRAL_SERVER',
    'RINGCENTRAL_USERNAME',
    'RINGCENTRAL_EXTENSION',
    'RINGCENTRAL_PASSWORD',
    'NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER'
]

for var in env_vars:
    value = os.environ.get(var)
    if value:
        # Mask sensitive information
        if var in ['RINGCENTRAL_CLIENT_ID', 'RINGCENTRAL_CLIENT_SECRET', 'RINGCENTRAL_PASSWORD']:
            print(f"  {var}: {'*' * min(len(value), 8)}")
        else:
            print(f"  {var}: {value}")
    else:
        print(f"  {var}: Not set")

# Try to import the RingCentral SDK
try:
    from ringcentral import SDK
    print("\nRingCentral SDK is installed and importable")
    
    # RingCentral credentials
    RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID')
    RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET')
    RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER', 'https://platform.ringcentral.com')
    RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME')
    RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
    RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD')
    FROM_NUMBER = os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER')
    TO_NUMBER = "+16127996380"  # Your phone number
    
    print(f"\nMaking call from {FROM_NUMBER} to {TO_NUMBER}")
    
    # Initialize the SDK
    sdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = sdk.platform()
    
    # Login
    print(f"Authenticating with username: {RINGCENTRAL_USERNAME} and extension: {RINGCENTRAL_EXTENSION}")
    platform.login(RINGCENTRAL_USERNAME, RINGCENTRAL_EXTENSION, RINGCENTRAL_PASSWORD)
    
    # Make the call using RingOut API
    params = {
        'from': {'phoneNumber': FROM_NUMBER},
        'to': {'phoneNumber': TO_NUMBER},
        'playPrompt': False  # Set to True if you want to play a prompt
    }
    
    response = platform.post('/restapi/v1.0/account/~/extension/~/ring-out', params)
    result = response.json()
    
    print(f"Call initiated successfully. Call ID: {result.get('id')}")
    print(f"Call status: {result.get('status', {}).get('callStatus')}")
    
except ImportError:
    print("\nRingCentral SDK is NOT installed")
    print("Please install it using: pip install ringcentral")
except Exception as e:
    print(f"\nError: {str(e)}")

print("\nTest completed")
