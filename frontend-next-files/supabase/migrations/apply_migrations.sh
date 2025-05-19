#!/bin/bash
# Script to apply pending migrations manually

# Configuration
MIGRATIONS_DIR=$(realpath "$(dirname "$0")")
PENDING_DIR="$MIGRATIONS_DIR/pending"
APPLIED_DIR="$MIGRATIONS_DIR/applied"
PROJECT_ROOT="$MIGRATIONS_DIR/../.."

echo "Migrations directory: $MIGRATIONS_DIR"
echo "Pending directory: $PENDING_DIR"
echo "Applied directory: $APPLIED_DIR"
echo "Project root: $PROJECT_ROOT"

# Ensure directories exist
mkdir -p "$APPLIED_DIR"

# Function to apply a migration manually
apply_migration() {
  local migration_file="$1"
  local migration_name=$(basename "$migration_file")

  echo "Applying migration: $migration_name"
  echo "Migration file: $migration_file"

  if [ ! -f "$migration_file" ]; then
    echo "Error: Migration file does not exist: $migration_file"
    return 1
  fi

  # Extract the project ID from the URL in .env.local
  if [ -f "$PROJECT_ROOT/.env.local" ]; then
    DB_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$PROJECT_ROOT/.env.local" | cut -d '=' -f2)
    if [ -n "$DB_URL" ]; then
      PROJECT_ID=$(echo "$DB_URL" | sed -E 's/https:\/\/([^.]+).supabase.co/\1/')

      echo "Would you like to:"
      echo "1. Open the Supabase dashboard to run the SQL manually"
      echo "2. Skip this migration"
      read -p "Enter your choice (1-2): " choice

      case $choice in
        1)
          echo "Opening Supabase dashboard..."
          xdg-open "https://app.supabase.com/project/$PROJECT_ID/sql/new" &

          # Display the SQL content
          echo "=== SQL Content ==="
          cat "$migration_file"
          echo "=================="

          read -p "Press Enter after you've run the SQL manually... " dummy

          read -p "Was the migration successful? (y/n): " success
          if [[ $success == "y" ]]; then
            # Move the migration to the applied directory
            mv "$migration_file" "$APPLIED_DIR/"

            # Also move the rollback script if it exists
            local rollback_base="${migration_name%.sql}"
            local rollback_file="$PENDING_DIR/${rollback_base}_rollback.sql"
            if [ -f "$rollback_file" ]; then
              mv "$rollback_file" "$APPLIED_DIR/"
            fi

            return 0
          else
            echo "Migration was not successful."
            return 1
          fi
          ;;
        2)
          echo "Skipping migration: $migration_name"
          return 0
          ;;
        *)
          echo "Invalid choice. Aborting."
          return 1
          ;;
      esac
    else
      echo "Error: Could not find NEXT_PUBLIC_SUPABASE_URL in .env.local"
      return 1
    fi
  else
    echo "Error: .env.local file not found"
    return 1
  fi
}

# Get list of pending migrations
pending_migrations=$(find "$PENDING_DIR" -name "*.sql" | grep -v "rollback" | sort)

if [ -z "$pending_migrations" ]; then
  echo "No pending migrations found."
  exit 0
fi

# Apply each migration
for migration in $pending_migrations; do
  apply_migration "$migration"
  if [ $? -ne 0 ]; then
    echo "Migration failed. Stopping."
    exit 1
  fi
done

echo "All migrations applied successfully."
exit 0
