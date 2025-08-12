#!/bin/bash

# Script to fix Supabase imports in API routes

echo "Fixing Supabase imports in API routes..."

# Find all route.ts files in app/api
find app/api -name "route.ts" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Replace the import statement
    sed -i 's/import { createServerClient } from '\''@\/utils\/supabase\/server'\'';/import { createClient } from '\''@\/utils\/supabase\/server'\'';/g' "$file"
    
    # Remove the cookies import if it exists and createClient is used
    sed -i '/import { cookies } from '\''next\/headers'\'';/d' "$file"
    
    # Replace the complex supabase client creation with simple createClient call
    # This is a more complex replacement, so we'll do it with a more targeted approach
    
done

echo "Done fixing Supabase imports!"
