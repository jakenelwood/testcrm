#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Copy environment variables
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your Supabase credentials"
fi

# Start the service
echo "Starting CSV Import Service on port 8001..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
