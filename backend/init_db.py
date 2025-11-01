"""
Database initialization and migration script
Ensures all tables are created with proper schema
"""
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.database.db import engine, Base
from app.models.session import SessionDB
from app.models.activity import ActivityDB
from app.models.alert import SafetyAlertDB
from app.models.child import ChildDB

def check_and_add_column(table_name: str, column_name: str, column_type: str, nullable: bool = True):
    """Check if column exists and add it if not"""
    inspector = inspect(engine)

    if not inspector.has_table(table_name):
        return False

    columns = [col['name'] for col in inspector.get_columns(table_name)]

    if column_name in columns:
        return True

    # Add the column
    nullable_str = "" if nullable else " NOT NULL DEFAULT ''"
    with engine.connect() as conn:
        conn.execute(text(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{nullable_str}"
        ))
        conn.commit()

    print(f"  ✓ Added column '{column_name}' to '{table_name}' table")
    return True

def init_database():
    """Initialize database with all tables and required columns"""

    print("Initializing database schema...")
    print()

    # Create all tables
    print("Creating/verifying tables...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ All base tables created")
    print()

    # Verify and add missing columns
    print("Checking for missing columns...")

    # Activities table
    changes = []
    if not check_and_add_column('activities', 'description', 'VARCHAR'):
        changes.append('activities.description')

    # Sessions table
    if not check_and_add_column('sessions', 'gender', 'VARCHAR'):
        changes.append('sessions.gender')

    # Children table - add deleted_at for soft deletion
    if not check_and_add_column('children', 'deleted_at', 'DATETIME'):
        changes.append('children.deleted_at')

    if not changes:
        print("  ✓ All columns exist")
    print()

    # Verify final schema
    print("Final schema verification...")
    inspector = inspect(engine)

    for table_name in ['sessions', 'activities', 'safety_alerts', 'messages', 'children']:
        if inspector.has_table(table_name):
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            print(f"  ✓ {table_name}: {', '.join(columns)}")
        else:
            print(f"  ✗ {table_name}: NOT FOUND")

    print()
    print("✓ Database initialization complete")

if __name__ == "__main__":
    try:
        init_database()
    except Exception as e:
        print(f"\n✗ Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
