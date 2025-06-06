#!/bin/bash

# 📚 Index Codebase
# Creates a detailed index of the codebase structure and key files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

OUTPUT_FILE="docs/DETAILED_CODEBASE_INDEX.md"

print_status "Generating detailed codebase index..."

# Create output directory if it doesn't exist
mkdir -p $(dirname "$OUTPUT_FILE")

# Start the markdown file
cat > "$OUTPUT_FILE" << EOF
# 🌱 GardenOS Detailed Codebase Index

This document provides a comprehensive index of the GardenOS codebase, automatically generated on $(date).

## 📁 Directory Structure

\`\`\`
$(find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort)
\`\`\`

## 📄 Key Files by Category

### 🚀 Deployment Scripts
\`\`\`
$(find ./scripts -name "*.sh" | sort)
\`\`\`

### 📊 Database Files
\`\`\`
$(find ./database -type f | sort)
\`\`\`

### ⚙️ Configuration Files
\`\`\`
$(find . -name "*.env*" -o -name "*.yml" -o -name "*.yaml" -o -name "*.cfg" -o -name "*.conf" | grep -v "node_modules" | sort)
\`\`\`

### 📝 Documentation
\`\`\`
$(find ./docs -name "*.md" | sort)
\`\`\`

## 📊 File Statistics

- Total directories: $(find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)
- Total files: $(find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)
- Shell scripts: $(find . -name "*.sh" | wc -l)
- Markdown docs: $(find . -name "*.md" | wc -l)
- SQL files: $(find . -name "*.sql" | wc -l)
- TypeScript files: $(find . -name "*.ts" | wc -l)
- JavaScript files: $(find . -name "*.js" | wc -l)

## 🔍 Git Information

### Recent Commits
\`\`\`
$(git log --pretty=format:"%h - %an, %ar : %s" -n 10)
\`\`\`

### Active Branches
\`\`\`
$(git branch -v)
\`\`\`
EOF

print_success "Codebase index generated at $OUTPUT_FILE"

# Create a summary of the database schema if SQL files exist
if [ -d "./database" ]; then
    print_status "Generating database schema summary..."
    
    DB_SCHEMA_FILE="docs/DATABASE_SCHEMA_SUMMARY.md"
    
    cat > "$DB_SCHEMA_FILE" << EOF
# 🌱 GardenOS Database Schema Summary

This document provides a summary of the database schema, automatically generated on $(date).

## 📊 Tables

EOF
    
    # Find all CREATE TABLE statements in SQL files
    for sql_file in $(find ./database -name "*.sql"); do
        echo "### From file: \`$sql_file\`" >> "$DB_SCHEMA_FILE"
        echo "" >> "$DB_SCHEMA_FILE"
        echo "\`\`\`sql" >> "$DB_SCHEMA_FILE"
        grep -A 2 -B 1 "CREATE TABLE" "$sql_file" | sed 's/--.*$//' >> "$DB_SCHEMA_FILE"
        echo "\`\`\`" >> "$DB_SCHEMA_FILE"
        echo "" >> "$DB_SCHEMA_FILE"
    done
    
    print_success "Database schema summary generated at $DB_SCHEMA_FILE"
fi

print_status "Indexing complete! You can now review the codebase structure in the generated files."