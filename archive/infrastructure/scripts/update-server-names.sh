#!/bin/bash

# Script to update all server name references from old naming to new Hetzner naming convention
# This implements DRY principle by centralizing all server name mappings

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Server name mappings (old -> new)
declare -A SERVER_MAPPINGS=(
    ["ubuntu-8gb-hil-1"]="ubuntu-8gb-hil-1"
    ["ubuntu-8gb-ash-1"]="ubuntu-8gb-ash-1" 
    ["ubuntu-8gb-ash-2"]="ubuntu-8gb-ash-2"
)

# Files to exclude from updates (generated files, node_modules, etc.)
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    ".next"
    "venv"
    "frontend-next-files/.next"
    "frontend-next-files/node_modules"
    "__pycache__"
    "*.pyc"
    "*.log"
)

# Function to build exclude arguments for find command
build_exclude_args() {
    local exclude_args=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_args="$exclude_args -not -path '*/$pattern/*' -not -name '$pattern'"
    done
    echo "$exclude_args"
}

# Function to update server names in a file
update_file() {
    local file="$1"
    local updated=false
    
    log "Processing: $file"
    
    # Create a temporary file for the updates
    local temp_file=$(mktemp)
    cp "$file" "$temp_file"
    
    # Apply all server name mappings
    for old_name in "${!SERVER_MAPPINGS[@]}"; do
        local new_name="${SERVER_MAPPINGS[$old_name]}"
        
        # Use sed to replace all occurrences
        if sed -i.bak "s/$old_name/$new_name/g" "$temp_file" 2>/dev/null; then
            # Check if any changes were made
            if ! diff -q "$file" "$temp_file" >/dev/null 2>&1; then
                updated=true
                log "  → Replaced '$old_name' with '$new_name'"
            fi
        fi
    done
    
    # If file was updated, replace the original
    if [ "$updated" = true ]; then
        mv "$temp_file" "$file"
        success "Updated: $file"
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Function to find and update all relevant files
update_all_files() {
    log "🔍 Finding files to update..."
    
    local exclude_args=$(build_exclude_args)
    local file_count=0
    local updated_count=0
    
    # Find all text files that might contain server references
    while IFS= read -r -d '' file; do
        ((file_count++))
        
        # Skip binary files
        if file "$file" | grep -q "text\|ASCII\|UTF-8\|empty"; then
            if update_file "$file"; then
                ((updated_count++))
            fi
        fi
        
    done < <(find . -type f \( \
        -name "*.md" -o \
        -name "*.txt" -o \
        -name "*.yml" -o \
        -name "*.yaml" -o \
        -name "*.sh" -o \
        -name "*.py" -o \
        -name "*.ts" -o \
        -name "*.js" -o \
        -name "*.json" -o \
        -name "*.env*" \
    \) $exclude_args -print0)
    
    log "📊 Summary:"
    log "  Files processed: $file_count"
    success "  Files updated: $updated_count"
}

# Function to validate the updates
validate_updates() {
    log "🔍 Validating updates..."
    
    local exclude_args=$(build_exclude_args)
    local remaining_refs=0
    
    for old_name in "${!SERVER_MAPPINGS[@]}"; do
        log "Checking for remaining '$old_name' references..."
        
        local found_files=$(find . -type f \( \
            -name "*.md" -o \
            -name "*.txt" -o \
            -name "*.yml" -o \
            -name "*.yaml" -o \
            -name "*.sh" -o \
            -name "*.py" -o \
            -name "*.ts" -o \
            -name "*.js" -o \
            -name "*.json" -o \
            -name "*.env*" \
        \) $exclude_args -exec grep -l "$old_name" {} \; 2>/dev/null || true)
        
        if [ -n "$found_files" ]; then
            warn "Found remaining '$old_name' references in:"
            echo "$found_files" | while read -r file; do
                echo "  - $file"
                grep -n "$old_name" "$file" | head -3 | sed 's/^/    /'
            done
            ((remaining_refs++))
        fi
    done
    
    if [ $remaining_refs -eq 0 ]; then
        success "✅ All server name references updated successfully!"
    else
        warn "⚠️  Found $remaining_refs files with remaining old server names"
        warn "These may be in generated files or require manual review"
    fi
}

# Function to show what would be changed (dry run)
dry_run() {
    log "🔍 DRY RUN: Showing what would be changed..."
    
    local exclude_args=$(build_exclude_args)
    
    for old_name in "${!SERVER_MAPPINGS[@]}"; do
        local new_name="${SERVER_MAPPINGS[$old_name]}"
        log "Would replace '$old_name' → '$new_name' in:"
        
        find . -type f \( \
            -name "*.md" -o \
            -name "*.txt" -o \
            -name "*.yml" -o \
            -name "*.yaml" -o \
            -name "*.sh" -o \
            -name "*.py" -o \
            -name "*.ts" -o \
            -name "*.js" -o \
            -name "*.json" -o \
            -name "*.env*" \
        \) $exclude_args -exec grep -l "$old_name" {} \; 2>/dev/null | while read -r file; do
            echo "  - $file"
            grep -n "$old_name" "$file" | head -2 | sed 's/^/    /'
        done
        echo
    done
}

# Main function
main() {
    log "🚀 Server Name Update Script"
    log "Updating server names to match Hetzner naming convention"
    echo
    
    # Show mappings
    log "📋 Server name mappings:"
    for old_name in "${!SERVER_MAPPINGS[@]}"; do
        log "  $old_name → ${SERVER_MAPPINGS[$old_name]}"
    done
    echo
    
    case "${1:-}" in
        "--dry-run"|"-n")
            dry_run
            ;;
        "--validate"|"-v")
            validate_updates
            ;;
        "")
            update_all_files
            echo
            validate_updates
            ;;
        *)
            echo "Usage: $0 [--dry-run|-n] [--validate|-v]"
            echo "  --dry-run, -n    Show what would be changed without making changes"
            echo "  --validate, -v   Validate that all updates were successful"
            echo "  (no args)        Perform the updates"
            exit 1
            ;;
    esac
}

# Run the script
main "$@"
