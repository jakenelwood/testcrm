#!/bin/bash

# Script to index the CRM codebase
# Run this script from the root of the project

echo "Indexing CRM codebase..."

# Create directory for indexes if it doesn't exist
mkdir -p codebase-indexes

# File index - all files excluding node_modules, git, and .next
echo "Creating file index..."
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | sort > codebase-indexes/codebase_file_index.txt

# File types
echo "Creating file types index..."
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -exec file --mime-type {} \; | sort > codebase-indexes/codebase_file_types.txt

# TypeScript components
echo "Indexing TypeScript components..."
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | sort > codebase-indexes/tsx_components_index.txt

# Code file line counts
echo "Counting lines in code files..."
find frontend-next-files -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs wc -l | sort -nr > codebase-indexes/code_file_line_counts.txt

# Database schema
echo "Indexing database schema..."
find supabase -name "*.sql" | xargs cat > codebase-indexes/database_schema_index.sql

# Frontend components
echo "Indexing frontend components..."
find frontend-next-files/components -type f | sort > codebase-indexes/frontend_components_index.txt

# App routes
echo "Indexing app routes..."
find frontend-next-files/app -type f | sort > codebase-indexes/app_routes_index.txt

# Pages routes
echo "Indexing pages routes..."
find frontend-next-files/pages -type f | sort > codebase-indexes/pages_routes_index.txt

# Supabase files
echo "Indexing Supabase files..."
find supabase -type f | sort > codebase-indexes/supabase_files_index.txt

# Copy the index documentation
cp codebase_index.md codebase-indexes/

echo "Indexing complete! Check the codebase-indexes directory for results." 