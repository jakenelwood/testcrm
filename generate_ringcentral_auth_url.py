#!/usr/bin/env python3
import os
import sys
import uuid
from dotenv import load_dotenv

# Load environment variables from .env.local
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
print(f"Loading environment variables from: {dotenv_path}")
load_dotenv(dotenv_path)

# Try to import the RingCentral SDK
try:
    from ringcentral import SDK
    print("\nRingCentral SDK is installed and importable")

    # RingCentral credentials
    RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID')
    RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET')
    RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER', 'https://platform.ringcentral.com')
    REDIRECT_URI = os.environ.get('REDIRECT_URI', 'http://localhost:3000/api/ringcentral/auth?action=callback')

    print(f"\nRingCentral Configuration:")
    print(f"Client ID: {RINGCENTRAL_CLIENT_ID[:4]}..." if RINGCENTRAL_CLIENT_ID else "Client ID: Not set")
    print(f"Server: {RINGCENTRAL_SERVER}")
    print(f"Redirect URI: {REDIRECT_URI}")

    # Initialize the SDK
    print("\nInitializing RingCentral SDK...")
    rcsdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = rcsdk.platform()

    # Generate a random state for security
    state = str(uuid.uuid4())

    # Generate the authorization URL
    auth_url = rcsdk.auth_url(
        redirect_uri=REDIRECT_URI,
        response_type='code',
        state=state
    )

    print("\n=== RingCentral Authorization URL ===")
    print(f"\nGo to this URL in your browser to authorize the app:")
    print(f"\n{auth_url}")
    print("\nAfter authorization, you will be redirected back to your application.")
    print("The code parameter in the redirect URL will be used to obtain access tokens.")
    print("\nNote: Save this state value to verify the callback: " + state)

except ImportError:
    print("\nRingCentral SDK is NOT installed")
    print("Please install it using: pip install ringcentral")
    sys.exit(1)
except Exception as e:
    print(f"\nError: {str(e)}")
    sys.exit(1)

print("\nScript completed")
