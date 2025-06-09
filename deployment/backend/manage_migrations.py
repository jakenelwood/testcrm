#!/usr/bin/env python3
"""
Database Migration Management Script
Provides CLI interface for Alembic migrations
"""
import os
import sys
import argparse
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine
from datetime import datetime

def get_database_url():
    """Get database URL from environment"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable is required")
        sys.exit(1)
    return database_url

def get_alembic_config():
    """Get Alembic configuration"""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", get_database_url())
    return alembic_cfg

def init_migrations():
    """Initialize Alembic migrations"""
    print("🔧 Initializing Alembic migrations...")
    try:
        alembic_cfg = get_alembic_config()
        command.init(alembic_cfg, "alembic")
        print("✅ Alembic initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Alembic: {e}")
        sys.exit(1)

def create_migration(message):
    """Create a new migration"""
    print(f"📝 Creating migration: {message}")
    try:
        alembic_cfg = get_alembic_config()
        command.revision(alembic_cfg, message=message, autogenerate=True)
        print("✅ Migration created successfully")
    except Exception as e:
        print(f"❌ Failed to create migration: {e}")
        sys.exit(1)

def upgrade_database(revision="head"):
    """Upgrade database to specified revision"""
    print(f"⬆️  Upgrading database to {revision}...")
    try:
        alembic_cfg = get_alembic_config()
        command.upgrade(alembic_cfg, revision)
        print("✅ Database upgraded successfully")
    except Exception as e:
        print(f"❌ Failed to upgrade database: {e}")
        sys.exit(1)

def downgrade_database(revision):
    """Downgrade database to specified revision"""
    print(f"⬇️  Downgrading database to {revision}...")
    try:
        alembic_cfg = get_alembic_config()
        command.downgrade(alembic_cfg, revision)
        print("✅ Database downgraded successfully")
    except Exception as e:
        print(f"❌ Failed to downgrade database: {e}")
        sys.exit(1)

def show_current_revision():
    """Show current database revision"""
    try:
        alembic_cfg = get_alembic_config()
        script = ScriptDirectory.from_config(alembic_cfg)
        
        # Get current revision from database
        engine = create_engine(get_database_url())
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()
        
        # Get head revision from scripts
        head_rev = script.get_current_head()
        
        print("📊 Migration Status:")
        print(f"   Current Revision: {current_rev or 'None'}")
        print(f"   Head Revision: {head_rev or 'None'}")
        print(f"   Up to Date: {'✅ Yes' if current_rev == head_rev else '❌ No'}")
        
    except Exception as e:
        print(f"❌ Failed to get migration status: {e}")
        sys.exit(1)

def show_history():
    """Show migration history"""
    print("📜 Migration History:")
    try:
        alembic_cfg = get_alembic_config()
        command.history(alembic_cfg, verbose=True)
    except Exception as e:
        print(f"❌ Failed to show history: {e}")
        sys.exit(1)

def create_initial_migration():
    """Create initial migration from current schema"""
    print("🚀 Creating initial migration from existing schema...")
    try:
        alembic_cfg = get_alembic_config()
        
        # Create initial migration
        command.revision(
            alembic_cfg, 
            message="Initial migration - CRM schema", 
            autogenerate=True
        )
        
        print("✅ Initial migration created successfully")
        print("💡 Run 'python manage_migrations.py upgrade' to apply the migration")
        
    except Exception as e:
        print(f"❌ Failed to create initial migration: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Database Migration Management")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Init command
    subparsers.add_parser("init", help="Initialize Alembic migrations")
    
    # Create migration command
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("message", help="Migration message")
    
    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade database")
    upgrade_parser.add_argument("--revision", default="head", help="Target revision (default: head)")
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade database")
    downgrade_parser.add_argument("revision", help="Target revision")
    
    # Status command
    subparsers.add_parser("status", help="Show current migration status")
    
    # History command
    subparsers.add_parser("history", help="Show migration history")
    
    # Initial migration command
    subparsers.add_parser("initial", help="Create initial migration from existing schema")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    print(f"🗄️  RonRico CRM - Database Migration Manager")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    if args.command == "init":
        init_migrations()
    elif args.command == "create":
        create_migration(args.message)
    elif args.command == "upgrade":
        upgrade_database(args.revision)
    elif args.command == "downgrade":
        downgrade_database(args.revision)
    elif args.command == "status":
        show_current_revision()
    elif args.command == "history":
        show_history()
    elif args.command == "initial":
        create_initial_migration()

if __name__ == "__main__":
    main()
