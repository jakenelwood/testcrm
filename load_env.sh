#!/bin/bash

# This script loads environment variables from .env.local file
# Usage: source load_env.sh

if [ -f ".env.local" ]; then
    echo "Loading environment variables from .env.local"

    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        # Skip comments and empty lines
        [[ $key == \#* ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Skip lines without a proper key=value format
        [[ $key == *"="* ]] || continue
        
        # Extract the key part before = and export it
        export_key=$(echo "$key" | cut -d '=' -f 1)
        
        # If the value part includes # and the rest of the line, strip it
        if [[ $value == *"#"* ]]; then
            value=$(echo "$value" | sed 's/#.*$//')
        fi
        
        # Remove quotes if they exist
        value=$(echo "$value" | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
        
        # Export the variable
        export "$export_key"="$value"
        echo "Exported $export_key"
    done < .env.local
    
    echo "Environment variables loaded successfully"
else
    echo "Error: .env.local file not found"
    exit 1
fi 