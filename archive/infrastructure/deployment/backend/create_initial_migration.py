#!/usr/bin/env python3
"""
Create initial migration from the existing comprehensive schema
This script creates the first Alembic migration based on our SQLAlchemy models
"""
import os
import sys
from datetime import datetime
from alembic.config import Config
from alembic import command

def create_initial_migration():
    """Create the initial migration"""
    print("🚀 Creating Initial Migration for RonRico CRM")
    print("=" * 50)
    
    # Ensure DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable is required")
        print("💡 Example: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        sys.exit(1)
    
    print(f"📊 Database URL: {database_url.split('@')[1] if '@' in database_url else 'localhost'}")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        
        print("📝 Creating initial migration...")
        
        # Create the initial migration with autogenerate
        command.revision(
            alembic_cfg,
            message="Initial migration - Comprehensive CRM schema with marketing analytics and AI agents",
            autogenerate=True
        )
        
        print("✅ Initial migration created successfully!")
        print()
        print("📋 Next Steps:")
        print("1. Review the generated migration file in alembic/versions/")
        print("2. Run: python manage_migrations.py upgrade")
        print("3. Verify the migration with: python manage_migrations.py status")
        print()
        print("🎯 Migration Features Included:")
        print("   ✅ Core CRM tables (Users, Clients, Leads)")
        print("   ✅ Marketing analytics (Campaigns, A/B Tests)")
        print("   ✅ AI agent infrastructure")
        print("   ✅ Asset management (Homes, Vehicles)")
        print("   ✅ Communication tracking")
        print("   ✅ Integration support (RingCentral)")
        print("   ✅ Schema versioning")
        
    except Exception as e:
        print(f"❌ Failed to create initial migration: {e}")
        print()
        print("🔧 Troubleshooting:")
        print("1. Ensure PostgreSQL is running and accessible")
        print("2. Verify DATABASE_URL is correct")
        print("3. Check that all required Python packages are installed")
        print("4. Run: pip install -r requirements.txt")
        sys.exit(1)

if __name__ == "__main__":
    create_initial_migration()
