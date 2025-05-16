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
    'NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER',
    'REDIRECT_URI',
    'NEXT_PUBLIC_APP_URL'
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
    REDIRECT_URI = os.environ.get('REDIRECT_URI', 'http://localhost:3000/api/ringcentral/auth?action=callback')
    FROM_NUMBER = os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER')
    TO_NUMBER = "+16127996380"  # Your phone number
    
    # Initialize the SDK
    rcsdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = rcsdk.platform()
    
    # Generate the authorization URL
    auth_url = platform.auth_url(
        redirect_uri=REDIRECT_URI,
        response_type='code',
        state='random_string_here'  # optional
    )
    
    print("\n=== Step 1: Authorization URL ===")
    print("Go to this URL to log in and authorize the app:")
    print(auth_url)
    print("\nAfter authorization, you'll be redirected to your callback URL with a code parameter.")
    print("Example: http://localhost:3000/api/ringcentral/auth?action=callback&code=AUTHORIZATION_CODE")
    
    # Ask for the authorization code
    print("\n=== Step 2: Enter Authorization Code ===")
    print("After you've been redirected, copy the 'code' parameter from the URL and paste it below:")
    auth_code = input("Authorization Code: ")
    
    if auth_code:
        print("\n=== Step 3: Exchange Code for Token ===")
        try:
            # Exchange the authorization code for an access token
            platform.login(code=auth_code, redirect_uri=REDIRECT_URI)
            
            # Get the authentication data
            auth_data = platform.auth().data()
            
            print("Login successful!")
            print(f"Access Token: {auth_data['access_token'][:10]}...")
            print(f"Refresh Token: {auth_data['refresh_token'][:10]}...")
            print(f"Expires In: {auth_data['expires_in']} seconds")
            
            # Save the authentication data to a file
            with open('ringcentral_auth.json', 'w') as f:
                json.dump(auth_data, f)
            print("Authentication data saved to ringcentral_auth.json")
            
            print("\n=== Step 4: Make a Call ===")
            print(f"Making call from {FROM_NUMBER} to {TO_NUMBER}")
            
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
        except Exception as e:
            print(f"Error exchanging code for token: {str(e)}")
    else:
        print("No authorization code provided. Exiting.")
    
except ImportError:
    print("\nRingCentral SDK is NOT installed")
    print("Please install it using: pip install ringcentral")
except Exception as e:
    print(f"\nError: {str(e)}")

print("\nTest completed")
